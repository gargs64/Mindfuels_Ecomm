import pool from '../config/db.js';

// Delivery statuses the admin can set (orders are delivered locally by the store)
export const ORDER_STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

const ORDER_SELECT = `
  SELECT
    o.*,
    u.name AS customer_name,
    u.email AS customer_email,
    u.phone AS customer_phone,
    a.full_name, a.phone AS shipping_phone,
    a.address_line1, a.address_line2, a.city, a.state, a.pincode
  FROM orders o
  JOIN users u ON o.user_id = u.id
  JOIN shipping_address a ON o.address_id = a.id
`;

const ITEMS_SELECT = `
  SELECT oi.order_id, oi.quantity, oi.price, p.title, p.image1, p.product_id
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  WHERE oi.order_id IN (?)
`;

/**
 * GET /api/admin/stats
 * Returns high-level dashboard statistics for the admin.
 */
export const getAdminStats = async (req, res) => {
  try {
    const [[[orderStats]], [[customerStats]], [[todayStats]]] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total_orders,
          SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END) AS total_revenue,
          COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) AS paid_orders,
          COUNT(CASE WHEN payment_status != 'Paid' THEN 1 END) AS pending_orders,
          COUNT(CASE WHEN payment_status = 'Paid' AND status = 'Processing' THEN 1 END) AS to_deliver
        FROM orders
      `),
      pool.query('SELECT COUNT(*) AS total_customers FROM users'),
      pool.query(`
        SELECT COUNT(*) AS today_orders,
          SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END) AS today_revenue
        FROM orders
        WHERE DATE(created_at) = CURDATE()
      `)
    ]);

    return res.status(200).json({
      total_orders: orderStats.total_orders || 0,
      total_revenue: parseFloat(orderStats.total_revenue || 0).toFixed(2),
      paid_orders: orderStats.paid_orders || 0,
      pending_orders: orderStats.pending_orders || 0,
      to_deliver: orderStats.to_deliver || 0,
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
 * Returns ALL orders with customer info, address and items.
 */
export const getAllOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(`${ORDER_SELECT} ORDER BY o.created_at DESC`);
    if (orders.length === 0) return res.status(200).json([]);

    // One query for all items instead of one query per order
    const [items] = await pool.query(ITEMS_SELECT, [orders.map(o => o.id)]);
    const itemsByOrder = {};
    for (const item of items) {
      (itemsByOrder[item.order_id] ||= []).push(item);
    }

    return res.status(200).json(orders.map(order => ({ ...order, items: itemsByOrder[order.id] || [] })));
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

    const [[order]] = await pool.query(`${ORDER_SELECT} WHERE o.id = ?`, [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const [items] = await pool.query(ITEMS_SELECT, [[id]]);
    return res.status(200).json({ ...order, items });
  } catch (error) {
    console.error('[Admin] Error fetching order detail:', error);
    return res.status(500).json({ error: 'Failed to fetch order detail' });
  }
};

/**
 * PUT /api/admin/orders/:id/status
 * Payload: { status } — one of ORDER_STATUSES. Used to track local delivery progress.
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${ORDER_STATUSES.join(', ')}` });
    }

    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.status(200).json({ success: true, id: Number(id), status });
  } catch (error) {
    console.error('[Admin] Error updating order status:', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
};
