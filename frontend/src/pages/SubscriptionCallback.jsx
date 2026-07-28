import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function SubscriptionCallback() {
  const location = useLocation();
  const [reference, setReference] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setReference(params.get('reference') || '');
  }, [location.search]);

  return (
    <section className="page-bg" style={styles.wrap}>
      <div className="card-modern" style={styles.card}>
        <div style={styles.icon}>✓</div>
        <h1 style={styles.title}>Payment Received</h1>
        <p style={styles.text}>
          Thank you! Your payment is being confirmed. Your subscription will be
          activated automatically once Paystack confirms the transaction — this
          usually happens within a few seconds.
        </p>
        {reference && (
          <p style={styles.reference}>Reference: {reference}</p>
        )}
        <Link to="/agent/dashboard" style={styles.button}>
          Go to My Dashboard
        </Link>
      </div>
    </section>
  );
}

const styles = {
  wrap: {
    padding: '80px 32px',
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'var(--color-white)',
    padding: '48px 32px',
    textAlign: 'center',
    maxWidth: '460px',
  },
  icon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#e6f4ea',
    color: '#1e7e34',
    fontSize: '2rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: { marginBottom: '14px' },
  text: { color: '#666', lineHeight: 1.7, marginBottom: '16px', fontWeight: 500 },
  reference: { fontSize: '0.85rem', color: '#999', marginBottom: '24px' },
  button: {
    display: 'inline-block',
    padding: '14px 28px',
    backgroundColor: 'var(--color-secondary)',
    color: 'var(--color-cream)',
    borderRadius: '8px',
    fontWeight: 700,
  },
};
