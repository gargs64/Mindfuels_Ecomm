import pool from '../config/db.js';

/**
 * Get all cart items for the logged-in user, joined with product details.
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.userId;

    const query = `
      SELECT c.id, c.product_id, c.quantity, c.added_at,
             p.title, p.mrp, p.sp, p.stock_qty, p.image1,
             p.weight, p.length, p.width, p.height
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = ?
      ORDER BY c.added_at DESC
    `;

    const [items] = await pool.query(query, [userId]);
    return res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({ error: 'Failed to retrieve cart items' });
  }
};

/**
 * Add an item to the logged-in user's cart.
 * Payload: { product_id, quantity }
 */
export const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const parsedQty = parseInt(quantity, 10) || 1;
    if (parsedQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero' });
    }

    // 1. Verify product exists and check stock limits
    const [products] = await pool.query('SELECT stock_qty, title FROM products WHERE product_id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    if (product.stock_qty <= 0) {
      return res.status(400).json({ error: `Product "${product.title}" is out of stock.` });
    }

    // 2. Fetch current quantity in cart to check aggregate limit
    const [existing] = await pool.query('SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?', [userId, product_id]);
    const currentQty = existing.length > 0 ? existing[0].quantity : 0;
    
    if (currentQty + parsedQty > product.stock_qty) {
      return res.status(400).json({
        error: `Cannot add requested quantity. Available stock: ${product.stock_qty}. Already in cart: ${currentQty}.`
      });
    }

    // 3. Upsert cart item
    const query = `
      INSERT INTO cart (user_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    `;

    await pool.query(query, [userId, product_id, parsedQty]);
    return res.status(200).json({ message: 'Product added to cart successfully' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

/**
 * Update the quantity of a cart item.
 * URL Param: :product_id, Payload: { quantity }
 */
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { product_id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    const parsedQty = parseInt(quantity, 10);
    if (parsedQty <= 0) {
      // If quantity is 0 or less, delete the item instead
      await pool.query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, product_id]);
      return res.status(200).json({ message: 'Item removed from cart' });
    }

    // Check stock limits
    const [products] = await pool.query('SELECT stock_qty, title FROM products WHERE product_id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    if (parsedQty > product.stock_qty) {
      return res.status(400).json({ error: `Cannot set quantity. Available stock is ${product.stock_qty}.` });
    }

    await pool.query('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?', [parsedQty, userId, product_id]);
    return res.status(200).json({ message: 'Cart quantity updated successfully' });
  } catch (error) {
    console.error('Error updating cart:', error);
    return res.status(500).json({ error: 'Failed to update cart quantity' });
  }
};

/**
 * Remove an item from the cart.
 * URL Param: :product_id
 */
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { product_id } = req.params;

    await pool.query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, product_id]);
    return res.status(200).json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

/**
 * Merge guest cart items into the user's DB cart.
 * Payload: { items: [ { product_id, quantity }, ... ] }
 */
export const mergeCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(200).json({ message: 'No items to merge' });
    }

    // Retrieve active inventory to prevent inserting invalid/over-stocked quantities
    const [products] = await pool.query('SELECT product_id, stock_qty FROM products');
    const stockMap = {};
    products.forEach(p => {
      stockMap[p.product_id] = p.stock_qty;
    });

    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !stockMap.hasOwnProperty(product_id)) continue;

      const maxStock = stockMap[product_id];
      if (maxStock <= 0) continue;

      // Fetch existing quantity in user's DB cart
      const [existing] = await pool.query('SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?', [userId, product_id]);
      const currentQty = existing.length > 0 ? existing[0].quantity : 0;

      // Ensure total doesn't exceed stock limits
      const mergeQty = Math.min(parseInt(quantity, 10) || 1, maxStock - currentQty);
      if (mergeQty <= 0) continue;

      const query = `
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), ?)
      `;
      await pool.query(query, [userId, product_id, mergeQty, maxStock]);
    }

    return res.status(200).json({ message: 'Guest cart merged successfully' });
  } catch (error) {
    console.error('Error merging cart:', error);
    return res.status(500).json({ error: 'Failed to merge guest cart' });
  }
};
