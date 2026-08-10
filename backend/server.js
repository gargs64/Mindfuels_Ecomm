import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Config
import pool from './config/db.js';

// Middlewares
import { generalLimiter } from './middleware/rateLimiter.js';

// Services
import { syncProducts } from './services/googleSheetsService.js';

// Routes
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import pincodeRoutes from './routes/pincodeRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Parsing JSON bodies
app.use(express.json());

// Apply general API rate limiting to all routes
app.use(generalLimiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    return res.status(200).json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    return res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Map API Routes
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/pincode', pincodeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend files if found (Hostinger deployment support)
const candidatePaths = [
  path.join(__dirname, 'public'),
  path.join(__dirname, '../public_html'),
  path.join(__dirname, '../../public_html'),
  '/home/u241066033/domains/mindfuelspublisher.com/public_html',
  '/home/u241066033/public_html',
  path.join(__dirname, '../frontend/dist')
];

// Ensure index.html actually exists in the selected directory
const staticPath = candidatePaths.find(p => fs.existsSync(path.join(p, 'index.html')));

if (staticPath) {
  console.log(`[Server] Serving frontend static assets from: ${staticPath}`);
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(staticPath, 'index.html'), (err) => {
      if (err) {
        res.status(404).json({ error: 'Page not found' });
      }
    });
  });
} else {
  // 404 Route handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  
  // Auth0 JWT check error responses
  if (err.name === 'UnauthorizedError' || err.code === 'FST_JWT_UNAUTHORIZED' || err.status === 401) {
    return res.status(401).json({ error: 'Invalid or missing authentication token.' });
  }
  
  return res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start scheduled product catalog synchronization (cron job: every 30 minutes)
cron.schedule('*/30 * * * *', async () => {
  console.log('[CRON] Starting scheduled Google Sheets catalog sync...');
  try {
    const result = await syncProducts();
    console.log('[CRON] Product sync successful:', result.message);
  } catch (error) {
    console.error('[CRON] Product sync failed:', error.message);
  }
});

// Run an initial sync on startup to guarantee the database is populated
const runInitialSync = async () => {
  try {
    console.log('[Startup] Executing initial Google Sheet product catalog sync...');
    await syncProducts();
  } catch (error) {
    console.error('[Startup] Initial product catalog sync failed (checking credentials):', error.message);
  }
};

app.listen(PORT, async () => {
  console.log(`Server running in production-grade mode on port ${PORT}`);
  await runInitialSync();
});
