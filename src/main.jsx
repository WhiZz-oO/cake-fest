import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Banknote, 
  CalendarDays, 
  Check, 
  CheckCircle2, 
  ChevronRight, 
  Church, 
  ClipboardCheck, 
  Clock3, 
  Gift, 
  Heart, 
  Minus, 
  Phone, 
  Plus, 
  QrCode, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  ShoppingBag, 
  Smartphone, 
  Snowflake, 
  Sparkles, 
  TreePine, 
  Truck, 
  Users, 
  X 
} from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';
const INITIAL_PRODUCTS = [
  { id: 'carrot-05', name: 'Carrot Cake', weight: '½ kg', price: null, description: 'A tender, warmly spiced classic.', image: 'https://floursandfrostings.com/wp-content/uploads/2016/07/wholewheat-carrot-cake.1024x1024-4.jpg' },
  { id: 'carrot-1', name: 'Carrot Cake', weight: '1 kg', price: null, description: 'A tender, warmly spiced classic.', image: 'https://floursandfrostings.com/wp-content/uploads/2016/07/wholewheat-carrot-cake.1024x1024-4.jpg' },
  { id: 'pineapple-05', name: 'Pineapple Cake', weight: '½ kg', price: null, description: 'A bright, fruity favourite.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLJozttLk_icFgAHwlZ53BawGLlA-qn9sOMihbNAZrv0i6dfEc_KaqRY8T&s=10' },
  { id: 'pineapple-1', name: 'Pineapple Cake', weight: '1 kg', price: null, description: 'A bright, fruity favourite.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLJozttLk_icFgAHwlZ53BawGLlA-qn9sOMihbNAZrv0i6dfEc_KaqRY8T&s=10' },
  { id: 'marble-05', name: 'Marble Cake', weight: '½ kg', price: null, description: 'A beautiful swirl of chocolate and vanilla.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQloSz4vNbUXvBq7pK38Ka2vZgF_VrhBwdJyuaxo9ZLX-dA2l5FCR80oemU&s=10' },
  { id: 'marble-1', name: 'Marble Cake', weight: '1 kg', price: null, description: 'A beautiful swirl of chocolate and vanilla.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQloSz4vNbUXvBq7pK38Ka2vZgF_VrhBwdJyuaxo9ZLX-dA2l5FCR80oemU&s=10' },
  { id: 'plum-05', name: 'Plum Cake', weight: '½ kg', price: null, description: 'A festive fruit cake for Christmas.', image: 'https://beextravegant.com/wp-content/uploads/2022/12/DSC00052.jpg' },
  { id: 'plum-1', name: 'Plum Cake', weight: '1 kg', price: null, description: 'A festive fruit cake for Christmas.', image: 'https://beextravegant.com/wp-content/uploads/2022/12/DSC00052.jpg' },
];
const fallbackImages = {
  'plum-05': 'https://beextravegant.com/wp-content/uploads/2022/12/DSC00052.jpg',
  'plum-1': 'https://beextravegant.com/wp-content/uploads/2022/12/DSC00052.jpg'
};
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

function App() {
  const [view, setView] = useState(() => (window.location.hash === '#delivery' || window.location.hash === '#admin') ? 'delivery' : 'store');
  const [products, setProducts] = useState(INITIAL_PRODUCTS.map(p => ({ ...p, image: fallbackImages[p.id] || p.image })));
  const [settings, setSettings] = useState({ pickupDate: '2026-12-21', orderDeadline: '', campaignOpen: true, pickupLocation: '12 Apostles Church, Chemmalamattom' });
  const [quantities, setQuantities] = useState(Object.fromEntries(INITIAL_PRODUCTS.map(p => [p.id, 0])));
  const [form, setForm] = useState({ fullName: '', phone: '', houseName: '', ward: '' });
  const [phase, setPhase] = useState('form');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [orderId, setOrderId] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  // Delivery Portal State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentOption, setPaymentOption] = useState('Cash');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [deliveryToast, setDeliveryToast] = useState('');

  // Sync hash routing
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#delivery' || window.location.hash === '#admin') {
        setView('delivery');
      } else if (window.location.hash === '' || window.location.hash === '#home' || window.location.hash === '#cakes' || window.location.hash === '#order') {
        setView('store');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Fetch products config
  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}?action=config`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.products)) {
          setProducts(current => current
            .map(p => {
              const live = data.products.find(x => x.id === p.id);
              return live ? { ...p, ...live } : { ...p, available: false };
            })
            .filter(p => p.available !== false)
          );
        }
        if (data.settings) setSettings(current => ({ ...current, ...data.settings }));
      })
      .catch(() => setNotice('Live price settings could not be loaded. Please try refreshing later.'));
  }, []);

  // Fetch orders for Delivery Desk
  const fetchOrders = async () => {
    if (!API_URL) return;
    setLoadingOrders(true);
    setFetchError('');
    try {
      const res = await fetch(`${API_URL}?action=getOrders&_t=${Date.now()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        // Fallback to POST
        const resPost = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'getOrders' })
        });
        const dataPost = await resPost.json();
        if (dataPost.success && Array.isArray(dataPost.orders)) {
          setOrders(dataPost.orders);
        } else {
          throw new Error(data.message || dataPost.message || 'Could not fetch orders.');
        }
      }
    } catch (err) {
      setFetchError(err.message || 'Could not load orders from Google Sheets.');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (view === 'delivery') {
      fetchOrders();
    }
  }, [view]);

  // Lock scroll when cart or delivery modal is open
  useEffect(() => {
    if (cartOpen || selectedOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen, selectedOrder]);

  const totalItems = Object.values(quantities).reduce((sum, n) => sum + n, 0);
  const totalPrice = useMemo(() => products.reduce((sum, p) => sum + (Number(p.price) || 0) * quantities[p.id], 0), [products, quantities]);
  const hasUnpricedSelection = products.some(p => quantities[p.id] > 0 && !(Number(p.price) > 0));
  const updateQty = (id, amount) => setQuantities(current => ({ ...current, [id]: Math.max(0, Math.min(9, (current[id] || 0) + amount)) }));
  const updateForm = e => setForm(current => ({ ...current, [e.target.name]: e.target.value }));

  const proceedToBook = () => {
    setCartOpen(false);
    const orderSection = document.getElementById('order');
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        const nameInput = document.querySelector('input[name="fullName"]');
        if (nameInput) nameInput.focus();
      }, 400);
    }
  };

  async function submitOrder(e) {
    e.preventDefault(); setNotice('');
    if (!API_URL) { setNotice('Ordering is not connected yet. The website administrator must configure the Google Apps Script URL before accepting live orders.'); return; }
    if (!totalItems) { setNotice('Please select at least one cake before submitting.'); return; }
    if (hasUnpricedSelection) { setNotice('The price for one or more selected cakes has not been configured yet. Please contact the organizer.'); return; }
    setBusy(true);
    const order = {
      customer: { ...form, ward: Number(form.ward) },
      items: products.filter(p => quantities[p.id] > 0).map(p => ({ id: p.id, name: p.name, weight: p.weight, quantity: quantities[p.id] })),
      pickupDate: settings.pickupDate,
      pickupLocation: settings.pickupLocation,
      total: totalPrice,
      source: 'SMYM Christmas Cake Fest 2026'
    };
    try {
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'submitOrder', order }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to submit your order.');
      setOrderId(data.orderId); setPhase('success'); window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setNotice(err.message || 'Something went wrong. Please try again or contact SMYM.');
    } finally { setBusy(false); }
  }

  // Delivery Portal Actions
  const handleSelectCustomer = (order) => {
    setSelectedOrder(order);
    setPaymentOption(order.paymentMethod || 'Cash');
  };

  const handleMarkDelivered = async () => {
    if (!selectedOrder) return;
    setSubmittingDelivery(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'markDelivered',
          orderId: selectedOrder.orderId,
          paymentMethod: paymentOption
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not update delivery status in Google Sheets.');
      }

      const deliveredAt = data.deliveredAt || new Date().toLocaleString('en-IN');
      const updatedOrder = {
        ...selectedOrder,
        status: 'Delivered',
        paymentMethod: paymentOption,
        deliveredAt: deliveredAt
      };

      setOrders(current => current.map(o => o.orderId === selectedOrder.orderId ? updatedOrder : o));
      setSelectedOrder(updatedOrder);
      setDeliveryToast(`✓ Order for ${selectedOrder.name} marked DELIVERED (${paymentOption})! Sheet row turned green.`);
      setTimeout(() => setDeliveryToast(''), 4500);
    } catch (err) {
      alert(err.message || 'Failed to update order in Google Sheets.');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleMarkPending = async () => {
    if (!selectedOrder) return;
    if (!confirm(`Revert order for ${selectedOrder.name} back to Pending? The Google Sheet row will be reset to white.`)) return;
    setSubmittingDelivery(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'markPending',
          orderId: selectedOrder.orderId
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not reset status.');
      }

      const revertedOrder = {
        ...selectedOrder,
        status: 'New',
        paymentMethod: '',
        deliveredAt: ''
      };

      setOrders(current => current.map(o => o.orderId === selectedOrder.orderId ? revertedOrder : o));
      setSelectedOrder(revertedOrder);
      setDeliveryToast(`Order for ${selectedOrder.name} reverted to Pending.`);
      setTimeout(() => setDeliveryToast(''), 4500);
    } catch (err) {
      alert(err.message || 'Failed to reset order.');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  // Filter orders by search, ward, and delivery status
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cleanQDigits = q.replace(/\D/g, '');

    return orders.filter(o => {
      const isDelivered = (o.status || '').toLowerCase() === 'delivered';
      if (statusFilter === 'pending' && isDelivered) return false;
      if (statusFilter === 'delivered' && !isDelivered) return false;

      if (wardFilter && String(o.ward) !== String(wardFilter)) return false;

      if (q) {
        const nameMatch = (o.name || '').toLowerCase().includes(q);
        const houseMatch = (o.houseName || '').toLowerCase().includes(q);
        const rawPhone = (o.phone || '');
        const phoneMatch = rawPhone.toLowerCase().includes(q) || (cleanQDigits.length >= 2 && rawPhone.replace(/\D/g, '').includes(cleanQDigits));
        const wardStr = String(o.ward || '');
        const wardMatch = wardStr === q || `ward ${wardStr}`.includes(q) || `ward${wardStr}`.includes(q);
        const idMatch = (o.orderId || '').toLowerCase().includes(q);

        if (!nameMatch && !houseMatch && !phoneMatch && !wardMatch && !idMatch) {
          return false;
        }
      }
      return true;
    });
  }, [orders, search, wardFilter, statusFilter]);

  // Real-time metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter(o => (o.status || '').toLowerCase() === 'delivered');
    const pending = orders.filter(o => (o.status || '').toLowerCase() !== 'delivered');
    const cashTotal = delivered.filter(o => o.paymentMethod === 'Cash').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const gpayTotal = delivered.filter(o => o.paymentMethod === 'GPay').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const deliveredRevenue = cashTotal + gpayTotal;

    return {
      total,
      deliveredCount: delivered.length,
      pendingCount: pending.length,
      cashTotal,
      gpayTotal,
      deliveredRevenue,
      totalRevenue
    };
  }, [orders]);

  const deadlineText = settings.orderDeadline ? new Date(`${settings.orderDeadline}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'To be announced';
  const pickupText = settings.pickupDate ? new Date(`${settings.pickupDate}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'To be announced';

  // ==========================================
  // VIEW: DELIVERY & CONFIRMATION DESK
  // ==========================================
  if (view === 'delivery') {
    return (
      <div className="delivery-page">
        {/* Top Coordinator Banner */}
        <div className="announcement delivery-announcement">
          <Truck size={14} />
          <span>SMYM CHEMMALAMATTOM — ORDER CONFIRMATION & DELIVERY COUNTER</span>
          <Church size={14} />
        </div>

        {/* Coordinator Header */}
        <header className="site-header delivery-header">
          <div className="brand" onClick={() => { window.location.hash = ''; setView('store'); }} style={{ cursor: 'pointer' }}>
            <span className="brand-mark"><TreePine size={24} /></span>
            <span><b>SMYM CAKE FEST</b><small>DELIVERY DESK 2026</small></span>
          </div>
          <div className="delivery-nav-actions">
            <button 
              type="button" 
              className="button button-outline refresh-btn" 
              onClick={fetchOrders}
              disabled={loadingOrders}
              title="Refresh orders from Google Sheet"
            >
              <RefreshCw size={15} className={loadingOrders ? 'spin-icon' : ''} />
              <span>{loadingOrders ? 'Syncing...' : 'Sync Sheet'}</span>
            </button>
            <button 
              type="button" 
              className="button button-gold return-store-btn"
              onClick={() => { window.location.hash = ''; setView('store'); }}
            >
              <ArrowLeft size={15} />
              <span>Customer Store</span>
            </button>
          </div>
        </header>

        {deliveryToast && (
          <div className="delivery-toast" role="alert">
            <CheckCircle2 size={18} />
            <span>{deliveryToast}</span>
          </div>
        )}

        <main className="delivery-main">
          {/* Metrics summary cards */}
          <section className="delivery-metrics">
            <div className="metric-card">
              <span className="metric-label">TOTAL PRE-ORDERS</span>
              <strong className="metric-num">{metrics.total}</strong>
              <small className="metric-sub">Across 30 Wards</small>
            </div>
            <div className="metric-card metric-delivered">
              <span className="metric-label">DELIVERED & PAID</span>
              <strong className="metric-num">{metrics.deliveredCount}</strong>
              <small className="metric-sub">{metrics.total > 0 ? `${Math.round((metrics.deliveredCount / metrics.total) * 100)}% completed` : '0%'}</small>
            </div>
            <div className="metric-card metric-pending">
              <span className="metric-label">PENDING PICKUP</span>
              <strong className="metric-num">{metrics.pendingCount}</strong>
              <small className="metric-sub">Awaiting customer collection</small>
            </div>
            <div className="metric-card metric-cash">
              <span className="metric-label">CASH COLLECTED</span>
              <strong className="metric-num">{money(metrics.cashTotal)}</strong>
              <small className="metric-sub">Counter cash drawer</small>
            </div>
            <div className="metric-card metric-gpay">
              <span className="metric-label">GPAY (UPI) COLLECTED</span>
              <strong className="metric-num">{money(metrics.gpayTotal)}</strong>
              <small className="metric-sub">Direct UPI transfers</small>
            </div>
          </section>

          {/* Search & Filter Toolbar */}
          <section className="delivery-controls">
            <div className="search-box-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                className="delivery-search-input"
                placeholder="Search by customer name, phone number, or ward..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button 
                  type="button" 
                  className="search-clear-btn" 
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="filters-row">
              <div className="ward-filter-group">
                <label htmlFor="ward-select">Ward:</label>
                <select 
                  id="ward-select" 
                  className="ward-select"
                  value={wardFilter} 
                  onChange={e => setWardFilter(e.target.value)}
                >
                  <option value="">All Wards (1–30)</option>
                  {Array.from({ length: 30 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Ward {i + 1}</option>
                  ))}
                </select>
              </div>

              <div className="status-tabs">
                <button 
                  type="button" 
                  className={`status-tab ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All ({orders.length})
                </button>
                <button 
                  type="button" 
                  className={`status-tab ${statusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending ({metrics.pendingCount})
                </button>
                <button 
                  type="button" 
                  className={`status-tab ${statusFilter === 'delivered' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('delivered')}
                >
                  Delivered ({metrics.deliveredCount})
                </button>
              </div>
            </div>
          </section>

          {/* Error notice if API call fails */}
          {fetchError && (
            <div className="notice delivery-error-notice" role="alert">
              <p><b>Notice:</b> {fetchError}</p>
              <button type="button" className="button button-dark" onClick={fetchOrders} style={{ marginTop: '8px' }}>
                Try Again
              </button>
            </div>
          )}

          {/* Orders list or empty state */}
          <section className="orders-list-section">
            <div className="orders-list-header">
              <h3>
                {loadingOrders ? 'Loading customer orders from Google Sheets…' : `Showing ${filteredOrders.length} ${filteredOrders.length === 1 ? 'order' : 'orders'}`}
              </h3>
              <small>Click any customer card to review details, select payment (Cash/GPay), and confirm delivery.</small>
            </div>

            {loadingOrders && orders.length === 0 ? (
              <div className="loading-state">
                <RefreshCw size={36} className="spin-icon" />
                <p>Connecting to Google Sheet & fetching pre-orders…</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-orders-state">
                <Users size={44} />
                <h4>No matching customer orders found</h4>
                <p>Try searching with another name, phone digits, or changing the ward filter.</p>
                {(search || wardFilter || statusFilter !== 'all') && (
                  <button 
                    type="button" 
                    className="button button-gold"
                    onClick={() => { setSearch(''); setWardFilter(''); setStatusFilter('all'); }}
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="orders-grid">
                {filteredOrders.map(order => {
                  const isDelivered = (order.status || '').toLowerCase() === 'delivered';
                  return (
                    <article 
                      key={order.orderId} 
                      className={`order-row-card ${isDelivered ? 'is-delivered' : 'is-pending'}`}
                      onClick={() => handleSelectCustomer(order)}
                    >
                      <div className="order-row-top">
                        <div className="order-customer-info">
                          <h4 className="customer-name">{order.name}</h4>
                          <div className="customer-submeta">
                            <span className="customer-house">{order.houseName}</span>
                            <span className="meta-bullet">•</span>
                            <span className="customer-phone">{order.phone}</span>
                          </div>
                        </div>
                        <div className="order-ward-badge">
                          <span>Ward</span>
                          <b>{order.ward}</b>
                        </div>
                      </div>

                      <div className="order-row-middle">
                        <div className="order-cakes-pill">
                          <ShoppingBag size={14} />
                          <span><b>{order.totalCakes}</b> {order.totalCakes === 1 ? 'cake' : 'cakes'}</span>
                        </div>
                        <div className="order-amount-pill">
                          <span>Total:</span>
                          <b>{money(order.totalAmount)}</b>
                        </div>
                      </div>

                      <div className="order-row-bottom">
                        <div className="order-status-indicator">
                          {isDelivered ? (
                            <span className="status-badge delivered-badge">
                              <CheckCircle2 size={13} />
                              <span>Delivered ({order.paymentMethod || 'Paid'})</span>
                            </span>
                          ) : (
                            <span className="status-badge pending-badge">
                              <Clock3 size={13} />
                              <span>Pending Delivery</span>
                            </span>
                          )}
                        </div>
                        <span className="view-action-text">
                          <span>Confirm</span>
                          <ChevronRight size={15} />
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {/* ============================================================== */}
        {/* CUSTOMER SELECTION MODAL: FULL ORDER DETAILS, PAYMENT & CONFIRM */}
        {/* ============================================================== */}
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div 
              className="delivery-modal" 
              onClick={e => e.stopPropagation()} 
              role="dialog" 
              aria-modal="true" 
              aria-label="Confirm Order Delivery"
            >
              {/* Modal Header */}
              <div className="modal-header">
                <div>
                  <div className="modal-eyebrow">
                    <span>ORDER #{selectedOrder.orderId}</span>
                    <span className="meta-bullet">•</span>
                    <span>{selectedOrder.submittedAt || 'Pre-order'}</span>
                  </div>
                  <h2>Order Confirmation & Delivery</h2>
                </div>
                <button 
                  type="button" 
                  className="modal-close-btn" 
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-scroll-content">
                {/* Customer Profile Box */}
                <div className="customer-profile-box">
                  <div className="customer-profile-header">
                    <div>
                      <span className="profile-label">CUSTOMER NAME</span>
                      <h3 className="profile-name">{selectedOrder.name}</h3>
                    </div>
                    <div className="profile-ward">
                      <span>WARD</span>
                      <b>{selectedOrder.ward}</b>
                    </div>
                  </div>

                  <div className="profile-details-grid">
                    <div className="profile-detail-item">
                      <span className="detail-title">House Name</span>
                      <strong className="detail-value">{selectedOrder.houseName || '—'}</strong>
                    </div>
                    <div className="profile-detail-item">
                      <span className="detail-title">Phone Number</span>
                      <div className="phone-call-wrapper">
                        <strong className="detail-value phone-value">{selectedOrder.phone}</strong>
                        {selectedOrder.phone && (
                          <a href={`tel:${selectedOrder.phone}`} className="phone-call-btn" title="Call Customer">
                            <Phone size={13} />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cake Summary Breakdown */}
                <div className="modal-section cake-summary-section">
                  <div className="section-title-row">
                    <ShoppingBag size={17} />
                    <h4>Ordered Cakes ({selectedOrder.totalCakes} boxes)</h4>
                  </div>

                  <div className="cake-items-table">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map(item => (
                        <div className="cake-item-row" key={item.id}>
                          <div className="cake-item-main">
                            <span className="cake-item-name">{item.name}</span>
                            <span className="cake-item-weight-badge">{item.weight}</span>
                          </div>
                          <div className="cake-item-qty-price">
                            <span className="cake-item-qty">Qty: <b>{item.quantity}</b></span>
                            {item.unitPrice ? (
                              <span className="cake-item-subtotal">{money(item.unitPrice * item.quantity)}</span>
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-cakes-alert">
                        <span>Total quantity: <b>{selectedOrder.totalCakes} cakes</b></span>
                      </div>
                    )}
                  </div>

                  {/* Grand Total Amount Display */}
                  <div className="modal-total-banner">
                    <div>
                      <span className="total-banner-label">TOTAL AMOUNT TO COLLECT</span>
                      <small className="total-banner-sub">Pre-order balance</small>
                    </div>
                    <strong className="total-banner-amount">
                      {money(selectedOrder.totalAmount)}
                    </strong>
                  </div>
                </div>

                {/* Status Indicator (Delivered vs Pending) */}
                {selectedOrder.status.toLowerCase() === 'delivered' ? (
                  <div className="delivered-banner-box">
                    <div className="delivered-banner-top">
                      <CheckCircle2 size={24} className="green-check" />
                      <div>
                        <h4>ORDER DELIVERED & COMPLETED</h4>
                        <p>
                          Paid via <b>{selectedOrder.paymentMethod || 'Cash'}</b> on {selectedOrder.deliveredAt || 'pickup date'}.
                        </p>
                        <small className="sheet-row-notice">✓ Corresponding row is marked GREEN in Google Sheet Form Responses 1.</small>
                      </div>
                    </div>

                    <div className="delivered-actions-row">
                      <button 
                        type="button" 
                        className="button button-outline mark-pending-btn"
                        onClick={handleMarkPending}
                        disabled={submittingDelivery}
                      >
                        {submittingDelivery ? 'Reverting...' : 'Undo / Mark as Pending'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Payment Method Selection & Delivery Confirmation */
                  <div className="modal-section payment-section">
                    <div className="section-title-row">
                      <Banknote size={17} />
                      <h4>Select Payment Method</h4>
                    </div>
                    <p className="payment-help-text">Choose the payment method received from customer, then confirm delivery.</p>

                    <div className="payment-options-grid">
                      <label className={`payment-option-card ${paymentOption === 'Cash' ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="Cash"
                          checked={paymentOption === 'Cash'}
                          onChange={() => setPaymentOption('Cash')}
                        />
                        <div className="payment-card-content">
                          <div className="payment-icon-wrapper cash-icon-bg">
                            <Banknote size={24} />
                          </div>
                          <div>
                            <strong className="payment-option-title">Cash Payment</strong>
                            <span className="payment-option-desc">Collected at pickup counter</span>
                          </div>
                        </div>
                        {paymentOption === 'Cash' && <span className="option-check-circle"><Check size={14} /></span>}
                      </label>

                      <label className={`payment-option-card ${paymentOption === 'GPay' ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="GPay"
                          checked={paymentOption === 'GPay'}
                          onChange={() => setPaymentOption('GPay')}
                        />
                        <div className="payment-card-content">
                          <div className="payment-icon-wrapper gpay-icon-bg">
                            <Smartphone size={24} />
                          </div>
                          <div>
                            <strong className="payment-option-title">GPay / UPI</strong>
                            <span className="payment-option-desc">Digital QR code transfer</span>
                          </div>
                        </div>
                        {paymentOption === 'GPay' && <span className="option-check-circle"><Check size={14} /></span>}
                      </label>
                    </div>

                    <button 
                      type="button" 
                      className="button button-green confirm-delivery-btn"
                      onClick={handleMarkDelivered}
                      disabled={submittingDelivery}
                    >
                      {submittingDelivery ? (
                        <>
                          <RefreshCw size={17} className="spin-icon" />
                          <span>Updating Google Sheet Row to Green…</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={19} />
                          <span>Confirm Payment ({paymentOption}) & Mark Delivered</span>
                        </>
                      )}
                    </button>
                    <small className="delivery-action-note">
                      * This immediately sets status to <b>Delivered</b>, records <b>{paymentOption}</b> payment, and turns this customer's row <b>GREEN</b> in Google Sheets.
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="site-footer">
          <div className="footer-brand">
            <span className="brand-mark"><TreePine size={22} /></span>
            <span><b>SMYM CHEMMALAMATTOM</b><small>CHRISTMAS CAKE FEST 2026</small></span>
          </div>
          <p>Distribution Desk • 12 Apostles Church, Chemmalamattom</p>
          <div className="footer-bottom">
            <span>Volunteer Portal for Church Coordinators</span>
            <button 
              type="button" 
              className="footer-portal-link"
              onClick={() => { window.location.hash = ''; setView('store'); }}
            >
              Return to Customer Store
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================
  // VIEW: CUSTOMER PRE-ORDER STORE
  // ==========================================
  return (
    <div className={totalItems > 0 ? 'has-sticky-cart' : ''}>
      <div className="announcement">
        <Snowflake size={14} /> Christmas pre-orders by SMYM Chemmalamattom <Snowflake size={14} />
      </div>

      <header className="site-header">
        <a className="brand" href="#home" aria-label="SMYM Christmas Cake Fest home">
          <span className="brand-mark"><TreePine size={24} /></span>
          <span><b>SMYM</b><small>CHEMMALAMATTOM</small></span>
        </a>
        <nav>
          <a href="#cakes">Our cakes</a>
          <a href="#pickup">Pickup details</a>
          {totalItems > 0 ? (
            <button type="button" className="nav-cta nav-cta-cart" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={15} />
              <span>Cart ({totalItems})</span>
            </button>
          ) : (
            <a className="nav-cta" href="#cakes">Order cakes <ArrowRight size={15} /></a>
          )}
          {/* Coordinator Portal Button */}
          <button 
            type="button" 
            className="nav-coordinator-link"
            onClick={() => { window.location.hash = '#delivery'; setView('delivery'); }}
            title="Open Order Delivery & Confirmation Counter"
          >
            <Truck size={14} />
            <span>Delivery Desk</span>
          </button>
        </nav>
      </header>

      {phase === 'success' ? (
        <main className="success-page">
          <div className="success-icon"><CheckCircle2 size={46} /></div>
          <p className="eyebrow">ORDER RECEIVED</p>
          <h1>Thank you for sharing the Christmas joy.</h1>
          <p>Your pre-order has been submitted to SMYM Chemmalamattom.</p>
          <div className="reference-card">
            <span>YOUR ORDER REFERENCE</span>
            <strong>{orderId}</strong>
            <small>Please keep this reference for collection and any follow-up.</small>
          </div>
          <div className="pickup-note">
            <Church size={20} />
            <div>
              <b>Collection point</b>
              <span>12 Apostles Church, Chemmalamattom</span>
              <span>{pickupText}</span>
            </div>
          </div>
          <button 
            className="button button-dark" 
            onClick={() => { 
              setPhase('form'); 
              setQuantities(Object.fromEntries(INITIAL_PRODUCTS.map(p => [p.id, 0]))); 
              setForm({ fullName: '', phone: '', houseName: '', ward: '' }); 
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }}
          >
            Place another order
          </button>
        </main>
      ) : (
        <>
          <main id="home">
            <section className="hero">
              <div className="hero-copy">
                <div className="hero-kicker"><Sparkles size={15} /> THE SEASON OF GIVING</div>
                <h1>A little cake.<br /><em>A lot of Christmas joy.</em></h1>
                <p>Make your Christmas sweeter with our festive cake pre-order. Organized with love by SMYM Chemmalamattom.</p>
                <div className="hero-actions">
                  <a className="button button-gold" href="#cakes">Explore the cakes <ArrowRight size={17} /></a>
                  <span className="organizer-note"><Heart size={14} /> Organized by SMYM</span>
                </div>
                <div className="hero-details">
                  <div>
                    <CalendarDays size={17} />
                    <span><small>COLLECTION DATE</small><b>{pickupText}</b></span>
                  </div>
                  <div>
                    <Church size={17} />
                    <span><small>PICKUP POINT</small><b>12 Apostles Church</b></span>
                  </div>
                </div>
              </div>
              <div className="hero-art">
                <div className="hero-photo">
                  <img src="https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=1300&q=90" alt="Festive Christmas cake with seasonal decorations" />
                  <div className="photo-caption">
                    <span>MADE FOR SHARING</span>
                    <b>Sweet moments, together.</b>
                  </div>
                </div>
                <div className="ornament ornament-one">✳</div>
                <div className="ornament ornament-two">✦</div>
                <div className="hero-stamp"><span>CHRISTMAS</span><b>2026</b><small>CAKE FEST</small></div>
              </div>
            </section>

            <section className="trust-strip">
              <div><Gift size={20} /><span><b>Festive favourites</b><small>Four cakes, two sizes</small></span></div>
              <div><ShieldCheck size={20} /><span><b>Easy pre-order</b><small>Submit your choices online</small></span></div>
              <div><Church size={20} /><span><b>Local collection</b><small>Chemmalamattom Church</small></span></div>
            </section>

            <section id="cakes" className="cakes-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">THE CHRISTMAS SELECTION</p>
                  <h2>Choose your favourites</h2>
                  <p className="section-intro">Select the quantity for each cake size. You can order more than one variety.</p>
                </div>
                {totalItems > 0 ? (
                  <button type="button" className="selection-count selection-count-clickable" onClick={() => setCartOpen(true)}>
                    <ShoppingBag size={16} /> {totalItems} selected • View Cart <ArrowRight size={13} />
                  </button>
                ) : (
                  <span className="selection-count"><ShoppingBag size={16} /> {totalItems} selected</span>
                )}
              </div>
              <div className="product-grid">
                {products.map((p, index) => (
                  <article className="product-card" key={p.id}>
                    <div className="product-image">
                      <img src={p.image} alt={p.name} loading="lazy" />
                      <span className="weight-tag">{p.weight}</span>
                      {index === 6 && <span className="popular-tag">CHRISTMAS FAVOURITE</span>}
                    </div>
                    <div className="product-content">
                      <div>
                        <h3>{p.name}</h3>
                        <p>{p.description}</p>
                      </div>
                      <div className="product-bottom">
                        <div className="price">
                          {Number(p.price) > 0 ? money(Number(p.price)) : <span className="price-pending">Price to be confirmed</span>}
                          <small> / {p.weight}</small>
                        </div>
                        <div className="quantity-control">
                          <button type="button" aria-label={`Remove one ${p.name} ${p.weight}`} onClick={() => updateQty(p.id, -1)} disabled={!quantities[p.id]}><Minus size={15} /></button>
                          <span>{quantities[p.id]}</span>
                          <button type="button" aria-label={`Add one ${p.name} ${p.weight}`} onClick={() => updateQty(p.id, 1)} disabled={quantities[p.id] >= 9}><Plus size={15} /></button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="order-section" id="order">
              <div className="order-heading">
                <p className="eyebrow">STEP 3 OF 3: COMPLETE BOOKING</p>
                <h2>Book your Christmas cakes</h2>
                <p>Share your details so our team can organize your order for collection.</p>
              </div>
              <form onSubmit={submitOrder} className="order-layout">
                <div className="form-panel">
                  <div className="form-section-title">
                    <span>01</span>
                    <div>
                      <h3>Your details</h3>
                      <p>Fields marked * are required.</p>
                    </div>
                  </div>
                  <div className="form-grid">
                    <label className="field full">Full name *<input name="fullName" value={form.fullName} onChange={updateForm} autoComplete="name" required maxLength="100" placeholder="Enter your full name" /></label>
                    <label className="field">Phone number *<input name="phone" type="tel" value={form.phone} onChange={updateForm} autoComplete="tel" required pattern="[0-9+() -]{7,18}" maxLength="18" placeholder="Your contact number" /></label>
                    <label className="field">House name *<input name="houseName" value={form.houseName} onChange={updateForm} required maxLength="100" placeholder="House name" /></label>
                    <label className="field full">Ward number *<select name="ward" value={form.ward} onChange={updateForm} required><option value="">Choose your ward</option>{Array.from({ length: 30 }, (_, i) => <option key={i + 1} value={i + 1}>Ward {i + 1}</option>)}</select></label>
                  </div>
                  <div className="privacy-note">
                    <ShieldCheck size={16} />
                    <span>Your details will be used by the authorized SMYM team to manage this cake pre-order.</span>
                  </div>
                </div>

                <aside className="summary-panel">
                  <div className="form-section-title">
                    <span>02</span>
                    <div>
                      <h3>Order summary</h3>
                      <p>Review your selection before booking.</p>
                    </div>
                  </div>
                  <div className="summary-items">
                    {products.filter(p => quantities[p.id] > 0).map(p => (
                      <div className="summary-row" key={p.id}>
                        <span>{p.name} <small>{p.weight} × {quantities[p.id]}</small></span>
                        <b>{Number(p.price) > 0 ? money(p.price * quantities[p.id]) : 'Pending'}</b>
                      </div>
                    ))}
                    {!totalItems && <p className="empty-summary">Your selected cakes will appear here. Choose cakes from above.</p>}
                  </div>
                  <div className="summary-total">
                    <span>Total quantity</span>
                    <b>{totalItems} {totalItems === 1 ? 'cake' : 'cakes'}</b>
                  </div>
                  <div className="summary-total total-price">
                    <span>Estimated total</span>
                    <b>{hasUnpricedSelection || !totalItems ? '—' : money(totalPrice)}</b>
                  </div>
                  <div className="pickup-card" id="pickup">
                    <div className="pickup-icon"><Church size={20} /></div>
                    <div>
                      <b>Collection at church</b>
                      <span>12 Apostles Church, Chemmalamattom</span>
                      <span><CalendarDays size={14} /> {pickupText}</span>
                    </div>
                  </div>
                  <div className="deadline">
                    <Clock3 size={15} />
                    <span>Order deadline: <b>{deadlineText}</b></span>
                  </div>
                  {notice && <div className="notice" role="alert">{notice}</div>}
                  <button className="button button-dark submit-button" type="submit" disabled={busy || !settings.campaignOpen}>
                    {busy ? 'Booking pre-order…' : <>Book Pre-order <ArrowRight size={17} /></>}
                  </button>
                  <p className="terms-note">Please check your quantities and contact details before submitting. Order confirmation is shown immediately.</p>
                </aside>
              </form>
            </section>
          </main>
        </>
      )}

      {/* STICKY FLOATING CART BAR */}
      {totalItems > 0 && phase === 'form' && (
        <aside className="sticky-cart-bar" aria-label="Cart summary">
          <div className="sticky-cart-inner">
            <div className="sticky-cart-info" onClick={() => setCartOpen(true)} role="button" tabIndex={0}>
              <div className="sticky-cart-badge">
                <ShoppingBag size={20} />
                <span className="badge-count">{totalItems}</span>
              </div>
              <div className="sticky-cart-text">
                <span className="sticky-cart-title">{totalItems} {totalItems === 1 ? 'cake' : 'cakes'} selected</span>
                <span className="sticky-cart-price">{hasUnpricedSelection ? 'Price pending' : money(totalPrice)}</span>
              </div>
            </div>
            <button 
              type="button" 
              className="button button-gold sticky-cart-btn"
              onClick={() => setCartOpen(true)}
            >
              <span>View Cart</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </aside>
      )}

      {/* SLIDE-UP VIEW CART DRAWER */}
      {cartOpen && (
        <div className="cart-drawer-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Your Cart">
            <div className="cart-drawer-header">
              <div className="cart-drawer-title">
                <span className="brand-mark"><TreePine size={20} /></span>
                <div>
                  <h3>Your Cake Cart</h3>
                  <p>{totalItems} {totalItems === 1 ? 'cake' : 'cakes'} selected</p>
                </div>
              </div>
              <button 
                type="button" 
                className="cart-close-btn" 
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>

            <div className="cart-drawer-items">
              {products.filter(p => quantities[p.id] > 0).map(p => (
                <div className="cart-drawer-item" key={p.id}>
                  <img src={p.image} alt={p.name} className="cart-item-img" />
                  <div className="cart-item-details">
                    <h4>{p.name}</h4>
                    <div className="cart-item-meta">
                      <span className="cart-item-weight">{p.weight}</span>
                      <span className="cart-item-price">
                        {Number(p.price) > 0 ? money(p.price * quantities[p.id]) : 'Price pending'}
                      </span>
                    </div>
                  </div>
                  <div className="quantity-control">
                    <button 
                      type="button" 
                      aria-label={`Remove one ${p.name}`} 
                      onClick={() => updateQty(p.id, -1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{quantities[p.id]}</span>
                    <button 
                      type="button" 
                      aria-label={`Add one ${p.name}`} 
                      onClick={() => updateQty(p.id, 1)}
                      disabled={quantities[p.id] >= 9}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {!totalItems && (
                <div className="cart-empty-state">
                  <ShoppingBag size={40} />
                  <p>Your cart is empty.</p>
                  <button type="button" className="button button-gold" onClick={() => setCartOpen(false)}>
                    Choose cakes
                  </button>
                </div>
              )}
            </div>

            {totalItems > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-drawer-subtotal">
                  <span>Estimated Total</span>
                  <b>{hasUnpricedSelection || !totalItems ? '—' : money(totalPrice)}</b>
                </div>
                <div className="cart-drawer-pickup">
                  <Church size={16} />
                  <span>Collection on <b>{pickupText}</b> at 12 Apostles Church</span>
                </div>
                <button 
                  type="button" 
                  className="button button-dark cart-book-btn"
                  onClick={proceedToBook}
                >
                  <span>Proceed to Book</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-mark"><TreePine size={22} /></span>
          <span><b>SMYM CHEMMALAMATTOM</b><small>CHRISTMAS CAKE FEST 2026</small></span>
        </div>
        <p>Celebrate Christmas. Share the Joy.</p>
        <small className="footer-disclaimer">A Christmas pre-order initiative organized by SMYM Chemmalamattom. Cakes are sourced from an external bakery.</small>
        <div className="footer-bottom">
          <span>© 2026 SMYM Chemmalamattom • Made with <Heart size={12} fill="currentColor" /> for the season</span>
          <button 
            type="button" 
            className="footer-portal-link"
            onClick={() => { window.location.hash = '#delivery'; setView('delivery'); }}
          >
            <Truck size={13} />
            <span>Coordinator Delivery Desk</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
