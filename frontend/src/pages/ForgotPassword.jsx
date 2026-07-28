import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page page-enter">
      <div className="auth-split">
        {/* ── Left Banner Panel ── */}
        <div
          className="auth-banner"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80)',
          }}
        >
          <div className="auth-banner-content">
            <Link to="/" className="auth-banner-logo">
              Property<span>Connect</span>
            </Link>

            <h1 className="auth-banner-headline">
              Account Recovery
            </h1>

            <p className="auth-banner-sub">
              Don't worry — it happens. Enter your registered email address and we'll
              send you an instant link to reset your password.
            </p>

            <div style={{ marginTop: 'var(--space-lg)' }}>
              <div
                className="auth-stat-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(232, 196, 104, 0.22)',
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                <Clock size={16} />
                Reset link expires in 10 minutes
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Form Content Panel ── */}
        <div className="auth-content">
          <div className="auth-card">
            {submitted ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--color-success-light)',
                    color: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-md)',
                  }}
                >
                  <CheckCircle2 size={28} />
                </div>
                <h2 className="auth-card-title">Check Your Inbox</h2>
                <p className="auth-card-sub" style={{ marginBottom: 'var(--space-xl)', lineHeight: 1.6 }}>
                  If an account exists for <strong>{email}</strong>, a password reset link has
                  been sent. Please check your inbox and spam folder.
                </p>
                <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <ArrowLeft size={16} /> Back to Sign In
                </Link>
              </div>
            ) : (
              <>
                <div className="auth-card-header">
                  <h2 className="auth-card-title">Forgot Password?</h2>
                  <p className="auth-card-sub">
                    Enter your email to receive a password reset link
                  </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <div>
                    <label className="label" htmlFor="forgot-email">Registered Email</label>
                    <div className="input-with-icon">
                      <span className="input-icon-left">
                        <Mail size={16} />
                      </span>
                      <input
                        id="forgot-email"
                        className="input"
                        type="email"
                        placeholder="e.g. kwame@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', color: 'var(--color-error)', fontSize: 'var(--text-sm)', background: 'var(--color-error-light)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-xs)' }}
                  >
                    {submitting ? 'Sending link…' : 'Send Reset Link'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
                  <Link
                    to="/login"
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <ArrowLeft size={14} /> Return to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
