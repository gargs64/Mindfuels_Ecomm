import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export default function Profile({ navigate }) {
  const { isAuthenticated, getAccessTokenSilently, user, loginWithRedirect } = useAuth0();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'addresses'

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    fetchProfileData();
  }, [isAuthenticated]);

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

      // Fetch Saved Addresses
      const addressResponse = await fetch(`${API_URL}/api/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (addressResponse.ok) {
        const addressData = await addressResponse.json();
        setAddresses(addressData);
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoading(false);
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
      <div className="glass-panel" style={{
        display: 'flex', gap: '20px', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', alignItems: 'center', marginBottom: '30px'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: '1.8rem',
          fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)'
        }} className="flex-center">
          {(user?.name || user?.email || 'M').charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user?.name || user?.nickname}</h2>
          <p style={{ color: 'var(--dark-light)', fontSize: '0.9rem' }}>{user?.email}</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 20px', fontSize: '0.95rem', fontWeight: 'bold', color: activeTab === 'orders' ? 'var(--primary)' : 'var(--dark-light)',
            borderBottom: activeTab === 'orders' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          My Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          style={{
            padding: '12px 20px', fontSize: '0.95rem', fontWeight: 'bold', color: activeTab === 'addresses' ? 'var(--primary)' : 'var(--dark-light)',
            borderBottom: activeTab === 'addresses' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          My Addresses ({addresses.length})
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
                  flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', borderBottom: '1px solid var(--border)'
                }}>
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
                    <span style={{ color: 'var(--dark-light)' }}>Payment Status:</span>{' '}
                    <span className="badge" style={{
                      background: order.payment_status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: order.payment_status === 'Paid' ? 'var(--success)' : 'var(--error)',
                      fontSize: '0.7rem'
                    }}>{order.payment_status}</span>
                  </div>
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

                  {/* Shipment details */}
                  <div style={{
                    background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: '12px',
                    border: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px'
                  }}>
                    <h5 style={{ fontSize: '0.9rem', marginBottom: '4px', fontWeight: 'bold' }}>Delivery Tracking</h5>
                    <div><strong>Status:</strong> {order.shipping_status || 'Processing order'}</div>
                    <div><strong>Courier:</strong> {order.courier_name || 'Standard Shipping'}</div>
                    <div><strong>AWB No:</strong> <code>{order.awb_code || 'Pending Waybill'}</code></div>
                    {order.tracking_url && (
                      <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" style={{
                        color: 'var(--secondary)', fontWeight: 600, textDecoration: 'underline', marginTop: '6px'
                      }}>
                        Live Tracking Link ➔
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. Tab content: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {addresses.length === 0 ? (
            <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', borderRadius: '16px' }}>
              <p style={{ color: 'var(--dark-light)' }}>No saved addresses found.</p>
            </div>
          ) : (
            addresses.map(addr => (
              <div key={addr.id} className="glass-panel" style={{
                padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{addr.full_name}</h4>
                  {addr.is_default === 1 && (
                    <span className="badge" style={{ background: 'rgba(255, 90, 54, 0.1)', color: 'var(--primary)', fontSize: '0.65rem' }}>Default</span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--dark-light)', lineHeight: '1.4' }}>
                  <div>{addr.address_line1}</div>
                  {addr.address_line2 && <div>{addr.address_line2}</div>}
                  <div>{addr.city}, {addr.state} - {addr.pincode}</div>
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <strong>Phone:</strong> {addr.phone}
                </div>
              </div>
            ))
          )}
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
