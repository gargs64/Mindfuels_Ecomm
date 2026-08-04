import { sendOrderConfirmationEmail } from './services/emailService.js';

console.log('Testing Email Service...\n');

await sendOrderConfirmationEmail({
  order: {
    id: 'TEST-001',
    total_amount: 849.00,
    created_at: new Date()
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
});

console.log('\nTest complete! Check your inbox at gargpshruti@gmail.com');
