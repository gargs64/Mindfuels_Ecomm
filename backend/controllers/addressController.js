import pool from '../config/db.js';

/**
 * Get all shipping addresses for the logged-in user.
 */
export const getAddresses = async (req, res) => {
  try {
    const userId = req.userId;
    const [addresses] = await pool.query(
      'SELECT * FROM shipping_address WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return res.status(200).json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return res.status(500).json({ error: 'Failed to retrieve shipping addresses' });
  }
};

/**
 * Add or update a shipping address.
 * Payload: { full_name, phone, address_line1, address_line2, city, state, pincode, is_default }
 */
export const addAddress = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.userId;
    const {
      full_name,
      phone,
      address_line1,
      address_line2 = '',
      city,
      state,
      pincode,
      is_default = false
    } = req.body;

    if (!full_name || !phone || !address_line1 || !city || !state || !pincode) {
      return res.status(400).json({ error: 'All fields (full_name, phone, address_line1, city, state, pincode) are required' });
    }

    await connection.beginTransaction();

    // Check if this is the user's first address
    const [existing] = await connection.query('SELECT COUNT(*) as count FROM shipping_address WHERE user_id = ?', [userId]);
    const isFirstAddress = existing[0].count === 0;

    // Determine if the new address should be default
    const makeDefault = isFirstAddress || is_default;

    if (makeDefault) {
      // Set all other addresses for this user to is_default = 0
      await connection.query('UPDATE shipping_address SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const query = `
      INSERT INTO shipping_address (user_id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.query(query, [
      userId,
      full_name.trim(),
      phone.trim(),
      address_line1.trim(),
      address_line2 ? address_line2.trim() : null,
      city.trim(),
      state.trim(),
      pincode.trim(),
      makeDefault ? 1 : 0
    ]);

    await connection.commit();

    return res.status(201).json({
      message: 'Address added successfully',
      addressId: result.insertId,
      is_default: makeDefault
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding address:', error);
    return res.status(500).json({ error: 'Failed to create shipping address' });
  } finally {
    connection.release();
  }
};

/**
 * Delete a shipping address by ID (only if it belongs to the current user).
 */
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const addressId = req.params.id;

    const [result] = await pool.query(
      'DELETE FROM shipping_address WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Address not found or unauthorized' });
    }

    return res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    return res.status(500).json({ error: 'Failed to delete address' });
  }
};

