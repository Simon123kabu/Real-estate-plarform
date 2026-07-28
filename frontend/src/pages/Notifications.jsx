import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Mail, Phone, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL;

/* ── Notification Row Skeleton ── */
function NotificationSkeleton() {
  return (
    <div className="card-modern" style={{ padding: 'var(--space-lg)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-line" style={{ width: '60%', height: 16, marginBottom: 6 }} />
          <div className="skeleton skeleton-line" style={{ width: '35%', height: 12 }} />
        </div>
      </div>
      <div className="skeleton skeleton-line" style={{ width: '85%', height: 14, marginBottom: 8 }} />
      <div className="skeleton skeleton-line" style={{ width: '50%', height: 14 }} />
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/notifications?limit=50`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setNotifications(data.data.notifications || []);
        setUnread(data.data.unread || 0);
      } else {
        setError(data.message || 'Could not load notifications.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnread(0);
      }
    } catch {
      // fallback
    }
  };

  const markOneRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnread((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // fallback
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch {
      // fallback
    }
  };

  return (
    <div className="listings-page page-enter">
      {/* ── Hero Banner ── */}
      <div className="listings-hero">
        <span className="section-label" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', marginBottom: 'var(--space-xs)' }}>
          <Bell size={12} /> Lead Inquiries
        </span>
        <h1>Inquiries & Notifications</h1>
        <p>Property inquiries submitted by buyers and renters</p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-xl) var(--space-lg) var(--space-3xl)' }}>
        {/* Header Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              All Inquiries
            </h2>
            {unread > 0 && (
              <span className="badge badge-error" style={{ padding: '2px 10px', fontSize: 'var(--text-xs)' }}>
                {unread} unread
              </span>
            )}
          </div>

          {notifications.length > 0 && unread > 0 && (
            <button className="btn btn-outline btn-sm" onClick={markAllRead}>
              <CheckCheck size={14} /> Mark All as Read
            </button>
          )}
        </div>

        {/* Skeleton loading state */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="empty-state">
            <AlertCircle size={40} style={{ color: 'var(--color-error)' }} />
            <h3>{error}</h3>
            <button className="btn btn-outline" onClick={fetchNotifications}>
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && notifications.length === 0 && (
          <div className="empty-state">
            <Bell size={40} />
            <h3>No inquiries yet</h3>
            <p>When buyers submit interested inquiries on your properties, they will appear here.</p>
          </div>
        )}

        {/* Notification Cards List */}
        {!loading && !error && notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  background: 'var(--color-surface)',
                  border: `1px solid ${n.isRead ? 'var(--color-border)' : 'var(--color-primary)'}`,
                  borderLeft: `4px solid ${n.isRead ? 'var(--color-border)' : 'var(--color-primary)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-lg)',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'box-shadow var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                  {n.propertyId?.images?.[0] ? (
                    <img
                      src={n.propertyId.images[0]}
                      alt={n.propertyId?.title || 'Property'}
                      style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail size={22} />
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                      {n.title || 'New Property Inquiry'}
                    </h3>
                    {n.propertyId && (
                      <Link to={`/listings/${n.propertyId._id}`} style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        View Property Listing <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
                  <p><strong>From:</strong> {n.NAME}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Phone size={13} /> <strong>Phone:</strong> <a href={`tel:${n.PHONE}`} style={{ color: 'inherit' }}>{n.PHONE}</a>
                  </p>
                  <p style={{ fontStyle: 'italic', marginTop: 6, color: 'var(--color-text-primary)' }}>"{n.INTERESTED_IN_THE_PROPERTY}"</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 8 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  {!n.isRead && (
                    <button className="btn btn-outline btn-sm" onClick={() => markOneRead(n._id)}>
                      Mark as Read
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteNotification(n._id)} style={{ color: 'var(--color-error)' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
