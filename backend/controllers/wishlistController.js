import pool from '../config/db.js';

/**
 * Get all wishlist items for the logged-in user.
 */
export const getWishlist = async (req, res) => {
  try {
    const userId = req.userId;

    const query = `
      SELECT w.id, w.product_id, w.added_at,
             p.title, p.mrp, p.sp, p.stock_qty, p.image1
      FROM wishlist w
      JOIN products p ON w.product_id = p.product_id
      WHERE w.user_id = ?
      ORDER BY w.added_at DESC
    `;

    const [items] = await pool.query(query, [userId]);
    return res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return res.status(500).json({ error: 'Failed to retrieve wishlist items' });
  }
};

/**
 * Add a product to the user's wishlist.
 * Payload: { product_id }
 */
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Verify product exists
    const [products] = await pool.query('SELECT product_id FROM products WHERE product_id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Insert wishlist item (ON DUPLICATE KEY UPDATE avoids duplicates)
    const query = `
      INSERT INTO wishlist (user_id, product_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE added_at = CURRENT_TIMESTAMP
    `;

    await pool.query(query, [userId, product_id]);
    return res.status(200).json({ message: 'Product added to wishlist successfully' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return res.status(500).json({ error: 'Failed to add item to wishlist' });
  }
};

/**
 * Remove a product from the user's wishlist.
 * URL Param: :product_id
 */
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const { product_id } = req.params;

    await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, product_id]);
    return res.status(200).json({ message: 'Product removed from wishlist successfully' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
};
