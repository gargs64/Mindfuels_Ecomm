import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { downloadReceipt } from '../utils/receiptGenerator.js';

const ADMIN_EMAILS = [
  'mindfuelspublisher@gmail.com',
  'gargpshruti@gmail.com'
];

export default function Admin({ navigate }) {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently, loginWithRedirect } = useAuth0();

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');

  const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

  // ─── ACCESS GUARD ────────────────────────────────────────────────────────────
  // Wait for Auth0 to finish loading before making any access decision
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Not logged in → send to Auth0 login, then come back to /admin
      loginWithRedirect({ appState: { returnTo: '/admin' } });
      return;
    }

    const email = (user?.email || '').toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase() === email);

    if (!email || !isAdmin) {
      // Logged in but NOT an admin → redirect home immediately
      navigate('/');
      return;
    }

    // Admin confirmed → fetch data
    fetchData();
  }, [isLoading, isAuthenticated, user]);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setError('');

    let token = '';
    try {
      token = await getAccessTokenSilently();
    } catch (tokenErr) {
      const errCode = tokenErr?.error || tokenErr?.message || 'unknown';
      console.warn('[Admin] Silent token retrieval failed:', errCode);

      // Automatically re-authenticate if token is missing, expired, or refresh token is missing
      loginWithRedirect({ appState: { returnTo: '/admin' } });
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { headers }),
        fetch(`${API_URL}/api/admin/orders`, { headers }),
      ]);

      if (statsRes.status === 403 || ordersRes.status === 403) {
        console.warn('[Admin] Received 403 Forbidden. Redirecting to home.');
        navigate('/');
        return;
      }

      if (statsRes.status === 401 || ordersRes.status === 401) {
        console.warn('[Admin] Received 401 Unauthorized. Triggering re-login.');
        loginWithRedirect({ appState: { returnTo: '/admin' } });
        return;
      }

      if (!statsRes.ok || !ordersRes.ok) {
        const failedRes = !statsRes.ok ? statsRes : ordersRes;
        const errJson = await failedRes.json().catch(() => ({}));
        setError(`Failed to load admin data (${failedRes.status}): ${errJson.error || 'Server error. Please refresh.'}`);
        return;
      }

      setStats(await statsRes.json());
      setOrders(await ordersRes.json());
    } catch (err) {
      setError(`Connection error: ${err.message}. Please check your internet connection and refresh.`);
      console.error('[Admin]', err);
    } finally {
      setLoadingData(false);
    }
  }, [API_URL, getAccessTokenSilently, loginWithRedirect, navigate]);

  // ─── DERIVED DATA ─────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      !search ||
      String(order.id).includes(search) ||
      (order.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.customer_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.city || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'paid' && order.payment_status === 'Paid') ||
      (filterStatus === 'pending' && order.payment_status !== 'Paid');

    return matchesSearch && matchesStatus;
  });

  // ─── LOADING STATE ────────────────────────────────────────────────────────────
  if (isLoading || loadingData) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff', gap: '16px'
      }}>
        <div style={{
          width: '48px', height: '48px', border: '4px solid rgba(255,90,54,0.3)',
          borderTop: '4px solid #FF5A36', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading admin dashboard…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: '#f87171' }}>{error}</p>
          <button onClick={fetchData} style={{
            marginTop: '16px', padding: '10px 24px', background: '#FF5A36',
            color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700
          }}>Retry</button>
        </div>
      </div>
    );
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────────
  const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const isFailedAwb = (awb) => !awb || awb.includes('SR-FAIL') || awb.includes('PENDING');

  // ─── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#e2e8f0',
      fontFamily: 'var(--font-body, "Inter", sans-serif)',
      paddingTop: '70px'
    }}>
      <style>{`
        .admin-stat-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .admin-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .admin-order-row {
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          margin-bottom: 10px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .admin-order-row:hover { border-color: rgba(255,90,54,0.3); }
        .admin-order-header {
          display: grid;
          grid-template-columns: 60px 1.6fr 1.2fr 100px 110px 110px 140px;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .admin-order-header:hover { background: rgba(255,255,255,0.03); }
        .admin-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .admin-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 8px; font-weight: 700;
          font-size: 0.8rem; border: none; cursor: pointer; transition: all 0.2s;
        }
        .admin-input {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: #e2e8f0;
          padding: 10px 16px;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .admin-input:focus { border-color: rgba(255,90,54,0.5); }
        .admin-input::placeholder { color: #64748b; }
        @media (max-width: 900px) {
          .admin-order-header {
            grid-template-columns: 50px 1fr 1fr;
            grid-template-rows: auto auto;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #FF7E5F, #FF5A36)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
              }}>🛡️</div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>
                Admin Dashboard
              </h1>
            </div>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
              Welcome, Kirti Bansal · <span style={{ color: '#FF5A36' }}>{ADMIN_EMAIL}</span>
            </p>
          </div>
          <button
            onClick={fetchData}
            className="admin-btn"
            style={{ background: 'rgba(255,90,54,0.15)', color: '#FF5A36', border: '1px solid rgba(255,90,54,0.3)' }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* ── Stats Row ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '36px' }}>
            {[
              { icon: '📦', label: 'Total Orders', value: stats.total_orders, color: '#60a5fa' },
              { icon: '✅', label: 'Paid Orders', value: stats.paid_orders, color: '#34d399' },
              { icon: '⏳', label: 'Pending', value: stats.pending_orders, color: '#f59e0b' },
              { icon: '💰', label: 'Total Revenue', value: fmt(stats.total_revenue), color: '#FF5A36' },
              { icon: '👥', label: 'Customers', value: stats.total_customers, color: '#a78bfa' },
              { icon: '🗓️', label: "Today's Orders", value: stats.today_orders, color: '#2dd4bf' },
              { icon: '📈', label: "Today's Revenue", value: fmt(stats.today_revenue), color: '#f472b6' },
            ].map(stat => (
              <div key={stat.label} className="admin-stat-card">
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Orders Section ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          overflow: 'hidden'
        }}>
          {/* Section header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>
              All Orders
              <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                {filteredOrders.length} of {orders.length}
              </span>
            </h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="admin-input"
                placeholder="🔍  Search order #, name, email, city…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '260px' }}
              />
              <select
                className="admin-input"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1.6fr 1.2fr 100px 110px 110px 140px',
            gap: '12px',
            padding: '10px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.8px'
          }}>
            <div>Order</div>
            <div>Customer</div>
            <div>Address</div>
            <div>Amount</div>
            <div>Payment</div>
            <div>Shipment</div>
            <div>Actions</div>
          </div>

          {/* Orders list */}
          <div style={{ padding: '12px 12px' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
                No orders found.
              </div>
            ) : (
              filteredOrders.map(order => {
                const isExpanded = expandedOrder === order.id;
                const isPaid = order.payment_status === 'Paid';
                const isShipped = order.shipping_status && !['Failed', 'Pending'].includes(order.shipping_status);
                const hasGoodAwb = order.awb_code && !isFailedAwb(order.awb_code);

                return (
                  <div key={order.id} className="admin-order-row">
                    {/* Row header — click to expand */}
                    <div
                      className="admin-order-header"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      {/* Order ID */}
                      <div style={{ fontWeight: 700, color: '#FF5A36', fontSize: '0.9rem' }}>
                        #{order.id}
                      </div>

                      {/* Customer */}
                      <div>
                        <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.88rem' }}>{order.customer_name || order.full_name}</div>
                        <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>{order.customer_email}</div>
                      </div>

                      {/* City */}
                      <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        {order.city}, {order.state}
                        <div style={{ color: '#475569', fontSize: '0.75rem' }}>{fmtDate(order.created_at)}</div>
                      </div>

                      {/* Amount */}
                      <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{fmt(order.total_amount)}</div>

                      {/* Payment status */}
                      <div>
                        <span className="admin-badge" style={{
                          background: isPaid ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                          color: isPaid ? '#34d399' : '#fbbf24',
                          border: `1px solid ${isPaid ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}`
                        }}>
                          {isPaid ? '✅ Paid' : '⏳ Pending'}
                        </span>
                      </div>

                      {/* Shipping status */}
                      <div>
                        <span className="admin-badge" style={{
                          background: isShipped ? 'rgba(96,165,250,0.15)' : 'rgba(148,163,184,0.1)',
                          color: isShipped ? '#60a5fa' : '#64748b',
                          border: `1px solid ${isShipped ? 'rgba(96,165,250,0.3)' : 'rgba(148,163,184,0.2)'}`
                        }}>
                          {order.shipping_status || 'Processing'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <button
                          className="admin-btn"
                          title="Download PDF receipt for this order"
                          onClick={() => downloadReceipt({
                            ...order,
                            order_id: order.id,
                            items: order.items || [],
                          })}
                          style={{ background: 'rgba(255,90,54,0.15)', color: '#FF7E5F', border: '1px solid rgba(255,90,54,0.25)', padding: '5px 10px' }}
                        >
                          📄 Receipt
                        </button>
                        {hasGoodAwb && (
                          <a
                            href={order.tracking_url || `https://shiprocket.co/tracking/${order.awb_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-btn"
                            style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)', padding: '5px 10px', textDecoration: 'none' }}
                          >
                            🚚 Track
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Expanded order detail */}
                    {isExpanded && (
                      <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        padding: '20px 20px 24px',
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1fr',
                        gap: '24px',
                        background: 'rgba(0,0,0,0.15)'
                      }}>
                        {/* Items */}
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Order Items</div>
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} style={{
                              display: 'flex', gap: '12px', alignItems: 'center',
                              padding: '10px 0',
                              borderBottom: idx < order.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                            }}>
                              <img
                                src={item.image1}
                                alt={item.title}
                                style={{ width: '38px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#e2e8f0' }}>{item.title}</div>
                                <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                                  Qty: {item.quantity} × {fmt(item.price)} = <span style={{ color: '#FF5A36', fontWeight: 700 }}>{fmt(parseFloat(item.price) * item.quantity)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, color: '#94a3b8' }}>Order Total</span>
                            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#FF5A36' }}>{fmt(order.total_amount)}</span>
                          </div>
                        </div>

                        {/* Shipment + Address */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                          {/* Address */}
                          <div style={{
                            background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.07)', padding: '16px'
                          }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>📍 Delivery Address</div>
                            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>{order.full_name}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.83rem', lineHeight: 1.6 }}>
                              {order.address_line1}
                              {order.address_line2 ? `, ${order.address_line2}` : ''}<br />
                              {order.city}, {order.state} — {order.pincode}<br />
                              📞 {order.shipping_phone || order.customer_phone}
                            </div>
                          </div>

                          {/* Shipment */}
                          <div style={{
                            background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.07)', padding: '16px'
                          }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>🚚 Shipment Info</div>
                            <div style={{ fontSize: '0.83rem', color: '#94a3b8', lineHeight: 1.8 }}>
                              <div><span style={{ color: '#64748b' }}>Courier:</span> <strong style={{ color: '#e2e8f0' }}>{order.courier_name || '—'}</strong></div>
                              <div><span style={{ color: '#64748b' }}>AWB:</span> <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', color: '#60a5fa' }}>
                                {hasGoodAwb ? order.awb_code : 'Pending assignment'}
                              </code></div>
                              <div><span style={{ color: '#64748b' }}>Shiprocket Order ID:</span> <span style={{ color: '#e2e8f0' }}>{order.shiprocket_order_id || '—'}</span></div>
                              <div><span style={{ color: '#64748b' }}>Payment Ref:</span> <span style={{ color: '#e2e8f0', fontSize: '0.78rem' }}>{order.payment_id || '—'}</span></div>
                            </div>
                            {hasGoodAwb && (
                              <a
                                href={order.tracking_url || `https://shiprocket.co/tracking/${order.awb_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  marginTop: '12px', padding: '8px 16px',
                                  background: 'rgba(96,165,250,0.15)', color: '#60a5fa',
                                  border: '1px solid rgba(96,165,250,0.3)', borderRadius: '8px',
                                  fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none'
                                }}
                              >
                                🚚 Track on Shiprocket ➔
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
