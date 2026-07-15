import pool from '../config/db.js';

async function testConnection() {
  try {
    console.log('Testing MySQL Connection Pool...');
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database!');
    
    const [rows] = await connection.query('SHOW TABLES;');
    console.log('Database tables:');
    if (rows.length === 0) {
      console.log('No tables found in database. Please run schema.sql first.');
    } else {
      rows.forEach(row => {
        console.log(` - ${Object.values(row)[0]}`);
      });
    }
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Database connection test failed:', error);
    process.exit(1);
  }
}

testConnection();
