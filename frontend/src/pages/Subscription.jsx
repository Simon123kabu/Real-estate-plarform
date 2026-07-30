import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Check, ShieldCheck, ArrowRight, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL;
const formatMoney = (num) => 'GH₵ ' + Number(num).toLocaleString('en-GH');

export default function Subscription() {
  const { isAuthenticated, role, user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');

  const [mySubscription, setMySubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(true);

  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutLoadingSlug, setCheckoutLoadingSlug] = useState(null);

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated && role === 'agent') {
      fetchMySubscription();
    }
  }, [isAuthenticated, role]);

  const fetchPlans = async () => {
    setPlansLoading(true);
    setPlansError('');
    try {
      const res = await fetch(`${API_BASE}/subscription/plans`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPlans(data.data);
      } else {
        setPlansError(data.message || 'Could not load plans.');
      }
    } catch {
      setPlansError('Could not reach the server.');
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchMySubscription = async () => {
    setSubLoading(true);
    try {
      const res = await fetch(`${API_BASE}/subscription/me`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMySubscription(data.data);
      }
    } catch {
      // fallback
    } finally {
      setSubLoading(false);
    }
  };

  const handleUpgrade = async (planSlug) => {
    if (!isAuthenticated || role !== 'agent') {
      alert('Please log in as an agent to subscribe to a plan.');
      return;
    }

    setCheckoutError('');
    setCheckoutLoadingSlug(planSlug);

    try {
      const res = await fetch(`${API_BASE}/subscription/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planSlug,
          callbackUrl: `${window.location.origin}/subscription/callback`,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTimeout(() => {
          window.location.href = data.data.authorizationUrl;
        }, 0);
      } else {
        setCheckoutError(data.message || 'Could not start checkout. Please try again.');
        setCheckoutLoadingSlug(null);
      }
    } catch {
      setCheckoutError('Could not reach the server. Please try again.');
      setCheckoutLoadingSlug(null);
    }
  };

  return (
    <div className="listings-page page-enter">
      {/* ── Hero Banner ── */}
      <div
        className="sub-hero"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '3.5rem 1.5rem 3rem',
          background: 'linear-gradient(135deg, #1e362d 0%, #2b4c3f 55%, #152720 100%)',
          color: '#ffffff',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <h1 style={{ textAlign: 'center', margin: '0 0 0.5rem 0', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
          Agent Membership Plans
        </h1>
        <p style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
          Choose a plan to publish more verified property listings across Ghana and reach thousands of active buyers and renters.
        </p>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'var(--space-xl) var(--space-lg) var(--space-3xl)' }}>
        {/* Current Active Plan Status Banner */}
        {isAuthenticated && role === 'agent' && !subLoading && mySubscription && (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-lg) var(--space-xl)',
              marginBottom: 'var(--space-2xl)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={24} />
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>
                  Current Active Plan
                </p>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, textTransform: 'capitalize', color: 'var(--color-text-primary)' }}>
                  {mySubscription.effectivePlan} Plan
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  Used {mySubscription.activeListings} of {mySubscription.maxActiveListings} active listings
                  {mySubscription.subscriptionEndsAt && ` · Renews ${new Date(mySubscription.subscriptionEndsAt).toLocaleDateString()}`}
                </p>
              </div>
            </div>

            <Link to="/profile" className="btn btn-outline btn-sm">
              Manage Listings →
            </Link>
          </div>
        )}

        {/* Loading state */}
        {plansLoading && (
          <div className="grid-3" style={{ alignItems: 'stretch' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-xl)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div className="skeleton skeleton-line" style={{ width: '40%', height: 24, marginBottom: 12 }} />
                  <div className="skeleton skeleton-line" style={{ width: '65%', height: 36, marginBottom: 12 }} />
                  <div className="skeleton skeleton-line" style={{ width: '55%', height: 16, marginBottom: 24 }} />
                  <div className="skeleton skeleton-line" style={{ width: '100%', height: 12, marginBottom: 10 }} />
                  <div className="skeleton skeleton-line" style={{ width: '90%', height: 12, marginBottom: 10 }} />
                  <div className="skeleton skeleton-line" style={{ width: '80%', height: 12, marginBottom: 24 }} />
                </div>
                <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 'var(--radius-md)' }} />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {plansError && (
          <div className="empty-state">
            <AlertCircle size={40} style={{ color: 'var(--color-error)' }} />
            <h3>{plansError}</h3>
            <button className="btn btn-outline" onClick={fetchPlans}>
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        {checkoutError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-error)', background: 'var(--color-error-light)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)' }}>
            <AlertCircle size={16} />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Plans Grid */}
        {!plansLoading && !plansError && (
          <div className="grid-3" style={{ alignItems: 'stretch' }}>
            {plans.map((plan) => {
              const isCurrent = mySubscription && mySubscription.effectivePlan === plan.slug;
              const isFree = plan.slug === 'free';
              const isPopular = plan.slug === 'premium';

              return (
                <div
                  key={plan.slug}
                  style={{
                    background: 'var(--color-surface)',
                    border: `2px solid ${isPopular ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-xl)',
                    boxShadow: isPopular ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  {isPopular && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -12,
                        right: 20,
                        background: 'var(--color-primary)',
                        color: '#ffffff',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        padding: '3px 12px',
                        borderRadius: 'var(--radius-pill)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Sparkles size={11} /> Most Popular
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-xs)' }}>
                      {plan.name}
                    </h3>

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                      <span style={{ fontSize: 'clamp(var(--text-2xl), 3vw, var(--text-3xl))', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
                        {plan.price === 0 ? 'Free' : formatMoney(plan.price)}
                      </span>
                      {plan.price > 0 && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginLeft: 4 }}>/ month</span>}
                    </div>

                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                      Up to {plan.maxActiveListings} active property {plan.maxActiveListings === 1 ? 'listing' : 'listings'}
                    </p>

                    <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-sm)' }}>
                        Included Features:
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {plan.features?.map((feat, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            <Check size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {isCurrent ? (
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        fontSize: 'var(--text-sm)',
                        textAlign: 'center',
                      }}
                    >
                      Active Plan
                    </div>
                  ) : !isFree ? (
                    <button
                      className={`btn ${isPopular ? 'btn-primary' : 'btn-outline'}`}
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => handleUpgrade(plan.slug)}
                      disabled={checkoutLoadingSlug === plan.slug}
                    >
                      {checkoutLoadingSlug === plan.slug ? 'Redirecting to Paystack…' : 'Subscribe Now'}
                      {checkoutLoadingSlug !== plan.slug && <ArrowRight size={15} />}
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', padding: '12px' }}>
                      Default Agent Trial Plan
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
