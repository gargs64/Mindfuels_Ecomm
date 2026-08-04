import pool from '../config/db.js';
import { syncProducts } from '../services/googleSheetsService.js';

/**
 * Get list of products with advanced filters, search, and pagination.
 *
 * Tag schema in DB:
 *   tag1 = specific category value  e.g. "Art & Creativity", "All-in-One", "Story Books"
 *   tag2 = category type            e.g. "Shop By Interest", "Shop By Subject"
 *   tag3 = age/class group          e.g. "Lower Primary (Class 1 & 2), Upper Primary (Class 3 & 4)"
 *          NOTE: tag3 can contain COMMA-SEPARATED multiple class values, so we must use LIKE.
 *          NOTE: tag3 sometimes has double spaces (e.g. "U.K.G &  L.K.G"), so we normalize via REPLACE.
 */
export const getProducts = async (req, res) => {
  try {
    const { class: classFilter, interest, subject, search, page = 1, limit = 12 } = req.query;

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 12;
    const offset = (parsedPage - 1) * parsedLimit;

    let baseQuery = 'FROM products WHERE 1=1';
    const queryParams = [];

    /**
     * Applies a space-normalized check across tag1, tag2, and tag3.
     * This handles cases where tags are placed in different columns
     * or contain double spacing (e.g. "Science &  Computer" or "U.K.G &  L.K.G").
     */
    const applyTagFilter = (filterValue) => {
      const items = filterValue.split(',').map(i => i.trim()).filter(Boolean);
      if (items.length === 0) return '';
      
      const conditions = items.map(() => {
        return `(
          REPLACE(IFNULL(tag1, ''), '  ', ' ') LIKE ? OR
          REPLACE(IFNULL(tag2, ''), '  ', ' ') LIKE ? OR
          REPLACE(IFNULL(tag3, ''), '  ', ' ') LIKE ?
        )`;
      }).join(' OR ');

      items.forEach(item => {
        const normalized = item.replace(/\s+/g, ' ');
        queryParams.push(`%${normalized}%`, `%${normalized}%`, `%${normalized}%`);
      });

      return ` AND (${conditions})`;
    };

    // Class filter
    if (classFilter) {
      baseQuery += applyTagFilter(classFilter);
    }

    // Interest filter
    if (interest) {
      baseQuery += applyTagFilter(interest);
    }

    // Subject filter
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
