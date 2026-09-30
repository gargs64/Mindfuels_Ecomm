import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import dotenv from 'dotenv';
dotenv.config();

// Where "new order" alerts go. Override with ADMIN_NOTIFY_EMAIL (comma-separated for several).
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'gargpshruti@gmail.com';
const SUPPORT_WHATSAPP = '+91 9899923670';
const SITE_URL = process.env.FRONTEND_URL || 'https://mindfuelspublisher.com';

let cachedTransporter;

/**
 * Creates (once) and returns a NodeMailer transporter.
 * Uses a Gmail App Password: set SMTP_USER and SMTP_PASS in .env.
 */
function getTransporter() {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass || user.startsWith('your-')) {
    console.warn('[Email] SMTP credentials not configured. Emails will be skipped.');
    cachedTransporter = null;
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    auth: { user, pass }
  });
  return cachedTransporter;
}

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const money = (n) => parseFloat(n || 0).toFixed(2);

const formatDate = (d) => new Date(d || Date.now()).toLocaleString('en-IN', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
});

const formatAddressLines = (address) => [
  [address.address_line1, address.address_line2].filter(Boolean).join(', '),
  `${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`
];

/**
 * Renders the order receipt as a PDF Buffer (attached to the customer email).
 * PDFKit's built-in fonts have no ₹ glyph, so amounts use "Rs.".
 */
function buildReceiptPdf({ order, customer, items, address }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const orange = '#FF5A36';
    const grey = '#64748B';
    const left = 50;
    const right = 545;

    // Header
    doc.fillColor(orange).font('Helvetica-Bold').fontSize(24).text('Mindfuels', left, 50);
    doc.fillColor(grey).font('Helvetica').fontSize(9).text("Children's Books & Activity Workbooks", left, 78);
    doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(16).text('ORDER RECEIPT', 300, 50, { width: right - 300, align: 'right' });
    doc.fillColor('#10B981').fontSize(9).text('PAYMENT CONFIRMED', 300, 72, { width: right - 300, align: 'right' });
    doc.moveTo(left, 100).lineTo(right, 100).lineWidth(2).strokeColor(orange).stroke();

    // Order + address blocks
    let y = 115;
    doc.fillColor(grey).font('Helvetica-Bold').fontSize(9).text('ORDER DETAILS', left, y);
    doc.text('DELIVER TO', 300, y);
    y += 14;
    doc.fillColor('#1E293B').font('Helvetica').fontSize(10);
    doc.text(`Order ID: #${order.id}`, left, y);
    doc.text(`Date: ${formatDate(order.created_at)}`, left, y + 14);
    doc.text('Payment: Prepaid (Online)', left, y + 28);
    if (order.payment_id) doc.text(`Transaction: ${order.payment_id}`, left, y + 42, { width: 230 });

    doc.font('Helvetica-Bold').text(address.full_name || customer.name || '', 300, y, { width: 245 });
    doc.font('Helvetica');
    const [line1, line2] = formatAddressLines(address);
    doc.text(line1, 300, doc.y, { width: 245 });
    doc.text(line2, 300, doc.y, { width: 245 });
    if (address.phone) doc.text(`Phone: +91 ${address.phone}`, 300, doc.y, { width: 245 });

    // Items table
    y = Math.max(doc.y, y + 60) + 20;
    const cols = { n: left, title: left + 25, qty: 360, price: 410, total: 475 };
    doc.rect(left, y - 5, right - left, 20).fill('#F1F5F9');
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9);
    doc.text('#', cols.n + 4, y);
    doc.text('ITEM', cols.title, y);
    doc.text('QTY', cols.qty, y, { width: 40, align: 'center' });
    doc.text('PRICE', cols.price, y, { width: 60, align: 'right' });
    doc.text('TOTAL', cols.total, y, { width: 70, align: 'right' });
    y += 22;

    doc.font('Helvetica').fontSize(10).fillColor('#1E293B');
    items.forEach((item, idx) => {
      const titleHeight = doc.heightOfString(item.title || 'Book', { width: cols.qty - cols.title - 10 });
      if (y + titleHeight > 740) { doc.addPage(); y = 50; }
      doc.text(String(idx + 1), cols.n + 4, y);
      doc.text(item.title || 'Book', cols.title, y, { width: cols.qty - cols.title - 10 });
      doc.text(String(item.quantity), cols.qty, y, { width: 40, align: 'center' });
      doc.text(`Rs. ${money(item.price)}`, cols.price, y, { width: 60, align: 'right' });
      doc.text(`Rs. ${money(parseFloat(item.price) * item.quantity)}`, cols.total, y, { width: 70, align: 'right' });
      y += Math.max(titleHeight, 12) + 8;
      doc.moveTo(left, y - 4).lineTo(right, y - 4).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
    });

    // Totals
    y += 8;
    doc.fillColor(grey).text('Items Subtotal:', 330, y, { width: 130, align: 'right' });
    doc.fillColor('#1E293B').text(`Rs. ${money(order.total_amount)}`, cols.total, y, { width: 70, align: 'right' });
    y += 16;
    doc.fillColor(grey).text('Delivery:', 330, y, { width: 130, align: 'right' });
    doc.fillColor('#10B981').text('FREE', cols.total, y, { width: 70, align: 'right' });
    y += 20;
    doc.fillColor(orange).font('Helvetica-Bold').fontSize(13);
    doc.text('Total Paid:', 330, y, { width: 130, align: 'right' });
    doc.text(`Rs. ${money(order.total_amount)}`, cols.total - 20, y, { width: 90, align: 'right' });

    // Footer
    doc.fillColor(grey).font('Helvetica').fontSize(9).text(
      `Thank you for shopping with Mindfuels! Questions? WhatsApp ${SUPPORT_WHATSAPP}`,
      left, 770, { width: right - left, align: 'center' }
    );

    doc.end();
  });
}

/**
 * Sends the order confirmation email (with PDF receipt attached) to the customer.
 */
export async function sendOrderConfirmationEmail({ order, customer, items, address }) {
  const transporter = getTransporter();
  if (!transporter) return;
  if (!customer.email) {
    console.warn(`[Email] No customer email for order #${order.id}, skipping receipt.`);
    return;
  }

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;"><strong>${escapeHtml(item.title)}</strong></td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${money(item.price)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;color:#FF5A36;font-weight:bold;">₹${money(parseFloat(item.price) * item.quantity)}</td>
    </tr>
  `).join('');

  const [line1, line2] = formatAddressLines(address);

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Order Confirmation</title></head>
  <body style="font-family:'Segoe UI',Arial,sans-serif;background:#f8f8f8;margin:0;padding:0;">
    <div style="max-width:620px;margin:20px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:#FF5A36;background:linear-gradient(135deg,#FF5A36,#ff8a70);padding:28px 20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">🎉 Order Confirmed!</h1>
        <p style="color:#fff;opacity:0.9;margin:8px 0 0;font-size:15px;">Hi ${escapeHtml(customer.name)}, thank you for shopping with Mindfuels</p>
      </div>

      <div style="padding:24px 20px;">
        <table style="width:100%;background:#fff9f7;border:1px solid #ffe0d9;border-radius:12px;margin-bottom:24px;font-size:14px;" cellpadding="12">
          <tr>
            <td><span style="font-size:12px;color:#888;display:block;">ORDER ID</span><strong style="color:#FF5A36;">#${order.id}</strong></td>
            <td><span style="font-size:12px;color:#888;display:block;">DATE</span><strong>${formatDate(order.created_at)}</strong></td>
            <td><span style="font-size:12px;color:#888;display:block;">PAYMENT</span><span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:bold;">✓ Paid</span></td>
          </tr>
        </table>

        <h3 style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Delivery Address</h3>
        <div style="background:#f9f9f9;border-radius:10px;padding:16px;margin-bottom:24px;font-size:14px;line-height:1.7;color:#333;">
          <strong>${escapeHtml(address.full_name)}</strong><br/>
          ${escapeHtml(line1)}<br/>
          ${escapeHtml(line2)}<br/>
          📞 ${escapeHtml(address.phone)}
        </div>

        <h3 style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Order Items</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f9f9f9;">
              <th style="padding:10px 8px;text-align:left;color:#555;">Book</th>
              <th style="padding:10px 8px;text-align:center;color:#555;">Qty</th>
              <th style="padding:10px 8px;text-align:right;color:#555;">Price</th>
              <th style="padding:10px 8px;text-align:right;color:#555;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:12px 8px;text-align:right;font-weight:bold;">Delivery:</td>
              <td style="padding:12px 8px;text-align:right;color:#10b981;font-weight:bold;">FREE</td>
            </tr>
            <tr style="background:#fff9f7;">
              <td colspan="3" style="padding:12px 8px;text-align:right;font-weight:bold;font-size:16px;">Total Paid:</td>
              <td style="padding:12px 8px;text-align:right;color:#FF5A36;font-size:18px;font-weight:bold;">₹${money(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top:24px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px 20px;font-size:14px;color:#0369a1;">
          <strong>📦 What happens next?</strong><br/>
          <span style="color:#555;font-size:13px;">We're packing your books now and will deliver them in 4–7 business days. Your receipt is attached to this email as a PDF.
          You can also view your order anytime under <a href="${SITE_URL}/profile" style="color:#FF5A36;">My Orders</a>.</span>
        </div>
      </div>

      <div style="background:#f9f9f9;padding:20px;text-align:center;border-top:1px solid #eee;">
        <p style="margin:0;color:#888;font-size:13px;">Questions? WhatsApp us at <a href="https://wa.me/919899923670" style="color:#FF5A36;">${SUPPORT_WHATSAPP}</a></p>
        <p style="margin:8px 0 0;color:#bbb;font-size:12px;">© ${new Date().getFullYear()} Mindfuels · Fuel Your Child's Imagination</p>
      </div>
    </div>
  </body>
  </html>
  `;

  let attachments = [];
  try {
    const pdf = await buildReceiptPdf({ order, customer, items, address });
    attachments = [{ filename: `Mindfuels_Receipt_Order_${order.id}.pdf`, content: pdf, contentType: 'application/pdf' }];
  } catch (err) {
    console.error('[Email] Could not build PDF receipt, sending email without attachment:', err.message);
  }

  await transporter.sendMail({
    from: `"Mindfuels Orders" <${process.env.SMTP_USER}>`,
    to: customer.email,
    replyTo: ADMIN_NOTIFY_EMAIL.split(',')[0].trim(),
    subject: `✅ Order Confirmed #${order.id} — Mindfuels`,
    html,
    attachments
  });
  console.log(`[Email] ✅ Receipt sent to ${customer.email} for order #${order.id}`);
}

/**
 * Sends the "new order arrived" alert to the store owner.
 */
export async function sendAdminNewOrderEmail({ order, customer, items, address }) {
  const transporter = getTransporter();
  if (!transporter) return;

  const [line1, line2] = formatAddressLines(address);
  const itemLines = items
    .map(i => `<li>${escapeHtml(i.title)} × ${i.quantity} — ₹${money(parseFloat(i.price) * i.quantity)}</li>`)
    .join('');

  await transporter.sendMail({
    from: `"Mindfuels Orders" <${process.env.SMTP_USER}>`,
    to: ADMIN_NOTIFY_EMAIL,
    subject: `🛒 New order arrived #${order.id} — ₹${money(order.total_amount)}`,
    html: `
      <div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;line-height:1.6;">
        <h2 style="color:#FF5A36;margin:0 0 8px;">New order arrived, please check Website admin panel</h2>
        <p style="margin:0 0 16px;"><a href="${SITE_URL}/admin" style="color:#FF5A36;font-weight:bold;">Open Admin Panel →</a></p>
        <p><strong>Order ID:</strong> #${order.id}<br/>
           <strong>Amount:</strong> ₹${money(order.total_amount)} (Paid)<br/>
           <strong>Date:</strong> ${formatDate(order.created_at)}</p>
        <p><strong>Customer:</strong> ${escapeHtml(customer.name)}<br/>
           <strong>Email:</strong> ${escapeHtml(customer.email || '—')}<br/>
           <strong>Phone:</strong> ${escapeHtml(address.phone || customer.phone || '—')}</p>
        <p><strong>Deliver to:</strong><br/>${escapeHtml(address.full_name)}<br/>${escapeHtml(line1)}<br/>${escapeHtml(line2)}</p>
        <p><strong>Items:</strong></p>
        <ul>${itemLines}</ul>
      </div>
    `
  });
  console.log(`[Email] ✅ New-order alert sent to ${ADMIN_NOTIFY_EMAIL} for order #${order.id}`);
}
