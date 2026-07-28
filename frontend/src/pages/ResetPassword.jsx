import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = new URLSearchParams(location.search).get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password strength meter calculation
  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent', width: '0%' };
    if (pass.length < 6) return { score: 1, label: 'Weak', color: 'var(--color-error)', width: '30%' };
    if (pass.length < 10 || !/\d/.test(pass)) return { score: 2, label: 'Medium', color: 'var(--color-warning)', width: '65%' };
    return { score: 3, label: 'Strong', color: 'var(--color-success)', width: '100%' };
  };

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing reset token. Please use the exact link sent to your email.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2200);
      } else {
        setError(data.message || 'Could not reset your password. The link may have expired.');
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
              'url(https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80)',
          }}
        >
          <div className="auth-banner-content">
            <Link to="/" className="auth-banner-logo">
              Property<span>Connect</span>
            </Link>

            <h1 className="auth-banner-headline">
              Set Your New Password
            </h1>

            <p className="auth-banner-sub">
              Create a strong password for your PropertyConnect account to protect
              your saved listings and agent inquiries.
            </p>
          </div>

        </div>

        {/* ── Right Form Content Panel ── */}
        <div className="auth-content">
          <div className="auth-card">
            {success ? (
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
                <h2 className="auth-card-title">Password Reset!</h2>
                <p className="auth-card-sub" style={{ marginBottom: 'var(--space-xl)' }}>
                  Your password has been updated successfully. Redirecting you to sign in...
                </p>
              </div>
            ) : (
              <>
                <div className="auth-card-header">
                  <h2 className="auth-card-title">Reset Password</h2>
                  <p className="auth-card-sub">
                    Enter your new password below to secure your account
                  </p>
                </div>

                {!token && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', color: 'var(--color-warning)', background: 'var(--color-warning-light)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', fontSize: 'var(--text-xs)' }}>
                    <AlertCircle size={16} />
                    <span>No token found. Please check your reset link email.</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {/* New Password */}
                  <div>
                    <label className="label" htmlFor="new-pass">New Password</label>
                    <div className="input-with-icon">
                      <span className="input-icon-left">
                        <Lock size={16} />
                      </span>
                      <input
                        id="new-pass"
                        className="input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="input-icon-right"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {password && (
                      <div className="strength-wrap">
                        <div className="strength-bar">
                          <div
                            className="strength-fill"
                            style={{ width: strength.width, background: strength.color }}
                          />
                        </div>
                        <span className="strength-text" style={{ color: strength.color }}>
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="label" htmlFor="confirm-pass">Confirm New Password</label>
                    <div className="input-with-icon">
                      <span className="input-icon-left">
                        <Lock size={16} />
                      </span>
                      <input
                        id="confirm-pass"
                        className="input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {submitting ? 'Updating password…' : 'Reset Password'}
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
                    <ArrowLeft size={14} /> Back to Sign In
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
