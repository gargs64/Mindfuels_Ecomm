import pool from '../config/db.js';

/**
 * GET /api/admin/stats
 * Returns high-level dashboard statistics for the admin.
 */
export const getAdminStats = async (req, res) => {
  try {
    const [[orderStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total_orders,
        SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END) AS total_revenue,
        COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) AS paid_orders,
        COUNT(CASE WHEN payment_status != 'Paid' THEN 1 END) AS pending_orders
      FROM orders
    `);

    const [[customerStats]] = await pool.query(`
      SELECT COUNT(*) AS total_customers FROM users
    `);

    const [[todayStats]] = await pool.query(`
      SELECT COUNT(*) AS today_orders,
        SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END) AS today_revenue
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);

    return res.status(200).json({
      total_orders: orderStats.total_orders || 0,
      total_revenue: parseFloat(orderStats.total_revenue || 0).toFixed(2),
      paid_orders: orderStats.paid_orders || 0,
      pending_orders: orderStats.pending_orders || 0,
      total_customers: customerStats.total_customers || 0,
      today_orders: todayStats.today_orders || 0,
      today_revenue: parseFloat(todayStats.today_revenue || 0).toFixed(2),
    });
  } catch (error) {
    console.error('[Admin] Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};

/**
 * GET /api/admin/orders
 * Returns ALL orders with customer info, address, and shipment details.
 */
export const getAllOrders = async (req, res) => {
  try {
    const ordersQuery = `
      SELECT
        o.*,
        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        a.full_name, a.phone AS shipping_phone,
        a.address_line1, a.address_line2, a.city, a.state, a.pincode,
        s.awb_code, s.courier_name, s.tracking_url, s.status AS shipping_status,
        s.shiprocket_order_id, s.shiprocket_shipment_id
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN shipping_address a ON o.address_id = a.id
      LEFT JOIN shipments s ON o.id = s.order_id
      ORDER BY o.created_at DESC
    `;

    const [orders] = await pool.query(ordersQuery);

    // Attach items for each order
    const result = [];
    for (const order of orders) {
      const [items] = await pool.query(`
        SELECT oi.quantity, oi.price, p.title, p.image1, p.product_id
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
      `, [order.id]);

      result.push({ ...order, items });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Admin] Error fetching all orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

/**
 * GET /api/admin/orders/:id
 * Returns full detail of one specific order.
 */
export const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [[order]] = await pool.query(`
      SELECT
        o.*,
        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        a.full_name, a.phone AS shipping_phone,
        a.address_line1, a.address_line2, a.city, a.state, a.pincode,
        s.awb_code, s.courier_name, s.tracking_url, s.status AS shipping_status,
        s.shiprocket_order_id, s.shiprocket_shipment_id
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN shipping_address a ON o.address_id = a.id
      LEFT JOIN shipments s ON o.id = s.order_id
      WHERE o.id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const [items] = await pool.query(`
      SELECT oi.quantity, oi.price, p.title, p.image1, p.product_id
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [id]);

    return res.status(200).json({ ...order, items });
  } catch (error) {
    console.error('[Admin] Error fetching order detail:', error);
    return res.status(500).json({ error: 'Failed to fetch order detail' });
  }
};
