// Sends a test customer receipt, admin new-order email, and admin WhatsApp alert.
// Usage: node testEmail.js
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from './services/emailService.js';
import { sendAdminNewOrderWhatsApp } from './services/whatsappService.js';

console.log('Testing order notifications...\n');

const payload = {
  order: {
    id: 'TEST-001',
    total_amount: 849.00,
    created_at: new Date(),
    payment_id: 'pay_test_123'
  },
  customer: {
    name: 'Shruti Garg',
    email: 'gargpshruti@gmail.com'  // Send test to your personal email to verify
  },
  items: [
    { title: 'Practice Assignments - Logical Reasoning (Class 3)', quantity: 2, price: 299.00 },
    { title: 'English Grammar Activity Book (Class 1)', quantity: 1, price: 251.00 }
  ],
  address: {
    full_name: 'Shruti Garg',
    address_line1: '254, Shahzada Bagh',
    address_line2: 'Inderlok',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110035',
    phone: '9811507332'
  }
};

const results = await Promise.allSettled([
  sendOrderConfirmationEmail(payload),
  sendAdminNewOrderEmail(payload),
  sendAdminNewOrderWhatsApp({ orderId: payload.order.id, totalAmount: payload.order.total_amount, customerName: payload.customer.name })
]);

['Customer receipt email', 'Admin email', 'Admin WhatsApp'].forEach((label, i) => {
  const r = results[i];
  console.log(`${label}: ${r.status === 'fulfilled' ? 'OK' : 'FAILED — ' + r.reason?.message}`);
});

process.exit(0);
