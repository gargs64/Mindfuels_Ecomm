import pool from '../config/db.js';
import { syncProducts } from '../services/googleSheetsService.js';

/**
 * Get list of products with advanced filters, search, and pagination.
 */
export const getProducts = async (req, res) => {
  try {
    const { class: classFilter, interest, subject, search, page = 1, limit = 12 } = req.query;

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 12;
    const offset = (parsedPage - 1) * parsedLimit;

    let baseQuery = 'FROM products WHERE 1=1';
    const queryParams = [];

    // Helper to generate tag-matching clause
    // Since tags (tag1, tag2, tag3) are used interchangeably, we match filters in any tag
    const applyTagFilter = (filterValue) => {
      const items = filterValue.split(',').map(item => item.trim()).filter(Boolean);
      if (items.length === 0) return '';
      
      // Matches items in tag1, tag2, or tag3 using IN operator
      queryParams.push(items, items, items);
      return ' AND (tag1 IN (?) OR tag2 IN (?) OR tag3 IN (?))';
    };

    if (classFilter) {
      baseQuery += applyTagFilter(classFilter);
    }

    if (interest) {
      baseQuery += applyTagFilter(interest);
    }

    if (subject) {
      baseQuery += applyTagFilter(subject);
    }

    if (search) {
      baseQuery += ' AND (title LIKE ? OR description LIKE ?)';
      queryParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // 1. Get total count for pagination metadata
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countResult] = await pool.query(countQuery, queryParams);
    const totalItems = countResult[0].total;

    // 2. Fetch paginated records
    const dataQuery = `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    // Add pagination values
    queryParams.push(parsedLimit, offset);
    const [products] = await pool.query(dataQuery, queryParams);

    return res.status(200).json({
      products,
      pagination: {
        totalItems,
        currentPage: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(totalItems / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to retrieve products catalog' });
  }
};

/**
 * Get detailed information for a single product by ID.
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await pool.query('SELECT * FROM products WHERE product_id = ?', [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(products[0]);
  } catch (error) {
    console.error('Error fetching single product:', error);
    return res.status(500).json({ error: 'Failed to retrieve product details' });
  }
};

/**
 * Manually trigger Google Sheet synchronization.
 */
export const triggerGoogleSync = async (req, res) => {
  try {
    console.log(`Manual sync triggered by local user: ${req.userId || 'API'}`);
    const result = await syncProducts();
    return res.status(200).json({
      message: 'Product sync completed successfully.',
      details: result
    });
  } catch (error) {
    console.error('Manual product sync failed:', error);
    return res.status(500).json({
      error: 'Google Sheets synchronization failed',
      details: error.message
    });
  }
};
