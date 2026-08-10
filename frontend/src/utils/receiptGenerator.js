import html2pdf from 'html2pdf.js';

/**
 * Builds standard HTML string for invoice receipt
 */
const buildInvoiceHtml = (order, isStandalone = false) => {
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

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/photos/logo.png` : '/photos/logo.png';

  const bodyContent = `
    <div class="invoice-box" id="invoice-content" style="max-width: 800px; margin: auto; padding: 36px; border: 1px solid #E2E8F0; border-radius: 16px; background: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1E293B;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #FF5A36; padding-bottom: 20px; margin-bottom: 24px;">
        <div>
          <img src="${logoUrl}" alt="Mindfuels Logo" style="height: 46px; object-fit: contain; display: block; margin-bottom: 6px;" />
          <div style="font-size: 13px; color: #64748B; margin-top: 4px; font-weight: 500;">Trustworthy Children's Books & Activity Workbooks</div>
        </div>
        <div style="font-size: 22px; font-weight: 800; color: #1E293B; text-align: right;">
          TAX INVOICE
          <div><span style="display: inline-block; background: #ECFDF5; color: #10B981; border: 1px solid rgba(16,185,129,0.3); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 6px;">PAYMENT CONFIRMED</span></div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px;">
        <div style="background: #F8FAFC; padding: 16px; border-radius: 12px; border: 1px solid #E2E8F0; font-size: 13px; line-height: 1.6;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; margin-bottom: 8px;">Order Information</div>
          <div><strong>Order Ref:</strong> #${orderId}</div>
          <div><strong>Date & Time:</strong> ${orderDate}</div>
          <div><strong>Payment Mode:</strong> Prepaid (Online Razorpay)</div>
          ${order.payment_id ? `<div><strong>Transaction Ref:</strong> <code>${order.payment_id}</code></div>` : ''}
        </div>

        <div style="background: #F8FAFC; padding: 16px; border-radius: 12px; border: 1px solid #E2E8F0; font-size: 13px; line-height: 1.6;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; margin-bottom: 8px;">Delivery Address</div>
          <div><strong>${customerName}</strong></div>
          ${phone ? `<div>Contact: +91 ${phone}</div>` : ''}
          <div style="margin-top: 4px; color: #475569;">${fullAddress || 'Address details registered in account.'}</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
        <thead>
          <tr>
            <th style="background: #F1F5F9; color: #475569; font-weight: 700; font-size: 12px; text-transform: uppercase; text-align: left; padding: 12px 14px; border-bottom: 2px solid #CBD5E1; width: 40px;">#</th>
            <th style="background: #F1F5F9; color: #475569; font-weight: 700; font-size: 12px; text-transform: uppercase; text-align: left; padding: 12px 14px; border-bottom: 2px solid #CBD5E1;">Book Title / Item</th>
            <th style="background: #F1F5F9; color: #475569; font-weight: 700; font-size: 12px; text-transform: uppercase; text-align: center; padding: 12px 14px; border-bottom: 2px solid #CBD5E1; width: 70px;">Qty</th>
            <th style="background: #F1F5F9; color: #475569; font-weight: 700; font-size: 12px; text-transform: uppercase; text-align: right; padding: 12px 14px; border-bottom: 2px solid #CBD5E1; width: 110px;">Price</th>
            <th style="background: #F1F5F9; color: #475569; font-weight: 700; font-size: 12px; text-transform: uppercase; text-align: right; padding: 12px 14px; border-bottom: 2px solid #CBD5E1; width: 110px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.length > 0 ? items.map((item, idx) => `
            <tr>
              <td style="padding: 14px; font-size: 13px; border-bottom: 1px solid #E2E8F0;">${idx + 1}</td>
              <td style="padding: 14px; font-size: 13px; border-bottom: 1px solid #E2E8F0;"><strong>${item.title || item.name || 'Mindfuels Book/Workbook'}</strong></td>
              <td style="padding: 14px; font-size: 13px; border-bottom: 1px solid #E2E8F0; text-align: center;">${item.quantity || item.qty || 1}</td>
              <td style="padding: 14px; font-size: 13px; border-bottom: 1px solid #E2E8F0; text-align: right;">₹${parseFloat(item.price || item.sp || 0).toFixed(2)}</td>
              <td style="padding: 14px; font-size: 13px; border-bottom: 1px solid #E2E8F0; text-align: right;">₹${(parseFloat(item.price || item.sp || 0) * (item.quantity || item.qty || 1)).toFixed(2)}</td>
            </tr>
          `).join('') : `
            <tr>
              <td style="padding: 14px; font-size: 13px; border-bottom: 1px solid #E2E8F0;">1</td>
              <td style="padding: 14px; font-size: 13px; border-bottom: 1px solid #E2E8F0;"><strong>Mindfuels Order Catalog Items</strong></td>
              <td style="padding: 14px; font-size: 13px; border-bottom: 1px solid #E2E8F0; text-align: center;">1</td>
              <td style="padding: 14px; font-size: 13px; border-bottom: 1px solid #E2E8F0; text-align: right;">₹${totalAmount}</td>
              <td style="padding: 14px; font-size: 13px; border-bottom: 1px solid #E2E8F0; text-align: right;">₹${totalAmount}</td>
            </tr>
          `}
        </tbody>
      </table>

      <div style="margin-left: auto; width: 300px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #475569;">
          <span>Items Subtotal:</span>
          <span>₹${totalAmount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #475569;">
          <span>Shipping & Delivery:</span>
          <span style="color: #10B981; font-weight: 700;">FREE</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px 0 0 0; font-weight: 800; font-size: 18px; color: #FF5A36; border-top: 2px solid #E2E8F0; margin-top: 8px;">
          <span>Total Paid:</span>
          <span>₹${totalAmount}</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 36px; padding-top: 24px; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 12px; line-height: 1.6;">
        <p style="margin: 0 0 6px 0;">Thank you for shopping with <strong>Mindfuels</strong>!</p>
        <p style="margin: 0;">For queries or support, reach out to us at <strong>support@mindfuelspublisher.com</strong> or WhatsApp <strong>+91 9899923670</strong></p>
      </div>
    </div>
  `;

  if (!isStandalone) return bodyContent;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice_Receipt_Order_${orderId}_Mindfuels</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F8FAFC; margin: 0; padding: 40px 20px; }
        .actions-bar { display: flex; gap: 12px; margin-bottom: 24px; justify-content: flex-end; max-width: 800px; margin-left: auto; margin-right: auto; }
        .btn-action { color: #FFFFFF; border: none; padding: 10px 24px; font-weight: 700; border-radius: 50px; cursor: pointer; font-size: 14px; }
        .btn-print { background: linear-gradient(135deg, #FF7E5F 0%, #FF5A36 100%); box-shadow: 0 4px 12px rgba(255, 90, 54, 0.3); }
        @media print { body { background: #fff; padding: 0; } .invoice-box { border: none !important; box-shadow: none !important; padding: 0 !important; } .actions-bar { display: none !important; } }
      </style>
    </head>
    <body>
      <div class="actions-bar">
        <button class="btn-action btn-print" onclick="window.print()">🖨️ Print Receipt</button>
      </div>
      ${bodyContent}
    </body>
    </html>
  `;
};

/**
 * AUTOMATIC DIRECT PDF FILE DOWNLOAD (0 Popups, 0 Print Dialogs)
 * Compiles the receipt in memory and triggers direct file download of .pdf
 */
export const downloadPdfReceipt = async (order) => {
  if (!order) return;
  const orderId = order.id || order.order_id || 'N/A';

  // Create temporary offscreen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.innerHTML = buildInvoiceHtml(order, false);
  document.body.appendChild(container);

  const opt = {
    margin:       10,
    filename:     `Mindfuels_Invoice_Order_${orderId}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(container.firstElementChild).save();
  } catch (err) {
    console.error('[ReceiptGenerator] Direct PDF download failed:', err);
    // Fallback to opening printable view window if canvas fails
    downloadReceipt(order);
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Standard Printable View Window
 */
export const downloadReceipt = (order) => {
  if (!order) return;

  const receiptWindow = window.open('', '_blank');
  if (!receiptWindow) {
    alert('Please allow popups for this site to view your order receipt.');
    return;
  }

  const html = buildInvoiceHtml(order, true);
  receiptWindow.document.open();
  receiptWindow.document.write(html);
  receiptWindow.document.close();
};
