import pool from '../config/db.js';

/**
 * Synchronize or update the user profile details.
 * Payload: { name, email, phone }
 */
export const syncProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email, phone } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required to synchronize profile.' });
    }

    const updateQuery = `
      UPDATE users 
      SET name = COALESCE(?, name), 
          email = ?, 
          phone = COALESCE(?, phone, '') 
      WHERE id = ?
    `;

    await pool.query(updateQuery, [name || null, email.trim(), phone || null, userId]);

    // Fetch the updated profile
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    return res.status(200).json({
      message: 'Profile synchronized successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Error syncing profile:', error);
    return res.status(500).json({ error: 'Failed to synchronize user profile information' });
  }
};

/**
 * Get profile information for the current user.
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const [users] = await pool.query('SELECT id, auth0_id, name, email, phone, created_at FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json(users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile details' });
  }
};
