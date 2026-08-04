import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useCart } from '../context/CartContext.jsx';

export default function Cart({ navigate }) {
  const { isAuthenticated, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const { cartItems, loading: cartLoading, updateQuantity, removeFromCart, totalAmount, clearLocalCartOnly, refreshCart } = useCart();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  
  // Validation States
  const [pincodeError, setPincodeError] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeValid, setPincodeValid] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Success / Confirmation State
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Prefill email on login
  const { user } = useAuth0();
  useEffect(() => {
    if (user && user.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Load Saved Addresses if logged in
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          const response = await fetch(`${API_URL}/api/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            const defaultAddr = data.find(addr => addr.is_default) || data[0];
            if (defaultAddr) {
              setFullName(defaultAddr.full_name);
              setPhone(defaultAddr.phone);
              setAddressLine1(defaultAddr.address_line1);
              setAddressLine2(defaultAddr.address_line2 || '');
              setPincode(defaultAddr.pincode);
              setCity(defaultAddr.city);
              setState(defaultAddr.state);
              setPincodeValid(true);
            }
          }
        } catch (err) {
          console.error('Failed to load default addresses:', err);
        }
      }
    };
    fetchDefaultAddress();
  }, [isAuthenticated]);

  // Pincode lookup trigger (auto-resolves on 6 digits)
  useEffect(() => {
    if (pincode.length === 6) {
      triggerPincodeLookup(pincode);
    } else {
      setCity('');
      setState('');
      setPincodeValid(false);
      if (pincode.length > 0 && pincode.length < 6) {
        setPincodeError('Pincode must be 6 digits');
      } else {
        setPincodeError('');
      }
    }
  }, [pincode]);

  const triggerPincodeLookup = async (code) => {
    setPincodeLoading(true);
    setPincodeError('');
    try {
      const response = await fetch(`${API_URL}/api/pincode/${code}`);
      const data = await response.json();

      if (data.valid) {
        setCity(data.city);
        setState(data.state);
        setPincodeValid(true);
        setPincodeError('');
      } else {
        setCity('');
        setState('');
        setPincodeValid(false);
        setPincodeError(data.error || 'Pincode unserviceable');
      }
    } catch (err) {
      console.error(err);
      setPincodeError('Failed to validate pincode');
    } finally {
      setPincodeLoading(false);
    }
  };

  // Form Validation checks
  const isEmailValid = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
  const isPhoneValid = (ph) => /^[6-9]\d{9}$/.test(ph);

  const isFormValid = 
    fullName.trim().length >= 3 &&
    isPhoneValid(phone) &&
    isEmailValid(email) &&
    addressLine1.trim().length >= 5 &&
    pincodeValid &&
    city &&
    state;

  // Razorpay JS SDK script loader
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      // Save form state to local storage before redirecting so they do not lose it
      sessionStorage.setItem('pending_checkout_form', JSON.stringify({
        fullName, phone, email, addressLine1, addressLine2, pincode, city, state
      }));
      loginWithRedirect();
      return;
    }

    if (!isFormValid) return;

    setCheckoutLoading(true);
    try {
      const token = await getAccessTokenSilently();

      // 1. Save or Update address in shipping_address
      const addressResponse = await fetch(`${API_URL}/api/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state,
          pincode,
          is_default: true
        })
      });

      if (!addressResponse.ok) {
        throw new Error('Failed to save shipping address');
      }

      const addressData = await addressResponse.json();
      const addressId = addressData.addressId;

      // 2. Initialize checkout order
      const checkoutResponse = await fetch(`${API_URL}/api/checkout/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address_id: addressId })
      });

      if (!checkoutResponse.ok) {
        const errData = await checkoutResponse.json();
        throw new Error(errData.error || 'Failed to initialize payment gateway');
      }

      const rzpData = await checkoutResponse.json();

      // 3. Handle MOCK Checkouts (for sandbox setups without active secrets)
      if (rzpData.mock) {
        const simulateSuccess = window.confirm(
          `[MOCK CHECKOUT] Simulated payment order created successfully.\nAmount: ₹${rzpData.amount}\nClick OK to simulate SUCCESSFUL payment, or Cancel to simulate FAILED payment.`
        );

        const verifyResponse = await fetch(`${API_URL}/api/checkout/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            order_id: rzpData.order_id,
            razorpay_order_id: rzpData.razorpay_order_id,
            mock_success: simulateSuccess
          })
        });

        const verifyResult = await verifyResponse.json();
        if (verifyResult.success) {
          setConfirmedOrderDetails(verifyResult);
          setOrderConfirmed(true);
          clearLocalCartOnly();
          refreshCart();
        } else {
          alert('Simulated payment failed / rejected.');
        }
      } else {
        // 4. Load Razorpay JS SDK and open payment sheet
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Razorpay payment gateway failed to load. Check internet connectivity.');
        }

        const options = {
          key: rzpData.key_id,
          amount: Math.round(rzpData.amount * 100), // paise
          currency: 'INR',
          name: 'Mindfuels',
          description: 'Educational Books Order',
          image: '/photos/logo.png',
          order_id: rzpData.razorpay_order_id,
          handler: async function (response) {
            setCheckoutLoading(true);
            try {
              const verifyResponse = await fetch(`${API_URL}/api/checkout/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  order_id: rzpData.order_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              const verifyResult = await verifyResponse.json();
              if (verifyResult.success) {
                setConfirmedOrderDetails(verifyResult);
                setOrderConfirmed(true);
                clearLocalCartOnly();
                refreshCart();
              } else {
                alert('Payment verification failed. Please contact support.');
              }
            } catch (err) {
              console.error(err);
              alert('Error verifying payment.');
            } finally {
              setCheckoutLoading(false);
            }
          },
          prefill: {
            name: fullName,
            email: email,
            contact: phone
          },
          theme: {
            color: '#FF5A36'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error(error);
      alert(error.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Restore form state from session storage after login redirect
  useEffect(() => {
    const pendingForm = sessionStorage.getItem('pending_checkout_form');
    if (isAuthenticated && pendingForm) {
      sessionStorage.removeItem('pending_checkout_form');
      try {
        const data = JSON.parse(pendingForm);
        setFullName(data.fullName);
        setPhone(data.phone);
        setEmail(data.email);
        setAddressLine1(data.addressLine1);
        setAddressLine2(data.addressLine2);
        setPincode(data.pincode);
        setCity(data.city);
        setState(data.state);
        setPincodeValid(true);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isAuthenticated]);

  // Order Confirmation Success Screen
  if (orderConfirmed && confirmedOrderDetails) {
    const shipment = confirmedOrderDetails.shipment || {};
    return (
      <div className="container fade-in" style={{ padding: '60px 20px', maxWidth: '650px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        
        {/* Animated Checkmark Circle */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)',
          display: 'flex', alignItems: 'center', justify: 'center', fontSize: '2.5rem', fontWeight: 'bold'
        }} className="flex-center">
          ✓
        </div>
        
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Order Placed Successfully!</h2>
        <p style={{ color: 'var(--dark-light)', fontSize: '0.95rem' }}>
          Thank you for ordering with Mindfuels. Your payment has been captured and shipment booked.
        </p>

        <div className="glass-panel" style={{ width: '100%', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div><strong>Order ID:</strong> #{confirmedOrderDetails.order_id}</div>
          <div><strong>AWB Waybill:</strong> <code>{shipment.awb || 'Preparing AWB'}</code></div>
          <div><strong>Courier Partner:</strong> {shipment.courier || 'Standard Logistics'}</div>
          {shipment.trackingUrl && (
            <div>
              <strong>Tracking Details:</strong>{' '}
              <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)', fontWeight: 600, textDecoration: 'underline' }}>
                Track Order Link
              </a>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', fontSize: '0.85rem', color: 'var(--dark-light)' }}>
            <strong>Estimated Delivery:</strong> 4–7 business days. Delivery tracking updates will also be sent to your email.
          </div>
        </div>

        {/* Option 3: WhatsApp Click-to-Chat Button */}
        <a
          href={`https://wa.me/919811507332?text=${encodeURIComponent(`Hi Mindfuels! I just placed Order #${confirmedOrderDetails.order_id}. Please confirm my order details.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '14px 24px',
            borderRadius: '12px',
            background: '#25D366',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <span>💬 Get Order Confirmation on WhatsApp</span>
        </a>

        <button onClick={() => navigate('/products')} className="btn btn-secondary" style={{ padding: '12px 30px', width: '100%' }}>
          Continue Shopping
        </button>
      </div>
    );
  }

  // Loading indicator for fetching carts
  if (cartLoading && cartItems.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Empty cart display
  if (cartItems.length === 0) {
    return (
      <div className="container fade-in" style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255, 90, 54, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.02)',
          marginBottom: '8px'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Your Shopping Cart is Empty</h2>
        <p style={{ color: 'var(--dark-light)', maxWidth: '400px', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Explore our school-trusted collections and fuel your child's imagination with premium educational books.
        </p>
        <button onClick={() => navigate('/products')} className="btn btn-primary" style={{ padding: '14px 32px', marginTop: '8px' }}>
          Browse Book Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px 80px 20px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px' }}>Shopping Cart</h1>
      
      <div className="cart-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        
        {/* Left Side: Cart Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {cartItems.map((item) => (
            <div key={item.product_id} className="glass-panel" style={{
              display: 'flex', gap: '16px', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', alignItems: 'center', position: 'relative'
            }}>
              
              {/* Product Thumbnail Cover */}
              <img src={item.image1} alt={item.title} style={{ width: '64px', height: '84px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />

              {/* Title & Pricing details */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem', marginTop: '4px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{item.sp}</span>
                  {parseFloat(item.mrp) > parseFloat(item.sp) && (
                    <span style={{ textDecoration: 'line-through', color: 'var(--dark-light)' }}>₹{item.mrp}</span>
                  )}
                  <span className="badge" style={{ background: '#F1F5F9', color: 'var(--success)', fontSize: '0.65rem' }}>Free Delivery</span>
                </div>
              </div>

              {/* Quantity Changer */}
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--border)', borderRadius: '50px' }}>
                <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} style={{ width: '32px', height: '32px', fontWeight: 'bold' }}>−</button>
                <span style={{ width: '30px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} style={{ width: '32px', height: '32px', fontWeight: 'bold' }}>+</button>
              </div>

              {/* Action: Delete Line */}
              <button onClick={() => removeFromCart(item.product_id)} style={{ color: 'var(--error)', padding: '6px' }} aria-label="Remove Item">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))}

          {/* Cart Pricing Summary details */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Pricing Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Items Total Price</span>
              <strong>₹{totalAmount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Shipping Fee</span>
              <strong style={{ color: 'var(--success)' }}>FREE</strong>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
              <span>Subtotal Amount</span>
              <strong style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>₹{totalAmount}</strong>
            </div>
          </div>
        </div>

        {/* Right Side: Shipping Form details */}
        <div style={{ height: 'fit-content' }}>
          <form onSubmit={handleCheckoutSubmit} className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Shipping Address</h3>
            
            {/* Input: Full Name */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)' }}>Full Name *</label>
              <input
                type="text"
                required
                placeholder="Receiver name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '4px' }}
              />
              {fullName && fullName.trim().length < 3 && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '2px' }}>Name must be at least 3 characters</div>
              )}
            </div>

            {/* Input: Phone */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)' }}>Mobile Number *</label>
              <input
                type="tel"
                required
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '4px' }}
              />
              {phone && !isPhoneValid(phone) && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '2px' }}>Enter a valid 10-digit phone (e.g. 9876543210)</div>
              )}
            </div>

            {/* Input: Email */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)' }}>Email Address *</label>
              <input
                type="email"
                required
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '4px' }}
              />
              {email && !isEmailValid(email) && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '2px' }}>Enter a valid email address</div>
              )}
            </div>

            {/* Input: Address Line 1 */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)' }}>Address Line 1 *</label>
              <input
                type="text"
                required
                placeholder="House No, Building, Street"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '4px' }}
              />
              {addressLine1 && addressLine1.trim().length < 5 && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '2px' }}>Address must be at least 5 characters</div>
              )}
            </div>

            {/* Input: Address Line 2 */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)' }}>Address Line 2 (Optional)</label>
              <input
                type="text"
                placeholder="Landmark, Area, Sector"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '4px' }}
              />
            </div>

            {/* Input: Pincode */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)' }}>Pincode *</label>
              <div style={{ display: 'flex', gap: '8px', position: 'relative', alignItems: 'center' }}>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6-digit code"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '4px' }}
                />
                {pincodeLoading && (
                  <span style={{ position: 'absolute', right: '12px', top: '14px' }}>
                    <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                  </span>
                )}
              </div>
              {pincodeError && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '2px' }}>{pincodeError}</div>
              )}
            </div>

            {/* Auto-filled: City & State */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)' }}>City</label>
                <input
                  type="text"
                  readOnly
                  placeholder="Auto-filled"
                  value={city}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: '#F1F5F9', marginTop: '4px', cursor: 'not-allowed' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)' }}>State</label>
                <input
                  type="text"
                  readOnly
                  placeholder="Auto-filled"
                  value={state}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: '#F1F5F9', marginTop: '4px', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            {/* Validation warning hint */}
            {isAuthenticated && !isFormValid && (
              <div style={{ color: 'var(--error)', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', padding: '8px', borderRadius: '8px' }}>
                Please fill in all required fields (*) correctly.
              </div>
            )}

            {/* Submit checkout Pay Button */}
            <button
              type="submit"
              disabled={checkoutLoading}
              className={`btn btn-primary ${checkoutLoading ? 'btn-disabled' : ''}`}
              style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '10px' }}
            >
              {checkoutLoading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '3px', borderTopColor: '#fff' }}></div>
              ) : !isAuthenticated ? (
                'Login to Complete Purchase'
              ) : (
                `Pay Now (₹${totalAmount})`
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .cart-grid-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
