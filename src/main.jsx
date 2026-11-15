import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowRight, CalendarDays, Check, CheckCircle2, Church, Clock3, Gift, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Snowflake, Sparkles, TreePine, X } from 'lucide-react';
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
  const [products, setProducts] = useState(INITIAL_PRODUCTS.map(p => ({ ...p, image: fallbackImages[p.id] || p.image })));
  const [settings, setSettings] = useState({ pickupDate: '2026-12-21', orderDeadline: '', campaignOpen: true, pickupLocation: '12 Apostles Church, Chemmalamattom' });
  const [quantities, setQuantities] = useState(Object.fromEntries(INITIAL_PRODUCTS.map(p => [p.id, 0])));
  const [form, setForm] = useState({ fullName: '', phone: '', houseName: '', ward: '' });
  const [phase, setPhase] = useState('form');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [orderId, setOrderId] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

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

  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen]);

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

  const deadlineText = settings.orderDeadline ? new Date(`${settings.orderDeadline}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'To be announced';
  const pickupText = settings.pickupDate ? new Date(`${settings.pickupDate}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'To be announced';

  return <div className={totalItems > 0 ? 'has-sticky-cart' : ''}>
    <div className="announcement"><Snowflake size={14} /> Christmas pre-orders by SMYM Chemmalamattom <Snowflake size={14} /></div>
    <header className="site-header">
      <a className="brand" href="#home" aria-label="SMYM Christmas Cake Fest home"><span className="brand-mark"><TreePine size={24} /></span><span><b>SMYM</b><small>CHEMMALAMATTOM</small></span></a>
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
      </nav>
    </header>

    {phase === 'success' ? <main className="success-page"><div className="success-icon"><CheckCircle2 size={46} /></div><p className="eyebrow">ORDER RECEIVED</p><h1>Thank you for sharing the Christmas joy.</h1><p>Your pre-order has been submitted to SMYM Chemmalamattom.</p><div className="reference-card"><span>YOUR ORDER REFERENCE</span><strong>{orderId}</strong><small>Please keep this reference for collection and any follow-up.</small></div><div className="pickup-note"><Church size={20} /><div><b>Collection point</b><span>12 Apostles Church, Chemmalamattom</span><span>{pickupText}</span></div></div><button className="button button-dark" onClick={() => { setPhase('form'); setQuantities(Object.fromEntries(INITIAL_PRODUCTS.map(p => [p.id, 0]))); setForm({ fullName: '', phone: '', houseName: '', ward: '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Place another order</button></main> : <>
      <main id="home">
        <section className="hero">
          <div className="hero-copy"><div className="hero-kicker"><Sparkles size={15} /> THE SEASON OF GIVING</div><h1>A little cake.<br /><em>A lot of Christmas joy.</em></h1><p>Make your Christmas sweeter with our festive cake pre-order. Organized with love by SMYM Chemmalamattom.</p><div className="hero-actions"><a className="button button-gold" href="#cakes">Explore the cakes <ArrowRight size={17} /></a><span className="organizer-note"><Heart size={14} /> Organized by SMYM</span></div><div className="hero-details"><div><CalendarDays size={17} /><span><small>COLLECTION DATE</small><b>{pickupText}</b></span></div><div><Church size={17} /><span><small>PICKUP POINT</small><b>12 Apostles Church</b></span></div></div></div>
          <div className="hero-art"><div className="hero-photo"><img src="https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=1300&q=90" alt="Festive Christmas cake with seasonal decorations" /><div className="photo-caption"><span>MADE FOR SHARING</span><b>Sweet moments, together.</b></div></div><div className="ornament ornament-one">✳</div><div className="ornament ornament-two">✦</div><div className="hero-stamp"><span>CHRISTMAS</span><b>2026</b><small>CAKE FEST</small></div></div>
        </section>
        <section className="trust-strip"><div><Gift size={20} /><span><b>Festive favourites</b><small>Four cakes, two sizes</small></span></div><div><ShieldCheck size={20} /><span><b>Easy pre-order</b><small>Submit your choices online</small></span></div><div><Church size={20} /><span><b>Local collection</b><small>Chemmalamattom Church</small></span></div></section>

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
    </>}

    {/* STICKY FLOATING CART BAR (appears in marked space at bottom of screen when cakes are selected) */}
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
        © 2026 SMYM Chemmalamattom 
        <span>Made with <Heart size={12} fill="currentColor" /> for the season</span>
      </div>
    </footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
