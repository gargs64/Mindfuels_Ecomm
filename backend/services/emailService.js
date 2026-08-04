import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Creates and returns a NodeMailer transporter.
 * Supports Gmail App Password (simplest for small businesses).
 * Set SMTP_USER and SMTP_PASS in .env.
 */
function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass || user.startsWith('your-')) {
    console.warn('[Email] SMTP credentials not configured. Emails will be skipped.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

/**
 * Sends an order confirmation receipt to the customer and a copy to admin.
 * @param {Object} params
 */
export async function sendOrderConfirmationEmail({ order, customer, items, address }) {
  const transporter = getTransporter();
  if (!transporter) return;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;">
        <strong>${item.title}</strong>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${parseFloat(item.price).toFixed(2)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;color:#FF5A36;font-weight:bold;">
        ₹${(parseFloat(item.price) * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>Order Confirmation</title></head>
  <body style="font-family:'Segoe UI',Arial,sans-serif;background:#f8f8f8;margin:0;padding:0;">
    <div style="max-width:620px;margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#FF5A36,#ff8a70);padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:-0.5px;">🎉 Order Confirmed!</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Thank you for shopping with Mindfuels</p>
      </div>

      <!-- Order Info -->
      <div style="padding:28px 32px;">
        <div style="background:#fff9f7;border:1px solid #ffe0d9;border-radius:12px;padding:18px 24px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
            <div><span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">ORDER ID</span><strong style="color:#FF5A36;">#${order.id}</strong></div>
            <div><span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">DATE</span><strong>${orderDate}</strong></div>
            <div><span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">PAYMENT</span><span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:bold;">✓ Paid</span></div>
          </div>
        </div>

        <!-- Delivery Address -->
        <h3 style="font-size:14px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Delivery Address</h3>
        <div style="background:#f9f9f9;border-radius:10px;padding:16px;margin-bottom:24px;font-size:14px;line-height:1.7;color:#333;">
          <strong>${address.full_name}</strong><br/>
          ${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}<br/>
          ${address.city}, ${address.state} - ${address.pincode}<br/>
          📞 ${address.phone}
        </div>

        <!-- Order Items Table -->
        <h3 style="font-size:14px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Order Items</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f9f9f9;">
              <th style="padding:10px 8px;text-align:left;color:#555;font-weight:600;">Book</th>
              <th style="padding:10px 8px;text-align:center;color:#555;font-weight:600;">Qty</th>
              <th style="padding:10px 8px;text-align:right;color:#555;font-weight:600;">Price</th>
              <th style="padding:10px 8px;text-align:right;color:#555;font-weight:600;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:14px 8px;text-align:right;font-weight:bold;font-size:15px;">Shipping:</td>
              <td style="padding:14px 8px;text-align:right;color:#10b981;font-weight:bold;">FREE</td>
            </tr>
            <tr style="background:#fff9f7;">
              <td colspan="3" style="padding:14px 8px;text-align:right;font-weight:bold;font-size:16px;">Grand Total:</td>
              <td style="padding:14px 8px;text-align:right;color:#FF5A36;font-size:18px;font-weight:bold;">₹${parseFloat(order.total_amount).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Delivery Info -->
        <div style="margin-top:28px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px 20px;font-size:14px;color:#0369a1;">
          <strong>📦 Estimated Delivery:</strong> 4–7 business days<br/>
          <span style="color:#555;font-size:13px;">Tracking details will be sent to you via WhatsApp once your order is dispatched.</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
        <p style="margin:0;color:#888;font-size:13px;">Questions? Email us at <a href="mailto:${adminEmail}" style="color:#FF5A36;">${adminEmail}</a></p>
        <p style="margin:8px 0 0;color:#bbb;font-size:12px;">© ${new Date().getFullYear()} Mindfuels · Fuel Your Child's Imagination</p>
      </div>
    </div>
  </body>
  </html>
  `;

  const mailOptions = {
    from: `"Mindfuels Orders" <${process.env.SMTP_USER}>`,
    to: customer.email,
    subject: `✅ Order Confirmed #${order.id} — Mindfuels`,
    html
  };

  // Admin notification (BCC)
  const adminMailOptions = {
    from: `"Mindfuels Orders" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `🛒 New Order #${order.id} — ₹${parseFloat(order.total_amount).toFixed(2)} — ${customer.name}`,
    html: `
      <h2>New Order Received!</h2>
      <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
      <p><strong>Phone:</strong> ${customer.phone}</p>
      <p><strong>Order ID:</strong> #${order.id}</p>
      <p><strong>Amount:</strong> ₹${parseFloat(order.total_amount).toFixed(2)}</p>
      <p><strong>Ship to:</strong> ${address.address_line1}, ${address.city}, ${address.state} - ${address.pincode}</p>
      <hr/>
      <p>Log in to your Shiprocket dashboard to track and manage this shipment.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] ✅ Receipt sent to ${customer.email}`);
    await transporter.sendMail(adminMailOptions);
    console.log(`[Email] ✅ Admin notification sent to ${adminEmail}`);
  } catch (err) {
    console.error('[Email] ❌ Failed to send email:', err.message);
  }
}
