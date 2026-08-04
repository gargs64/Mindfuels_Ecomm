import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Returns an initialized Twilio client, or null if not configured.
 */
function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token || sid.startsWith('your-')) {
    console.warn('[WhatsApp] Twilio credentials not configured. WhatsApp messages will be skipped.');
    return null;
  }

  return twilio(sid, token);
}

/**
 * Sends a WhatsApp message via Twilio WhatsApp Business API.
 * @param {string} toPhone - Customer's phone number (e.g. "9876543210")
 * @param {string} message - Message text body
 */
async function sendWhatsAppMessage(toPhone, message) {
  const client = getTwilioClient();
  if (!client) return;

  const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'}`;

  // Normalize Indian phone number to E.164 format
  let normalized = String(toPhone).replace(/\D/g, '');
  if (normalized.length === 10) {
    normalized = `91${normalized}`;
  }
  const to = `whatsapp:+${normalized}`;

  try {
    const msg = await client.messages.create({ from, to, body: message });
    console.log(`[WhatsApp] ✅ Message sent to ${to}. SID: ${msg.sid}`);
  } catch (err) {
    console.error(`[WhatsApp] ❌ Failed to send to ${to}:`, err.message);
  }
}

/**
 * Sends an order confirmation WhatsApp message to the customer.
 */
export async function sendOrderConfirmationWhatsApp({ orderId, customerName, customerPhone, totalAmount, items }) {
  if (!customerPhone) {
    console.warn('[WhatsApp] No phone number for customer, skipping.');
    return;
  }

  const itemLines = items
    .map(i => `  • ${i.title} × ${i.quantity} — ₹${(parseFloat(i.price) * i.quantity).toFixed(2)}`)
    .join('\n');

  const message = `
🎉 *Order Confirmed — Mindfuels*

Hi *${customerName}*! Your order has been placed successfully.

📦 *Order ID:* #${orderId}
💰 *Total Paid:* ₹${parseFloat(totalAmount).toFixed(2)}
🚚 *Delivery:* FREE (4–7 business days)

*Items Ordered:*
${itemLines}

You will receive a tracking update on this number once your books are dispatched by our courier partner.

Thank you for choosing Mindfuels! 📚✨
`.trim();

  await sendWhatsAppMessage(customerPhone, message);
}

/**
 * Sends a shipping dispatched notification.
 */
export async function sendShippingUpdateWhatsApp({ customerPhone, customerName, orderId, awbCode, courierName, trackingUrl }) {
  if (!customerPhone) return;

  const message = `
📦 *Your Order is Dispatched! — Mindfuels*

Hi *${customerName}*! Great news — your books are on their way!

📋 *Order ID:* #${orderId}
🚚 *Courier:* ${courierName}
🔖 *AWB / Tracking No:* ${awbCode}
${trackingUrl ? `🔗 *Track here:* ${trackingUrl}` : ''}

Expected delivery: 4–7 business days.

Happy Reading! 📖✨
`.trim();

  await sendWhatsAppMessage(customerPhone, message);
}
