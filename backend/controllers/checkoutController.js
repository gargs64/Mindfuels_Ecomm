import crypto from 'crypto';
import Razorpay from 'razorpay';
import pool from '../config/db.js';
import { createShiprocketShipment } from '../services/shiprocketService.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';
import { sendOrderConfirmationWhatsApp } from '../services/whatsappService.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper to initialize Razorpay client safely
const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.startsWith('your-')) {
    console.warn('Razorpay credentials missing or dummy. Operating in MOCK mode for checkout.');
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

/**
 * Creates a checkout order (saves draft to DB, initializes Razorpay order).
 * Payload: { address_id }
 */
export const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.userId;
    const { address_id } = req.body;

    if (!address_id) {
      return res.status(400).json({ error: 'Shipping Address ID is required.' });
    }

    await connection.beginTransaction();

    // 1. Fetch user's cart items from DB
    const cartQuery = `
      SELECT c.product_id, c.quantity, p.title, p.sp, p.weight, p.length, p.width, p.height, p.stock_qty
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = ?
    `;
    const [cartItems] = await connection.query(cartQuery, [userId]);

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Your shopping cart is empty.' });
    }

    // 2. Validate stock availability and calculate totals/dimensions
    let totalAmount = 0;
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;

    for (const item of cartItems) {
      if (item.quantity > item.stock_qty) {
        await connection.rollback();
        return res.status(400).json({
          error: `Insufficient stock for "${item.title}". Requested: ${item.quantity}, Available: ${item.stock_qty}`
        });
      }

      totalAmount += parseFloat(item.sp) * item.quantity;
      totalWeight += parseFloat(item.weight || 0) * item.quantity;
      
      const itemLen = parseFloat(item.length || 0);
      const itemWid = parseFloat(item.width || 0);
      const itemHgt = parseFloat(item.height || 0);
      
      if (itemLen > maxLength) maxLength = itemLen;
      if (itemWid > maxWidth) maxWidth = itemWid;
      totalHeight += itemHgt * item.quantity;
    }

    // Apply fallbacks for zero package dimensions
    if (totalWeight <= 0) totalWeight = 0.5; // standard 500g package
    if (maxLength <= 0) maxLength = 15.0;     // default book box dimensions (cm)
    if (maxWidth <= 0) maxWidth = 15.0;
    if (totalHeight <= 0) totalHeight = 3.0;

    // 3. Verify shipping address belongs to the user
    const [addresses] = await connection.query(
      'SELECT * FROM shipping_address WHERE id = ? AND user_id = ?',
      [address_id, userId]
    );
    if (addresses.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Shipping address not found.' });
    }

    // 4. Create record in orders table in Pending / Unpaid state
    // Note: Free shipping to user. shipping_charge column is 0.00 for billing
    const orderInsertQuery = `
      INSERT INTO orders (user_id, address_id, total_amount, shipping_charge, status, payment_status)
      VALUES (?, ?, ?, 0.00, 'Pending', 'Unpaid')
    `;
    const [orderResult] = await connection.query(orderInsertQuery, [userId, address_id, totalAmount]);
    const orderId = orderResult.insertId;

    // 5. Insert order items snapshots
    const itemsInsertQuery = `
      INSERT INTO order_items (order_id, product_id, quantity, price, weight, length, width, height)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    for (const item of cartItems) {
      await connection.query(itemsInsertQuery, [
        orderId,
        item.product_id,
        item.quantity,
        item.sp,
        item.weight,
        item.length,
        item.width,
        item.height
      ]);
    }

    await connection.commit();

    // 6. Handle Razorpay Order initialization
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      // Mock flow (Razorpay key is missing/dummy)
      console.log(`[MOCK MODE] Initialized draft local order #${orderId} with amount: ₹${totalAmount}`);
      return res.status(200).json({
        mock: true,
        order_id: orderId,
        razorpay_order_id: `rzp_mock_${orderId}_${Date.now()}`,
        amount: totalAmount,
        currency: 'INR'
      });
    }

    const options = {
      amount: Math.round(totalAmount * 100), // paise
      currency: 'INR',
      receipt: String(orderId),
      notes: {
        local_order_id: String(orderId),
        user_id: String(userId)
      }
    };

    const rzpOrder = await razorpay.orders.create(options);
    console.log(`Razorpay order created for local order #${orderId}: ${rzpOrder.id}`);

    return res.status(200).json({
      mock: false,
      order_id: orderId,
      razorpay_order_id: rzpOrder.id,
      amount: totalAmount,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating checkout order:', error);
    return res.status(500).json({ error: 'Failed to initiate order checkout' });
  } finally {
    connection.release();
  }
};

/**
 * Verifies Razorpay payment signature, updates inventory, books shipping via Shiprocket, and clears cart.
 * Payload: { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, mock_success }
 */
export const verifyPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.userId;
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, mock_success } = req.body;

    if (!order_id || !razorpay_order_id) {
      return res.status(400).json({ error: 'Missing required validation references.' });
    }

    // 1. Fetch the local draft order
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [order_id, userId]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const order = orders[0];

    if (order.payment_status === 'Paid') {
      return res.status(400).json({ error: 'Order has already been paid.' });
    }

    const razorpay = getRazorpayClient();
    const isMockMode = !razorpay;

    // 2. Perform Payment Signature Verification
    if (isMockMode) {
      console.log(`[MOCK MODE] Verifying mock payment for order #${order_id}`);
      if (mock_success === false) {
        return res.status(400).json({ error: 'Mock payment failed by user.' });
      }
    } else {
      if (!razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment signature verification parameters.' });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      const shasum = crypto.createHmac('sha256', keySecret);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const expectedSignature = shasum.digest('hex');

      if (expectedSignature !== razorpay_signature) {
        console.error(`Signature mismatch! Expected: ${expectedSignature}, Received: ${razorpay_signature}`);
        return res.status(400).json({ error: 'Payment signature verification failed. Untrusted request.' });
      }
    }

    // Payment is valid! Start processing transaction details
    await connection.beginTransaction();

    const paymentId = isMockMode ? `pay_mock_${order_id}_${Date.now()}` : razorpay_payment_id;
    const paymentSig = isMockMode ? 'mock_signature' : razorpay_signature;

    // 3. Update order payment status and associate transaction id
    await connection.query(
      'UPDATE orders SET status = ?, payment_status = ?, payment_id = ? WHERE id = ?',
      ['Processing', 'Paid', paymentId, order_id]
    );

    // 4. Record details in payments log table
    const paymentInsertQuery = `
      INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status, paid_at)
      VALUES (?, ?, ?, ?, ?, 'captured', NOW())
    `;
    await connection.query(paymentInsertQuery, [
      order_id,
      razorpay_order_id,
      paymentId,
      paymentSig,
      order.total_amount
    ]);

    // 5. Subtract product stock inventory
    const [orderItems] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [order_id]);
    for (const item of orderItems) {
      await connection.query(
        'UPDATE products SET stock_qty = GREATEST(stock_qty - ?, 0) WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 6. Clear user's database shopping cart
    await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    await connection.commit();

    // 7. Shipping integration (Shiprocket order creation)
    // Run outside the payment transaction to avoid locking rows during external network ops.
    const [addressInfo] = await pool.query('SELECT * FROM shipping_address WHERE id = ?', [order.address_id]);
    const address = addressInfo[0];
    const customerAddressText = `${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}, ${address.city}, ${address.state}`;

    // Get order items along with title for booking
    const [itemsWithInfo] = await pool.query(
      'SELECT oi.*, p.title FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = ?',
      [order_id]
    );

    // Re-calculate package weight & dimensions
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;

    itemsWithInfo.forEach(item => {
      totalWeight += parseFloat(item.weight || 0) * item.quantity;
      const l = parseFloat(item.length || 0);
      const w = parseFloat(item.width || 0);
      const h = parseFloat(item.height || 0);

      if (l > maxLength) maxLength = l;
      if (w > maxWidth) maxWidth = w;
      totalHeight += h * item.quantity;
    });

    if (totalWeight <= 0) totalWeight = 0.5;
    if (maxLength <= 0) maxLength = 15.0;
    if (maxWidth <= 0) maxWidth = 15.0;
    if (totalHeight <= 0) totalHeight = 3.0;

    const bookingResult = await createShiprocketShipment({
      orderId: order_id,
      customer: {
        name: address.full_name,
        email: req.user.email || `${userId}@user.mindfuels.com`,
        phone: address.phone,
        address: customerAddressText,
        city: address.city,
        state: address.state,
        pincode: address.pincode
      },
      items: itemsWithInfo,
      totalAmount: order.total_amount,
      packageDetails: {
        weight: totalWeight,
        length: maxLength,
        width: maxWidth,
        height: totalHeight
      }
    });

    // 8. Log shipment outcomes
    let dbShipment = null;
    if (bookingResult.success) {
      const shipmentInsertQuery = `
        INSERT INTO shipments (order_id, shiprocket_order_id, shiprocket_shipment_id, awb_code, courier_name, tracking_url, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Booked')
      `;
      const [shipResult] = await pool.query(shipmentInsertQuery, [
        order_id,
        bookingResult.shiprocketOrderId,
        bookingResult.shiprocketShipmentId,
        bookingResult.awbCode,
        bookingResult.courierName,
        bookingResult.trackingUrl
      ]);
      
      dbShipment = {
        id: shipResult.insertId,
        awb: bookingResult.awbCode,
        courier: bookingResult.courierName,
        trackingUrl: bookingResult.trackingUrl,
        status: 'Booked'
      };
      
      // Update order status to Processing (with shipment booked)
      await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['Processing', order_id]);
    } else {
      // Create a pending/failed shipment record so admin can book manually
      const fallbackAwb = `SR-FAIL-${order_id}`;
      const shipmentInsertQuery = `
        INSERT INTO shipments (order_id, shiprocket_order_id, shiprocket_shipment_id, awb_code, courier_name, tracking_url, status)
        VALUES (?, ?, ?, ?, 'Shiprocket', '', 'Failed')
      `;
      const [shipResult] = await pool.query(shipmentInsertQuery, [
        order_id,
        `SR-FAIL-${order_id}`,
        null,
        fallbackAwb,
      ]);

      dbShipment = {
        id: shipResult.insertId,
        awb: fallbackAwb,
        courier: 'Manual/Failed Booking',
        trackingUrl: '',
        status: 'Failed',
        error: bookingResult.error || 'Shipping API offline'
      };
    }

    // 9. Send Email Receipt + WhatsApp confirmation (non-blocking — don't fail order if this fails)
    const [userInfo] = await pool.query('SELECT name, email, phone FROM users WHERE id = ?', [userId]);
    const customer = userInfo[0] || {};

    const [fullOrderItems] = await pool.query(
      'SELECT oi.quantity, oi.price, p.title FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = ?',
      [order_id]
    );

    const [fullAddress] = await pool.query('SELECT * FROM shipping_address WHERE id = ?', [order.address_id]);
    const addr = fullAddress[0] || {};

    // Fire-and-forget — do not await so the response returns immediately
    sendOrderConfirmationEmail({
      order: { id: order_id, total_amount: order.total_amount, created_at: new Date() },
      customer: { name: customer.name || addr.full_name, email: customer.email },
      items: fullOrderItems,
      address: addr
    }).catch(e => console.error('[Email] Silent error:', e.message));

    sendOrderConfirmationWhatsApp({
      orderId: order_id,
      customerName: customer.name || addr.full_name,
      customerPhone: addr.phone || customer.phone,
      totalAmount: order.total_amount,
      items: fullOrderItems
    }).catch(e => console.error('[WhatsApp] Silent error:', e.message));

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order processed successfully.',
      order_id,
      payment_id: paymentId,
      shipment: dbShipment
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error verifying payment:', error);
    return res.status(500).json({ error: 'Failed to verify payment and capture order details' });
  } finally {
    connection.release();
  }
};

/**
 * Retrieves the order history for the logged-in user, including items and shipping status.
 */
export const getOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const ordersQuery = `
      SELECT o.*, 
             s.awb_code, s.courier_name, s.tracking_url, s.status as shipping_status,
             a.full_name, a.phone, a.address_line1, a.address_line2, a.city, a.state, a.pincode
      FROM orders o
      LEFT JOIN shipments s ON o.id = s.order_id
      JOIN shipping_address a ON o.address_id = a.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;

    const [orders] = await pool.query(ordersQuery, [userId]);

    // Gather order items for each order
    const result = [];
    for (const order of orders) {
      const itemsQuery = `
        SELECT oi.*, p.title, p.image1
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
      `;
      const [items] = await pool.query(itemsQuery, [order.id]);
      
      result.push({
        ...order,
        items
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching order history:', error);
    return res.status(500).json({ error: 'Failed to retrieve order history' });
  }
};
