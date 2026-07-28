import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Mail, Lock, User, Phone, Eye, EyeOff, Building2,
  ShieldCheck, ArrowRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/pages.css';

export default function Login({ initialMode }) {
  const location = useLocation();
  const [mode, setMode] = useState(
    initialMode || (location.pathname === '/register' ? 'register' : 'login')
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('buyer'); // buyer | agent | admin

  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register');
    } else if (location.pathname === '/login') {
      setMode('login');
    }
  }, [location.pathname]);

  const fieldError = (field) => fieldErrors[field];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});
    setRegisterSuccess(false);
    setSubmitting(true);

    let result;
    if (mode === 'login') {
      result = await login({ email, password });
    } else {
      result = await register({ name, email, password, role, phone });
    }

    setSubmitting(false);

    if (!result.success) {
      setGeneralError(result.message || 'Something went wrong. Please try again.');
      if (result.fieldErrors && result.fieldErrors.length > 0) {
        const mapped = {};
        result.fieldErrors.forEach((err) => {
          mapped[err.field] = err.message;
        });
        setFieldErrors(mapped);
      }
      return;
    }

    if (mode === 'register') {
      setMode('login');
      setRegisterSuccess(true);
      setPassword('');
      return;
    }

    // Login successful — redirect based on role
    if (result.data.role === 'agent') {
      navigate('/profile');
    } else if (result.data.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
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
              'url(https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80)',
          }}
        >
          <div className="auth-banner-content">
            <Link to="/" className="auth-banner-logo">
              Property<span>Connect</span>
            </Link>

            <h1 className="auth-banner-headline">
              Find Your Place in Ghana with Confidence
            </h1>

            <p className="auth-banner-sub">
              Access thousands of verified property listings, direct agent contacts,
              and seamless real estate experiences across Accra, Kumasi, Takoradi, and beyond.
            </p>
          </div>

        </div>

        {/* ── Right Form Content Panel ── */}
        <div className="auth-content">
          <div className="auth-card">
            {/* Card Header */}
            <div className="auth-card-header">
              <h2 className="auth-card-title">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="auth-card-sub">
                {mode === 'login'
                  ? 'Sign in to access your saved properties and messages'
                  : 'Join Ghana’s leading real estate platform'}
              </p>
            </div>

            {/* Success toast after registration */}
            {registerSuccess && (
              <div className="banner-warning" style={{ background: 'var(--color-success-light)', borderColor: 'var(--color-success)', color: 'var(--color-success)', marginBottom: 'var(--space-lg)' }}>
                <CheckCircle2 size={16} />
                <span>Account created successfully! Please sign in below.</span>
              </div>
            )}

            {/* Mode Switch Tabs */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab-btn${mode === 'login' ? ' active' : ''}`}
                onClick={() => {
                  setMode('login');
                  setGeneralError('');
                  setFieldErrors({});
                  setRegisterSuccess(false);
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn${mode === 'register' ? ' active' : ''}`}
                onClick={() => {
                  setMode('register');
                  setGeneralError('');
                  setFieldErrors({});
                  setRegisterSuccess(false);
                }}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {/* Registration Role Cards */}
              {mode === 'register' && (
                <div>
                  <span className="auth-role-label">I want to register as:</span>
                  <div className="auth-role-grid">
                    <div
                      className={`auth-role-card${role === 'buyer' ? ' selected' : ''}`}
                      onClick={() => setRole('buyer')}
                    >
                      <User size={20} className="auth-role-card-icon" />
                      <span className="auth-role-card-title">Buyer / Renter</span>
                    </div>

                    <div
                      className={`auth-role-card${role === 'agent' ? ' selected' : ''}`}
                      onClick={() => setRole('agent')}
                    >
                      <Building2 size={20} className="auth-role-card-icon" />
                      <span className="auth-role-card-title">Agent</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Name (Register only) */}
              {mode === 'register' && (
                <div>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <User size={16} />
                    </span>
                    <input
                      className={`input${fieldError('name') ? ' error' : ''}`}
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  {fieldError('name') && (
                    <span style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: '4px', display: 'block' }}>
                      {fieldError('name')}
                    </span>
                  )}
                </div>
              )}

              {/* Email */}
              <div>
                <div className="input-with-icon">
                  <span className="input-icon-left">
                    <Mail size={16} />
                  </span>
                  <input
                    className={`input${fieldError('email') ? ' error' : ''}`}
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {fieldError('email') && (
                  <span style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: '4px', display: 'block' }}>
                    {fieldError('email')}
                  </span>
                )}
              </div>

              {/* Phone (Register only) */}
              {mode === 'register' && (
                <div>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <Phone size={16} />
                    </span>
                    <input
                      className={`input${fieldError('phone') ? ' error' : ''}`}
                      type="tel"
                      placeholder="Phone Number (e.g. +233 24 000 0000)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  {fieldError('phone') && (
                    <span style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: '4px', display: 'block' }}>
                      {fieldError('phone')}
                    </span>
                  )}
                </div>
              )}

              {/* Password */}
              <div>
                <div className="input-with-icon">
                  <span className="input-icon-left">
                    <Lock size={16} />
                  </span>
                  <input
                    className={`input${fieldError('password') ? ' error' : ''}`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {fieldError('password') && (
                  <span style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: '4px', display: 'block' }}>
                    {fieldError('password')}
                  </span>
                )}
              </div>

              {/* General Error */}
              {generalError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', color: 'var(--color-error)', fontSize: 'var(--text-sm)', background: 'var(--color-error-light)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                  <AlertCircle size={16} />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-xs)' }}
              >
                {submitting
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
                {!submitting && <ArrowRight size={16} />}
              </button>
            </form>

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)' }}
                >
                  Forgot your password?
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
