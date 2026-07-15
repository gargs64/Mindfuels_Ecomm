import { auth } from 'express-oauth2-jwt-bearer';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

// Ensure Issuer and Audience are defined
const authConfig = {
  audience: process.env.AUTH0_AUDIENCE || 'https://api.mindfuels.com',
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-mindfuels.us.auth0.com/',
  tokenSigningAlg: 'RS256'
};

// Middleware to check if JWT is valid
export const checkJwt = auth(authConfig);

// Middleware to ensure the user exists in our local MySQL database
export const ensureUser = async (req, res, next) => {
  try {
    // req.auth is populated by checkJwt
    if (!req.auth || !req.auth.payload) {
      return res.status(401).json({ error: 'Unauthorized: Missing token payload' });
    }

    const auth0Id = req.auth.payload.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized: Missing user identifier in token' });
    }

    // Check if user exists in the DB
    const [users] = await pool.query('SELECT * FROM users WHERE auth0_id = ?', [auth0Id]);

    let user = null;
    if (users.length === 0) {
      // User doesn't exist, let's create a new record
      // Try to get email/name from common claims or custom claims if present
      const email = req.auth.payload.email || req.auth.payload['https://mindfuels.com/email'] || `${auth0Id}@temporary.mindfuels.com`;
      const name = req.auth.payload.name || req.auth.payload['https://mindfuels.com/name'] || 'Mindfuels Reader';
      
      const [result] = await pool.query(
        'INSERT INTO users (auth0_id, name, email, phone) VALUES (?, ?, ?, ?)',
        [auth0Id, name, email, '']
      );
      
      const [newUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUsers[0];
      console.log(`Created new user for Auth0 ID: ${auth0Id}`);
    } else {
      user = users[0];
    }

    // Attach user record and local ID to request context
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Error in ensureUser middleware:', error);
    return res.status(500).json({ error: 'Internal Server Error during user synchronization' });
  }
};
