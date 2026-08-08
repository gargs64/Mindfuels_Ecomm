/**
 * Receipt Generator for Mindfuels Orders
 * Generates and opens a printable / PDF downloadable receipt for an order.
 */

export const downloadReceipt = (order) => {
  if (!order) return;

  const receiptWindow = window.open('', '_blank');
  if (!receiptWindow) {
    alert('Please allow popups for this site to view and download your order receipt.');
    return;
  }

  const items = order.items || [];
  const totalAmount = parseFloat(order.total_amount || 0).toFixed(2);
  const orderId = order.id || order.order_id || 'N/A';
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

  const customerName = order.full_name || order.customer_name || 'Valued Customer';
  const phone = order.phone || '';
  const addressLine1 = order.address_line1 || '';
  const addressLine2 = order.address_line2 || '';
  const city = order.city || '';
  const state = order.state || '';
  const pincode = order.pincode || '';
  const fullAddress = [addressLine1, addressLine2, city, state, pincode].filter(Boolean).join(', ');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice_Receipt_Order_${orderId}_Mindfuels</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1E293B;
          margin: 0;
          padding: 40px 20px;
          background: #F8FAFC;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 36px;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          background: #FFFFFF;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #FF5A36;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .brand {
          font-size: 30px;
          font-weight: 900;
          color: #FF5A36;
          letter-spacing: -0.5px;
        }
        .brand span { color: #4A90E2; }
        .subtitle {
          font-size: 13px;
          color: #64748B;
          margin-top: 4px;
          font-weight: 500;
        }
        .invoice-title {
          font-size: 22px;
          font-weight: 800;
          color: #1E293B;
          text-align: right;
        }
        .badge-paid {
          display: inline-block;
          background: #ECFDF5;
          color: #10B981;
          border: 1px solid rgba(16,185,129,0.3);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 6px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 28px;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748B;
          margin-bottom: 8px;
          letter-spacing: 0.8px;
        }
        .info-card {
          background: #F8FAFC;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          font-size: 13px;
          line-height: 1.6;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 28px;
        }
        th {
          background: #F1F5F9;
          color: #475569;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          text-align: left;
          padding: 12px 14px;
          border-bottom: 2px solid #CBD5E1;
        }
        td {
          padding: 14px;
          font-size: 13px;
          border-bottom: 1px solid #E2E8F0;
        }
        .summary-box {
          margin-left: auto;
          width: 300px;
          font-size: 14px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          color: #475569;
        }
        .grand-total {
          font-weight: 800;
          font-size: 18px;
          color: #FF5A36;
          border-top: 2px solid #E2E8F0;
          padding-top: 12px;
          margin-top: 8px;
        }
        .footer {
          text-align: center;
          margin-top: 36px;
          padding-top: 24px;
          border-top: 1px solid #E2E8F0;
          color: #64748B;
          font-size: 12px;
          line-height: 1.6;
        }
        .actions-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          justify-content: flex-end;
        }
        .print-btn {
          background: linear-gradient(135deg, #FF7E5F 0%, #FF5A36 100%);
          color: #FFFFFF;
          border: none;
          padding: 10px 24px;
          font-weight: 700;
          border-radius: 50px;
          cursor: pointer;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(255, 90, 54, 0.3);
          transition: transform 0.2s;
        }
        .print-btn:hover { transform: translateY(-2px); }
        @media print {
          body { background: #fff; padding: 0; }
          .invoice-box { border: none; boxShadow: none; padding: 0; }
          .actions-bar { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="actions-bar">
        <button class="print-btn" onclick="window.print()">🖨️ Download / Print PDF Receipt</button>
      </div>

      <div class="invoice-box">
        <div class="header">
          <div>
            <img src="${window.location.origin}/photos/logo.png" alt="Mindfuels Logo" style="height: 46px; object-fit: contain; display: block; margin-bottom: 6px;" />
            <div class="subtitle">Trustworthy Children's Books & Activity Workbooks</div>
          </div>
          <div class="invoice-title">
            TAX INVOICE
            <div><span class="badge-paid">PAYMENT CONFIRMED</span></div>
          </div>
        </div>

        <div class="details-grid">
          <div class="info-card">
            <div class="section-title">Order Information</div>
            <div><strong>Order Ref:</strong> #${orderId}</div>
            <div><strong>Date & Time:</strong> ${orderDate}</div>
            <div><strong>Payment Mode:</strong> Prepaid (Online Razorpay)</div>
            ${order.payment_id ? `<div><strong>Transaction Ref:</strong> <code>${order.payment_id}</code></div>` : ''}
          </div>

          <div class="info-card">
            <div class="section-title">Delivery Address</div>
            <div><strong>${customerName}</strong></div>
            ${phone ? `<div>Contact: +91 ${phone}</div>` : ''}
            <div style="margin-top: 4px; color: #475569;">${fullAddress || 'Address details registered in account.'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Book Title / Item</th>
              <th style="text-align: center; width: 70px;">Qty</th>
              <th style="text-align: right; width: 110px;">Price</th>
              <th style="text-align: right; width: 110px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${items.length > 0 ? items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${item.title || item.name || 'Mindfuels Book/Workbook'}</strong></td>
                <td style="text-align: center;">${item.quantity || item.qty || 1}</td>
                <td style="text-align: right;">₹${parseFloat(item.price || item.sp || 0).toFixed(2)}</td>
                <td style="text-align: right;">₹${(parseFloat(item.price || item.sp || 0) * (item.quantity || item.qty || 1)).toFixed(2)}</td>
              </tr>
            `).join('') : `
              <tr>
                <td>1</td>
                <td><strong>Mindfuels Order Catalog Items</strong></td>
                <td style="text-align: center;">1</td>
                <td style="text-align: right;">₹${totalAmount}</td>
                <td style="text-align: right;">₹${totalAmount}</td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-row">
            <span>Items Subtotal:</span>
            <span>₹${totalAmount}</span>
          </div>
          <div class="summary-row">
            <span>Shipping & Delivery:</span>
            <span style="color: #10B981; font-weight: 700;">FREE</span>
          </div>
          <div class="summary-row grand-total">
            <span>Total Paid:</span>
            <span>₹${totalAmount}</span>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 6px 0;">Thank you for shopping with <strong>Mindfuels</strong>!</p>
          <p style="margin: 0;">For queries or support, reach out to us at <strong>support@mindfuelspublisher.com</strong> or WhatsApp <strong>+91 9899923670</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;

  receiptWindow.document.open();
  receiptWindow.document.write(html);
  receiptWindow.document.close();
};
