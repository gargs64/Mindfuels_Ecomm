import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// In-memory token cache to avoid re-authenticating on every request
let cachedToken = null;
let tokenExpiresAt = null;

/**
 * Authenticates with Shiprocket and returns a JWT token.
 * Caches the token for 23 hours to avoid rate limits.
 */
async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD are required in .env');
  }

  // Return cached token if still valid
  if (cachedToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
    email,
    password
  }, { timeout: 10000 });

  cachedToken = response.data.token;
  // Shiprocket tokens last 24h; refresh after 23h to be safe
  tokenExpiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);

  console.log('[Shiprocket] Authenticated successfully. Token cached for 23h.');
  return cachedToken;
}

/**
 * Creates a Shiprocket forward shipment order.
 *
 * @param {Object} params
 * @param {string|number} params.orderId - Local order ID
 * @param {Object} params.customer - Recipient details
 * @param {Array}  params.items - Order items array
 * @param {number} params.totalAmount - Total order amount
 * @param {Object} params.packageDetails - Weight/dimensions
 */
export async function createShiprocketShipment({
  orderId,
  customer,
  items,
  totalAmount,
  packageDetails
}) {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    console.warn('[Shiprocket] Credentials missing. Skipping shipment booking.');
    return {
      success: false,
      error: 'SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD not configured. Book shipment manually.',
      fallback: true
    };
  }

  try {
    const token = await getShiprocketToken();

    const orderDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Map items to Shiprocket format
    const srItems = items.map(item => ({
      name: item.title,
      sku: String(item.product_id),
      units: parseInt(item.quantity, 10),
      selling_price: parseFloat(item.price)
    }));

    // Shiprocket pickup location - must match what is configured in your Shiprocket dashboard
    const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';

    const payload = {
      order_id: String(orderId),
      order_date: orderDate,
      pickup_location: pickupLocation,
      channel_id: '',
      comment: 'Mindfuels educational book order',
      billing_customer_name: customer.name,
      billing_last_name: '',
      billing_address: customer.address,
      billing_address_2: '',
      billing_city: customer.city,
      billing_pincode: customer.pincode,
      billing_state: customer.state,
      billing_country: 'India',
      billing_email: customer.email,
      billing_phone: customer.phone,
      shipping_is_billing: true,
      order_items: srItems,
      payment_method: 'Prepaid',
      sub_total: parseFloat(totalAmount),
      length: parseFloat(packageDetails.length || 15),
      breadth: parseFloat(packageDetails.width || 15),
      height: parseFloat(packageDetails.height || 3),
      weight: parseFloat(packageDetails.weight || 0.5)
    };

    console.log(`[Shiprocket] Booking shipment for order #${orderId}...`);

    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/create/adhoc`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 15000
      }
    );

    const data = response.data;
    console.log('[Shiprocket] Order creation response:', JSON.stringify(data, null, 2));

    // Shiprocket returns order_id and shipment_id on success
    if (data && data.order_id && data.shipment_id) {
      const shiprocketOrderId = data.order_id;
      const shiprocketShipmentId = data.shipment_id;

      // Auto-assign a courier (Shiprocket picks best available)
      let awbCode = '';
      let courierName = 'Shiprocket Logistics';
      let trackingUrl = '';

      try {
        const awbResponse = await axios.post(
          `${SHIPROCKET_BASE_URL}/courier/assign/awb`,
          { shipment_id: String(shiprocketShipmentId) },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            timeout: 10000
          }
        );

        const awbData = awbResponse.data;
        if (awbData && awbData.response && awbData.response.data) {
          awbCode = awbData.response.data.awb_code || '';
          courierName = awbData.response.data.courier_name || 'Shiprocket';
          trackingUrl = awbCode
            ? `https://shiprocket.co/tracking/${awbCode}`
            : '';
          console.log(`[Shiprocket] AWB assigned: ${awbCode} via ${courierName}`);
        }
      } catch (awbErr) {
        console.warn('[Shiprocket] AWB auto-assign failed (will be assigned shortly):', awbErr.message);
        awbCode = `SR-PENDING-${orderId}`;
        courierName = 'Shiprocket (AWB Pending)';
        trackingUrl = '';
      }

      // Request pickup
      try {
        await axios.post(
          `${SHIPROCKET_BASE_URL}/courier/generate/pickup`,
          { shipment_id: [String(shiprocketShipmentId)] },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            timeout: 10000
          }
        );
        console.log(`[Shiprocket] Pickup request sent for shipment #${shiprocketShipmentId}`);
      } catch (pickupErr) {
        console.warn('[Shiprocket] Pickup request failed (can retry manually):', pickupErr.message);
      }

      return {
        success: true,
        shiprocketOrderId: String(shiprocketOrderId),
        shiprocketShipmentId: String(shiprocketShipmentId),
        awbCode,
        courierName,
        trackingUrl,
        status: 'Booked'
      };
    } else {
      console.warn('[Shiprocket] Unexpected response:', data);
      return {
        success: false,
        error: data.message || 'Unexpected response from Shiprocket',
        fallback: true
      };
    }
  } catch (error) {
    const errMsg = error.response
      ? JSON.stringify(error.response.data)
      : error.message;
    console.error('[Shiprocket] API exception:', errMsg);
    return {
      success: false,
      error: errMsg,
      fallback: true
    };
  }
}

/**
 * Step 7: Generate Manifest
 */
export async function generateManifest(shipmentIds) {
  try {
    const token = await getShiprocketToken();
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/manifests/generate`, 
      { shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds] },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response ? error.response.data : error.message };
  }
}

/**
 * Step 8: Print Manifest
 */
export async function printManifest(shipmentIds) {
  try {
    const token = await getShiprocketToken();
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/manifests/print`, 
      { shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds] },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, manifest_url: response.data.manifest_url };
  } catch (error) {
    return { success: false, error: error.response ? error.response.data : error.message };
  }
}

/**
 * Step 9: Generate Label
 */
export async function generateLabel(shipmentIds) {
  try {
    const token = await getShiprocketToken();
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/courier/generate/label`, 
      { shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds] },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, label_url: response.data.label_url };
  } catch (error) {
    return { success: false, error: error.response ? error.response.data : error.message };
  }
}

/**
 * Step 10: Print Invoice
 */
export async function printInvoice(orderIds) {
  try {
    const token = await getShiprocketToken();
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/orders/print/invoice`, 
      { ids: Array.isArray(orderIds) ? orderIds : [orderIds] },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, invoice_url: response.data.invoice_url };
  } catch (error) {
    return { success: false, error: error.response ? error.response.data : error.message };
  }
}

/**
 * Step 11: Track Shipment (AWB)
 */
export async function trackShipment(awbCode) {
  try {
    const token = await getShiprocketToken();
    const response = await axios.get(`${SHIPROCKET_BASE_URL}/courier/track/awb/${awbCode}`, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, tracking_data: response.data };
  } catch (error) {
    return { success: false, error: error.response ? error.response.data : error.message };
  }
}

/**
 * Checks courier serviceability for a delivery postcode.
 * Used during checkout to prevent placing unserviceable orders.
 */
export async function checkPincodeServiceability(deliveryPincode) {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password || email.startsWith('your-')) {
    console.warn('[Shiprocket] Credentials missing/placeholder. Skipping serviceability check.');
    return { success: false, error: 'Shiprocket not configured' };
  }

  try {
    const token = await getShiprocketToken();
    const pickupPostcode = process.env.SHIPROCKET_PICKUP_PINCODE || '110035';

    const response = await axios.get(`${SHIPROCKET_BASE_URL}/courier/serviceability/`, {
      params: {
        pickup_postcode: pickupPostcode,
        delivery_postcode: deliveryPincode,
        weight: '0.5',
        cod: '0'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 8000
    });

    const data = response.data;
    if (data && data.status === 200 && data.data && data.data.available_courier_companies && data.data.available_courier_companies.length > 0) {
      return { success: true, serviceable: true, details: data.data };
    }

    return { success: true, serviceable: false, error: 'No courier services available for this pincode.' };
  } catch (error) {
    const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('[Shiprocket Serviceability] API exception:', errMsg);
    return { success: false, error: errMsg };
  }
}
