import axios from 'axios';
import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

// Store owner's WhatsApp number that receives "new order" alerts.
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || '9899923670';

/** Normalizes an Indian phone number to digits-only E.164 without "+", e.g. "919899923670". */
function normalizeIndianPhone(phone) {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

/**
 * Option A (recommended, free): CallMeBot — sends WhatsApp messages to your own number.
 * One-time setup: see README "WhatsApp order alerts". Needs CALLMEBOT_API_KEY in .env.
 */
async function sendViaCallMeBot(phone, text) {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  if (!apiKey) return false;

  const res = await axios.get('https://api.callmebot.com/whatsapp.php', {
    params: { phone: `+${normalizeIndianPhone(phone)}`, text, apikey: apiKey },
    timeout: 15000
  });
  const body = String(res.data || '');
  if (/error|invalid/i.test(body) && !/queued|sent/i.test(body)) {
    throw new Error(`CallMeBot rejected the message: ${body.slice(0, 200)}`);
  }
  return true;
}

/**
 * Option B: Twilio WhatsApp. Needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.
 */
async function sendViaTwilio(phone, text) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid.startsWith('your-')) return false;

  const fromNumber = (process.env.TWILIO_WHATSAPP_FROM || '+14155238886').replace(/^whatsapp:/, '');
  await twilio(sid, token).messages.create({
    from: `whatsapp:${fromNumber}`,
    to: `whatsapp:+${normalizeIndianPhone(phone)}`,
    body: text
  });
  return true;
}

/**
 * Sends "new order arrived" WhatsApp alert to the store owner.
 */
export async function sendAdminNewOrderWhatsApp({ orderId, totalAmount, customerName }) {
  const text = `new order arrived, please check Website admin panel\n\nOrder #${orderId} · ₹${parseFloat(totalAmount || 0).toFixed(2)} · ${customerName || 'Customer'}`;

  if (await sendViaCallMeBot(ADMIN_WHATSAPP_NUMBER, text)) {
    console.log(`[WhatsApp] ✅ New-order alert sent via CallMeBot for order #${orderId}`);
    return;
  }
  if (await sendViaTwilio(ADMIN_WHATSAPP_NUMBER, text)) {
    console.log(`[WhatsApp] ✅ New-order alert sent via Twilio for order #${orderId}`);
    return;
  }
  console.warn('[WhatsApp] No WhatsApp provider configured (set CALLMEBOT_API_KEY). Alert skipped.');
}
