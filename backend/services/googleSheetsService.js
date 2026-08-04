import { google } from 'googleapis';
import pool from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to Google Sheets API and fetch spreadsheet rows.
 */
async function fetchSheetData() {
  // Normalize the private key: strip surrounding quotes if present, then replace escaped \n with real newlines
  const rawKey = (process.env.GOOGLE_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '');
  const privateKey = rawKey.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!privateKey || !clientEmail || !spreadsheetId) {
    throw new Error('Missing Google Sheets configuration credentials.');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Get sheet metadata to find the name of the first sheet
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetName = meta.data.sheets[0].properties.title;

  // Fetch all rows from the sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  return response.data.values || [];
}

/**
 * Synchronize products from Google Sheet into MySQL products table.
 */
export async function syncProducts() {
  try {
    console.log('Initiating Google Sheets product synchronization...');
    const rows = await fetchSheetData();
    
    if (rows.length === 0) {
      console.log('No data found in Google Sheet.');
      return { success: true, count: 0, message: 'Google Sheet is empty' };
    }

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const dataRows = rows.slice(1);

    // Map headers to column indices
    const colIndex = (colName) => headers.indexOf(colName.toLowerCase());

    const pidIdx = colIndex('product_id');
    const titleIdx = colIndex('title');
    
    if (pidIdx === -1 || titleIdx === -1) {
      throw new Error("Google Sheet must contain at least 'product_id' and 'title' columns.");
    }

    const tag1Idx = colIndex('tag1');
    const tag2Idx = colIndex('tag2');
    const tag3Idx = colIndex('tag3');
    const mrpIdx = colIndex('mrp');
    const spIdx = colIndex('sp');
    const stockIdx = colIndex('stock_qty');
    const descIdx = colIndex('description');
    const img1Idx = colIndex('image1');
    const img2Idx = colIndex('image2');
    const img3Idx = colIndex('image3');
    const img4Idx = colIndex('image4');
    const img5Idx = colIndex('image5');
    const img6Idx = colIndex('image6');
    const img7Idx = colIndex('image7');
    const weightIdx = colIndex('weight');
    const lengthIdx = colIndex('length');
    const widthIdx = colIndex('width');
    const heightIdx = colIndex('height');

    // Parse data rows
    const productsToUpsert = [];

    for (const row of dataRows) {
      const productId = row[pidIdx];
      const title = row[titleIdx];

      // Skip rows without product_id or title
      if (!productId || !productId.trim() || !title || !title.trim()) {
        continue;
      }

      const tag1 = tag1Idx !== -1 ? row[tag1Idx] || null : null;
      const tag2 = tag2Idx !== -1 ? row[tag2Idx] || null : null;
      const tag3 = tag3Idx !== -1 ? row[tag3Idx] || null : null;

      const mrp = mrpIdx !== -1 ? parseFloat(row[mrpIdx]) || 0.0 : 0.0;
      const sp = spIdx !== -1 ? parseFloat(row[spIdx]) || 0.0 : 0.0;
      const stockQty = stockIdx !== -1 ? parseInt(row[stockIdx], 10) || 0 : 0;
      const description = descIdx !== -1 ? row[descIdx] || '' : '';

      const image1 = img1Idx !== -1 ? row[img1Idx] || null : null;
      const image2 = img2Idx !== -1 ? row[img2Idx] || null : null;
      const image3 = img3Idx !== -1 ? row[img3Idx] || null : null;
      const image4 = img4Idx !== -1 ? row[img4Idx] || null : null;
      const image5 = img5Idx !== -1 ? row[img5Idx] || null : null;
      const image6 = img6Idx !== -1 ? row[img6Idx] || null : null;
      const image7 = img7Idx !== -1 ? row[img7Idx] || null : null;

      const weight = weightIdx !== -1 ? parseFloat(row[weightIdx]) || 0.000 : 0.000;
      const length = lengthIdx !== -1 ? parseFloat(row[lengthIdx]) || 0.00 : 0.00;
      const width = widthIdx !== -1 ? parseFloat(row[widthIdx]) || 0.00 : 0.00;
      const height = heightIdx !== -1 ? parseFloat(row[heightIdx]) || 0.00 : 0.00;

      productsToUpsert.push([
        productId.trim(),
        title.trim(),
        tag1 ? tag1.trim() : null,
        tag2 ? tag2.trim() : null,
        tag3 ? tag3.trim() : null,
        mrp,
        sp,
        stockQty,
        description,
        image1 ? image1.trim() : null,
        image2 ? image2.trim() : null,
        image3 ? image3.trim() : null,
        image4 ? image4.trim() : null,
        image5 ? image5.trim() : null,
        image6 ? image6.trim() : null,
        image7 ? image7.trim() : null,
        weight,
        length,
        width,
        height
      ]);
    }

    if (productsToUpsert.length === 0) {
      console.log('No valid products to insert/update.');
      return { success: true, count: 0, message: 'No valid products in sheet' };
    }

    // Execute bulk upsert in MySQL
    const query = `
      INSERT INTO products (
        product_id, title, tag1, tag2, tag3, mrp, sp, stock_qty, description,
        image1, image2, image3, image4, image5, image6, image7,
        weight, length, width, height
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        tag1 = VALUES(tag1),
        tag2 = VALUES(tag2),
        tag3 = VALUES(tag3),
        mrp = VALUES(mrp),
        sp = VALUES(sp),
        stock_qty = VALUES(stock_qty),
        description = VALUES(description),
        image1 = VALUES(image1),
        image2 = VALUES(image2),
        image3 = VALUES(image3),
        image4 = VALUES(image4),
        image5 = VALUES(image5),
        image6 = VALUES(image6),
        image7 = VALUES(image7),
        weight = VALUES(weight),
        length = VALUES(length),
        width = VALUES(width),
        height = VALUES(height)
    `;

    const [result] = await pool.query(query, [productsToUpsert]);
    console.log(`Sync completed! Rows modified/inserted: ${result.affectedRows}`);

    return {
      success: true,
      count: productsToUpsert.length,
      affectedRows: result.affectedRows,
      message: `Successfully synchronized ${productsToUpsert.length} products.`
    };
  } catch (error) {
    console.error('Error during product sync:', error);
    throw error;
  }
}
