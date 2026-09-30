import crypto from 'crypto';
import Razorpay from 'razorpay';
import pool from '../config/db.js';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '../services/emailService.js';
import { sendAdminNewOrderWhatsApp } from '../services/whatsappService.js';
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

    // 2. Validate stock availability and calculate total
    let totalAmount = 0;

    for (const item of cartItems) {
      if (item.quantity > item.stock_qty) {
        await connection.rollback();
        return res.status(400).json({
          error: `Insufficient stock for "${item.title}". Requested: ${item.quantity}, Available: ${item.stock_qty}`
        });
      }

      totalAmount += parseFloat(item.sp) * item.quantity;
    }

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
 * Verifies Razorpay payment signature, confirms the order, updates inventory, clears cart,
 * and sends the customer receipt + admin alerts. Delivery is handled locally (no courier API).
 * Payload: { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, mock_success, customer_email }
 */
export const verifyPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.userId;
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, mock_success, customer_email } = req.body;

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

    // 7. Gather order details for notifications + receipt (shipping is handled locally by the store)
    const [[userInfo], [fullOrderItems], [addressRows]] = await Promise.all([
      pool.query('SELECT name, email, phone FROM users WHERE id = ?', [userId]),
      pool.query(
        'SELECT oi.product_id, oi.quantity, oi.price, p.title, p.image1 FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = ?',
        [order_id]
      ),
      pool.query('SELECT * FROM shipping_address WHERE id = ?', [order.address_id])
    ]);
    const customer = userInfo[0] || {};
    const addr = addressRows[0] || {};

    // Prefer the email typed at checkout, fall back to the account email
    const isValidEmail = (em) => typeof em === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
    const customerEmail = isValidEmail(customer_email) ? customer_email.trim() : customer.email;
    const customerName = addr.full_name || customer.name || 'Customer';
    const createdAt = order.created_at || new Date();

    // 8. Notifications — fire-and-forget so the customer gets an instant response.
    // A notification failure never affects the confirmed order.
    const notifyPayload = {
      order: { id: order_id, total_amount: order.total_amount, created_at: createdAt, payment_id: paymentId },
      customer: { name: customerName, email: customerEmail, phone: addr.phone || customer.phone },
      items: fullOrderItems,
      address: addr
    };

    sendOrderConfirmationEmail(notifyPayload)
      .catch(e => console.error('[Email] Customer receipt error:', e.message));
    sendAdminNewOrderEmail(notifyPayload)
      .catch(e => console.error('[Email] Admin alert error:', e.message));
    sendAdminNewOrderWhatsApp({ orderId: order_id, totalAmount: order.total_amount, customerName })
      .catch(e => console.error('[WhatsApp] Admin alert error:', e.message));

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed.',
      order_id,
      payment_id: paymentId,
      created_at: createdAt,
      total_amount: order.total_amount,
      items: fullOrderItems,
      email_sent_to: customerEmail || null
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error verifying payment:', error);
    return res.status(500).json({ error: 'Failed to verify payment and capture order details' });
  } finally {
    connection.release();
  }
};

const groupByOrderId = (rows) => rows.reduce((acc, row) => {
  (acc[row.order_id] ||= []).push(row);
  return acc;
}, {});

/**
 * Retrieves the order history for the logged-in user, including items and delivery status.
 */
export const getOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const ordersQuery = `
      SELECT o.*,
             a.full_name, a.phone, a.address_line1, a.address_line2, a.city, a.state, a.pincode
      FROM orders o
      JOIN shipping_address a ON o.address_id = a.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;

    const [orders] = await pool.query(ordersQuery, [userId]);
    if (orders.length === 0) return res.status(200).json([]);

    // Fetch all items for all orders in one query (avoids one DB round-trip per order)
    const [items] = await pool.query(`
      SELECT oi.*, p.title, p.image1
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id IN (?)
    `, [orders.map(o => o.id)]);

    const itemsByOrder = groupByOrderId(items);
    const result = orders.map(order => ({ ...order, items: itemsByOrder[order.id] || [] }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching order history:', error);
    return res.status(500).json({ error: 'Failed to retrieve order history' });
  }
};
