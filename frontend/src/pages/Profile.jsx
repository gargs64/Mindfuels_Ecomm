import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { downloadReceipt } from '../utils/receiptGenerator.js';

export default function Profile({ navigate }) {
  const { isAuthenticated, getAccessTokenSilently, user, loginWithRedirect } = useAuth0();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'addresses', 'settings'
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [profileMessage, setProfileMessage] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', state: '', pincode: '', is_default: false
  });
  const [addressMessage, setAddressMessage] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const resolveUserInfo = (u, dbName) => {
    if (!u) return { displayName: 'User', initial: 'U' };
    const ns = 'https://mindfuels.com';
    const email = u.email || '';
    const emailPrefix = email.split('@')[0].toLowerCase();
    const nickname = (u.nickname || '').toLowerCase();

    const isRealName = (str) => {
      if (!str || typeof str !== 'string') return false;
      const s = str.trim().toLowerCase();
      if (s.includes('@')) return false;
      if (s === emailPrefix || s === nickname) return false;
      return true;
    };

    if (isRealName(dbName)) {
      const name = dbName.trim();
      return { displayName: name, initial: name.charAt(0).toUpperCase() };
    }

    if (isRealName(u[`${ns}/display_name`])) {
      const name = u[`${ns}/display_name`].trim();
      return { displayName: name, initial: name.charAt(0).toUpperCase() };
    }

    const customGiven = u[`${ns}/given_name`]?.trim();
    const customFamily = u[`${ns}/family_name`]?.trim();
    if (customGiven) {
      const fullName = `${customGiven}${customFamily ? ' ' + customFamily : ''}`;
      return { displayName: fullName, initial: customGiven.charAt(0).toUpperCase() };
    }

    if (u.given_name && isRealName(u.given_name)) {
      const fullName = `${u.given_name}${u.family_name ? ' ' + u.family_name : ''}`;
      return { displayName: fullName, initial: u.given_name.charAt(0).toUpperCase() };
    }

    if (isRealName(u.name)) {
      const name = u.name.trim();
      return { displayName: name, initial: name.charAt(0).toUpperCase() };
    }

    // Handle gargpshruti -> Shruti Garg
    if (emailPrefix === 'gargpshruti' || nickname === 'gargpshruti' || (u.name && u.name.toLowerCase().includes('gargpshruti'))) {
      return { displayName: 'Shruti Garg', initial: 'S' };
    }

    // Smart handle parser (e.g. shruti.garg)
    const parts = emailPrefix.split(/[\._\-\d]+/);
    if (parts.length > 1) {
      const formatted = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      return { displayName: formatted, initial: formatted.charAt(0) };
    }

    const formatted = emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : 'User';
    return { displayName: formatted, initial: formatted.charAt(0) };
  };

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    // Set initial fallback resolved name before DB fetch finishes
    if (user) {
      const initialInfo = resolveUserInfo(user, null);
      setProfileForm(prev => ({ ...prev, name: initialInfo.displayName }));
    }
    fetchProfileData();
  }, [isAuthenticated, user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently();

      // Fetch Orders History
      const ordersResponse = await fetch(`${API_URL}/api/checkout/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      }

      await fetchAddresses(token);

      // Fetch User Profile
      const profileResponse = await fetch(`${API_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const info = resolveUserInfo(user, profileData.name);
        setProfileForm({
          name: info.displayName,
          phone: profileData.phone || ''
        });
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async (token) => {
    try {
      const t = token || await getAccessTokenSilently();
      const addressResponse = await fetch(`${API_URL}/api/addresses`, {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (addressResponse.ok) {
        const addressData = await addressResponse.json();
        setAddresses(addressData);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const handleAddressFormChange = (field, value) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    if (field === 'pincode' && value.length === 6) {
      lookupPincode(value);
    }
  };

  const lookupPincode = async (code) => {
    setPincodeLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/pincode/${code}`);
      const data = await response.json();
      if (data.valid) {
        setAddressForm(prev => ({ ...prev, city: data.city, state: data.state }));
      }
    } catch (err) {
      console.error('Pincode lookup failed:', err);
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddressLoading(true);
    setAddressMessage('');
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/api/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(addressForm)
      });
      if (response.ok) {
        setAddressMessage('Address added successfully!');
        setShowAddressForm(false);
        setAddressForm({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', is_default: false });
        await fetchAddresses();
      } else {
        const err = await response.json();
        setAddressMessage(err.error || 'Failed to add address.');
      }
    } catch (err) {
      setAddressMessage('An error occurred.');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const token = await getAccessTokenSilently();
      await fetch(`${API_URL}/api/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchAddresses();
    } catch (err) {
      console.error('Delete address failed:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px 80px 20px', fontFamily: 'var(--font-body)', maxWidth: '900px' }}>
      
      {/* Profile Header Card */}
      {(() => {
        const userInfo = resolveUserInfo(user, profileForm.name);
        return (
          <div className="glass-panel profile-header-card" style={{
            display: 'flex', gap: '20px', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', alignItems: 'center', marginBottom: '30px', position: 'relative'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF7E5F 0%, #FF5A36 100%)',
              color: '#fff', fontSize: '1.8rem', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid rgba(255,255,255,0.9)',
              boxShadow: '0 4px 14px rgba(255,90,54,0.35)',
              flexShrink: 0
            }} className="flex-center">
              {userInfo.initial}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis' }}>{userInfo.displayName}</h2>
              <p style={{ color: 'var(--dark-light)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
              {profileForm.phone && <p style={{ color: 'var(--dark-light)', fontSize: '0.85rem' }}>📞 {profileForm.phone}</p>}
            </div>
            <button onClick={() => setActiveTab('settings')} className="btn btn-secondary profile-edit-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Edit Profile
            </button>
          </div>
        );
      })()}

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', marginBottom: '24px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 20px', fontSize: '0.95rem', fontWeight: 'bold', color: activeTab === 'orders' ? 'var(--primary)' : 'var(--dark-light)',
            borderBottom: activeTab === 'orders' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
        >
          My Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          style={{
            padding: '12px 20px', fontSize: '0.95rem', fontWeight: 'bold', color: activeTab === 'addresses' ? 'var(--primary)' : 'var(--dark-light)',
            borderBottom: activeTab === 'addresses' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
        >
          My Addresses ({addresses.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '12px 20px', fontSize: '0.95rem', fontWeight: 'bold', color: activeTab === 'settings' ? 'var(--primary)' : 'var(--dark-light)',
            borderBottom: activeTab === 'settings' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
        >
          Profile Settings
        </button>
      </div>

      {/* 1. Tab content: Orders History */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '16px' }}>
              <p style={{ color: 'var(--dark-light)' }}>You haven't placed any orders yet.</p>
              <button onClick={() => navigate('/products')} className="btn btn-primary" style={{ marginTop: '16px' }}>Shop Books</button>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="glass-panel" style={{
                borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
              }}>
                {/* Order Header Summary */}
                <div style={{
                  background: 'var(--light)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', borderBottom: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: 'var(--dark-light)' }}>Ordered on:</span>{' '}
                      <strong>{new Date(order.created_at).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--dark-light)' }}>Order Reference:</span>{' '}
                      <strong>#{order.id}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--dark-light)' }}>Amount:</span>{' '}
                      <strong style={{ color: 'var(--primary)' }}>₹{order.total_amount}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--dark-light)' }}>Status:</span>{' '}
                      <span className="badge" style={{
                        background: order.payment_status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: order.payment_status === 'Paid' ? 'var(--success)' : 'var(--error)',
                        fontSize: '0.7rem'
                      }}>{order.payment_status}</span>
                    </div>
                  </div>

                  {/* Download Receipt Action Button */}
                  <button
                    onClick={() => downloadReceipt(order)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '50px',
                      background: 'rgba(255, 90, 54, 0.08)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(255, 90, 54, 0.2)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    📄 Download Receipt
                  </button>
                </div>

                {/* Items & Shipping logs */}
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="profile-order-split">
                  {/* Order items list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {order.items && order.items.map(item => (
                      <div key={item.product_id} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.85rem' }}>
                        <img src={item.image1} alt={item.title} style={{ width: '40px', height: '52px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                          <div style={{ color: 'var(--dark-light)' }}>Qty: {item.quantity} × ₹{item.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipment details & Tracking */}
                  <div style={{
                    background: 'rgba(258,250,252,0.6)', padding: '16px', borderRadius: '12px',
                    border: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px'
                  }}>
                    <h5 style={{ fontSize: '0.9rem', marginBottom: '2px', fontWeight: 'bold' }}>Delivery Tracking</h5>
                    <div><strong>Status:</strong> {order.shipping_status || 'Processing order'}</div>
                    <div><strong>Courier:</strong> {order.courier_name || 'Standard Shipping'}</div>
                    <div><strong>AWB No:</strong> <code>{order.awb_code && !order.awb_code.includes('SR-FAIL') ? order.awb_code : 'Will be assigned upon dispatch'}</code></div>
                    
                    {/* Live Tracking Button */}
                    {(() => {
                      const trackingUrl = order.tracking_url
                        ? order.tracking_url
                        : (order.awb_code && !order.awb_code.includes('SR-FAIL'))
                          ? `https://shiprocket.co/tracking/${order.awb_code}`
                          : `https://shiprocket.co/tracking/${order.id}`;

                      return (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            marginTop: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: 'var(--secondary)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            textDecoration: 'none',
                            boxShadow: '0 2px 6px rgba(74, 144, 226, 0.25)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          🚚 Track Shipment ➔
                        </a>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. Tab content: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header row with Add button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>My Saved Addresses</h3>
            <button
              onClick={() => { setShowAddressForm(!showAddressForm); setAddressMessage(''); }}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {showAddressForm ? '✕ Cancel' : '+ Add New Address'}
            </button>
          </div>

          {addressMessage && (
            <div style={{
              padding: '12px', borderRadius: '8px', fontSize: '0.9rem',
              background: addressMessage.includes('successfully') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: addressMessage.includes('successfully') ? 'var(--success)' : 'var(--error)'
            }}>
              {addressMessage}
            </div>
          )}

          {/* Add Address Form */}
          {showAddressForm && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h4 style={{ marginBottom: '16px', fontWeight: 'bold' }}>New Delivery Address</h4>
              <form onSubmit={handleAddAddress} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <input type="text" required value={addressForm.full_name}
                    onChange={e => handleAddressFormChange('full_name', e.target.value)}
                    placeholder="Receiver's full name"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)', display: 'block', marginBottom: '4px' }}>Phone *</label>
                  <input type="tel" required value={addressForm.phone}
                    onChange={e => handleAddressFormChange('phone', e.target.value)}
                    placeholder="10-digit mobile"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)', display: 'block', marginBottom: '4px' }}>Pincode *</label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" required maxLength={6} value={addressForm.pincode}
                      onChange={e => handleAddressFormChange('pincode', e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit pincode"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    {pincodeLoading && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--dark-light)' }}>...</span>}
                  </div>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)', display: 'block', marginBottom: '4px' }}>Address Line 1 *</label>
                  <input type="text" required value={addressForm.address_line1}
                    onChange={e => handleAddressFormChange('address_line1', e.target.value)}
                    placeholder="House No, Building, Street"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)', display: 'block', marginBottom: '4px' }}>Address Line 2 (Optional)</label>
                  <input type="text" value={addressForm.address_line2}
                    onChange={e => handleAddressFormChange('address_line2', e.target.value)}
                    placeholder="Landmark, Area"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)', display: 'block', marginBottom: '4px' }}>City</label>
                  <input type="text" readOnly value={addressForm.city} placeholder="Auto-filled"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: '#F1F5F9', cursor: 'not-allowed' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--dark-light)', display: 'block', marginBottom: '4px' }}>State</label>
                  <input type="text" readOnly value={addressForm.state} placeholder="Auto-filled"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: '#F1F5F9', cursor: 'not-allowed' }} />
                </div>

                <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="isDefault" checked={addressForm.is_default}
                    onChange={e => handleAddressFormChange('is_default', e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <label htmlFor="isDefault" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Set as my default address</label>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <button type="submit" disabled={addressLoading} className="btn btn-primary" style={{ padding: '12px 24px', fontWeight: 'bold' }}>
                    {addressLoading ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Address Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {addresses.length === 0 && !showAddressForm ? (
              <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', borderRadius: '16px' }}>
                <p style={{ color: 'var(--dark-light)', marginBottom: '16px' }}>No saved addresses yet.</p>
                <button onClick={() => setShowAddressForm(true)} className="btn btn-primary" style={{ padding: '10px 20px' }}>Add Your First Address</button>
              </div>
            ) : (
              addresses.map(addr => (
                <div key={addr.id} className="glass-panel" style={{
                  padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{addr.full_name}</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {addr.is_default === 1 && (
                        <span className="badge" style={{ background: 'rgba(255, 90, 54, 0.1)', color: 'var(--primary)', fontSize: '0.65rem' }}>Default</span>
                      )}
                      <button onClick={() => handleDeleteAddress(addr.id)}
                        title="Delete address"
                        style={{ color: 'var(--error)', padding: '4px', borderRadius: '50%', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.1)'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--dark-light)', lineHeight: '1.6' }}>
                    <div>{addr.address_line1}</div>
                    {addr.address_line2 && <div>{addr.address_line2}</div>}
                    <div>{addr.city}, {addr.state} - {addr.pincode}</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                    📞 {addr.phone}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {/* 3. Tab content: Profile Settings */}
      {activeTab === 'settings' && (
        <div className="glass-panel" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>Update Personal Details</h3>
          
          {profileMessage && (
            <div style={{ 
              padding: '12px', marginBottom: '20px', borderRadius: '8px', fontSize: '0.9rem',
              background: profileMessage.includes('Success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: profileMessage.includes('Success') ? 'var(--success)' : 'var(--error)'
            }}>
              {profileMessage}
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault();
            setProfileMessage('');
            try {
              const token = await getAccessTokenSilently();
              const response = await fetch(`${API_URL}/api/users/sync`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  name: profileForm.name,
                  email: user.email,
                  phone: profileForm.phone
                })
              });
              
              if (response.ok) {
                setProfileMessage('Success! Profile updated.');
              } else {
                setProfileMessage('Failed to update profile.');
              }
            } catch (err) {
              setProfileMessage('An error occurred.');
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
            
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Full Name</label>
              <input 
                type="text" 
                value={profileForm.name} 
                onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                placeholder="E.g. Shruti Garg"
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Phone Number</label>
              <input 
                type="tel" 
                value={profileForm.phone} 
                onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                placeholder="+91 9876543210"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--dark-light)', marginTop: '4px', display: 'block' }}>We need this for delivery updates.</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontWeight: 'bold' }}>
              Save Profile
            </button>
          </form>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .profile-order-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
