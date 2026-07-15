import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Books a shipment via Fship API.
 * 
 * @param {Object} params
 * @param {string|number} params.orderId - Unique local Order ID
 * @param {Object} params.customer - Recipient details
 * @param {string} params.customer.name - Recipient name
 * @param {string} params.customer.email - Recipient email
 * @param {string} params.customer.phone - Recipient mobile number
 * @param {string} params.customer.address - Combined address text
 * @param {string} params.customer.pincode - 6-digit pin code
 * @param {Array} params.items - Array of items in the order
 * @param {number} params.totalAmount - Sum of all products sp * qty
 * @param {Object} params.packageDetails - Aggregated package dimensions
 * @param {number} params.packageDetails.weight - Packaged dead weight in kg
 * @param {number} params.packageDetails.length - Max product length in cm
 * @param {number} params.packageDetails.width - Max product width in cm (corresponds to breadth)
 * @param {number} params.packageDetails.height - Sum of product heights in cm
 */
export async function createFshipShipment({
  orderId,
  customer,
  items,
  totalAmount,
  packageDetails
}) {
  const baseUrl = process.env.FSHIP_BASE_URL || 'https://capi-qc.fship.in';
  const apiKey = process.env.FSHIP_API_KEY;

  if (!apiKey) {
    console.warn('Fship API Key (FSHIP_API_KEY) is missing. Skipping Fship shipment booking.');
    return {
      success: false,
      error: 'Missing FSHIP_API_KEY config. Shipment must be booked manually.',
      fallback: true
    };
  }

  // Format order date (YYYY-MM-DD HH:mm:ss or similar)
  const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Map items to Fship item format
  const fshipItems = items.map(item => ({
    name: item.title,
    sku: item.product_id,
    units: parseInt(item.quantity, 10),
    selling_price: parseFloat(item.price)
  }));

  // Structure payload as per Fship specifications
  const payload = {
    order_Id: String(orderId),
    order_Date: orderDate,
    customer_Name: customer.name,
    customer_Mobile: customer.phone,
    customer_Emailid: customer.email,
    customer_Address: customer.address,
    customer_Pincode: customer.pincode,
    total_Amount: parseFloat(totalAmount),
    payment_Mode: 'Prepaid', // Free shipping/prepaid online payments
    items: fshipItems,
    weight: parseFloat(packageDetails.weight || 0.5),
    length: parseFloat(packageDetails.length || 10.0),
    breadth: parseFloat(packageDetails.width || 10.0), // breadth is width
    height: parseFloat(packageDetails.height || 10.0)
  };

  try {
    console.log(`Booking Fship order #${orderId} with payload:`, JSON.stringify(payload, null, 2));

    const response = await axios.post(`${baseUrl}/api/createforwardorder`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'signature': apiKey
      },
      timeout: 10000 // 10s timeout
    });

    const data = response.data;
    console.log('Fship Response:', data);

    // Check if response contains success markers
    // Usually logistics APIs return status codes or flags like { status: true } or { error_code: 0 }
    if (data && (data.status === true || data.status === 'success' || data.awb_code)) {
      return {
        success: true,
        fshipOrderId: data.fship_order_id || `FS-${orderId}`,
        fshipApiOrderId: data.api_order_id || data.order_id || null,
        awbCode: data.awb_code || `AWB-TMP-${orderId}`,
        courierName: data.courier_name || 'Standard Shipping',
        trackingUrl: data.tracking_url || `https://fship.in/track?awb=${data.awb_code || ''}`,
        status: 'Booked'
      };
    } else {
      console.warn('Fship API responded with verification warnings:', data.message || data);
      return {
        success: false,
        error: data.message || 'Verification warning in Fship response',
        fallback: true
      };
    }
  } catch (error) {
    console.error('Fship API request exception:', error.response ? error.response.data : error.message);
    return {
      success: false,
      error: error.response ? JSON.stringify(error.response.data) : error.message,
      fallback: true
    };
  }
}
