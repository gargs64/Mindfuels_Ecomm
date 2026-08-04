import pool from './config/db.js';

async function migrate() {
  try {
    await pool.query('ALTER TABLE shipments CHANGE COLUMN fship_order_id shiprocket_order_id VARCHAR(100) NULL');
    console.log('✅ Renamed fship_order_id -> shiprocket_order_id');
  } catch(e) {
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      console.log('ℹ️  fship_order_id already renamed (skipped)');
    } else {
      console.error('Error:', e.message);
    }
  }

  try {
    await pool.query('ALTER TABLE shipments CHANGE COLUMN fship_api_order_id shiprocket_shipment_id VARCHAR(100) NULL');
    console.log('✅ Renamed fship_api_order_id -> shiprocket_shipment_id');
  } catch(e) {
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      console.log('ℹ️  fship_api_order_id already renamed (skipped)');
    } else {
      console.error('Error:', e.message);
    }
  }

  process.exit(0);
}

migrate();
