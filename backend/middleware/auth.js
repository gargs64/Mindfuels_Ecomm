import { auth } from 'express-oauth2-jwt-bearer';
import dotenv from 'dotenv';
import pool from '../config/db.js';
import axios from 'axios';

dotenv.config();

// Ensure Issuer and Audience are defined
const authConfig = {
  audience: process.env.AUTH0_AUDIENCE || 'https://api.mindfuels.com',
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-mindfuels.us.auth0.com/',
  tokenSigningAlg: 'RS256'
};

// Middleware to check if JWT is valid
export const checkJwt = auth(authConfig);

// Authorised admin email addresses
const ADMIN_EMAILS = [
  'mindfuelspublisher@gmail.com',
  'gargpshruti@gmail.com'
];

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

    let tokenEmail = req.auth.payload.email || req.auth.payload['https://mindfuels.com/email'];

    // ── Auth0 access tokens don't include email by default ──────────────────
    // If email is missing from JWT, call Auth0 /userinfo to get the real email.
    // This is the correct OAuth2 way to retrieve the user's email claim.
    if (!tokenEmail) {
      try {
        const domain = (process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-mindfuels.us.auth0.com').replace(/\/$/, '');
        const authHeader = req.headers.authorization; // "Bearer <access_token>"
        const { data } = await axios.get(`${domain}/userinfo`, {
          headers: { Authorization: authHeader },
          timeout: 4000
        });
        tokenEmail = data.email;
        console.log(`[Auth] Got email from /userinfo: ${tokenEmail}`);
      } catch (uiErr) {
        console.warn('[Auth] /userinfo fallback failed:', uiErr.message);
      }
    }

    // Check if user exists in the DB
    const [users] = await pool.query('SELECT * FROM users WHERE auth0_id = ?', [auth0Id]);

    let user = null;
    if (users.length === 0) {
      // User doesn't exist, let's create a new record
      const email = tokenEmail || `${auth0Id}@temporary.mindfuels.com`;
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
      // If token contains real email and DB currently has temporary/different email, sync it
      if (tokenEmail && user.email !== tokenEmail) {
        await pool.query('UPDATE users SET email = ? WHERE id = ?', [tokenEmail, user.id]);
        user.email = tokenEmail;
      }
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

/**
 * Middleware: Only allow access if the logged-in user is the Mindfuels admin.
 * Must be used AFTER checkJwt + ensureUser so req.user is populated.
 */
export const requireAdmin = (req, res, next) => {
  const tokenEmail = req.auth?.payload?.email || req.auth?.payload['https://mindfuels.com/email'] || '';
  const userEmail = (req.user?.email || tokenEmail).toLowerCase().trim();

  const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail);

  if (!userEmail || !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access only.' });
  }
  next();
};
