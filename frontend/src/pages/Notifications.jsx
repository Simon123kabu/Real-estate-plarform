import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, Phone, ExternalLink, AlertCircle, RefreshCw, Home as HomeIcon
} from 'lucide-react';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL;

/* ── Type Badge Config ── */
const TYPE_CONFIG = {
  PROPERTY_INQUIRY:     { label: 'Buyer Inquiry',        badgeClass: 'badge-info' },
  PROPERTY_VIEWED:      { label: 'Property Viewed',      badgeClass: 'badge-light' },
  LISTING_EXPIRED:      { label: 'Listing Expired',      badgeClass: 'badge-warning' },
  SUBSCRIPTION_EXPIRED: { label: 'Subscription Expired', badgeClass: 'badge-error' },
};

const FILTER_TABS = [
  { key: 'all',    label: 'All' },
  { key: 'unread', label: 'Unread' },
];

/* ── Date Grouping Helper ── */
function getDateGroup(dateStr) {
  if (!dateStr) return 'Older';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'Earlier This Week';
  if (diffDays < 30) return 'Earlier This Month';
  return 'Older';
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/* Helper to extract real linked property details */
const getPropDetails = (n) => {
  if (!n) return null;

  // Case 1: propertyId is populated object
  if (n.propertyId && typeof n.propertyId === 'object' && n.propertyId._id) {
    const validImg = n.propertyId.images?.find(img => img && typeof img === 'string' && img.trim());
    return {
      id: String(n.propertyId._id),
      title: n.propertyId.title || n.title || 'Property Listing',
      city: n.propertyId.city || '',
      image: validImg || null,
    };
  }

  // Case 2: propertyId is string ID
  if (n.propertyId && typeof n.propertyId === 'string' && n.propertyId.trim()) {
    return {
      id: n.propertyId.trim(),
      title: n.title ? n.title.replace(/^New inquiry for\s*/i, '').replace(/^Inquiry:\s*/i, '') : 'Property Listing',
      city: '',
      image: null,
    };
  }

  // Case 3: property fallback object
  if (n.property && typeof n.property === 'object' && n.property._id) {
    const validImg = n.property.images?.find(img => img && typeof img === 'string' && img.trim());
    return {
      id: String(n.property._id),
      title: n.property.title || n.title || 'Property Listing',
      city: n.property.city || '',
      image: validImg || null,
    };
  }


  return null;
};

/* ── Notification Row Skeleton ── */
function NotificationSkeleton() {
  return (
    <div className="notif-card">
      <div className="skeleton skeleton-line" style={{ width: '40%', height: 16, marginBottom: 12 }} />
      <div className="skeleton skeleton-line" style={{ width: '85%', height: 14, marginBottom: 8 }} />
      <div className="skeleton skeleton-line" style={{ width: '100%', height: 60, borderRadius: 'var(--radius-md)', marginBottom: 12 }} />
      <div className="skeleton skeleton-line" style={{ width: '50%', height: 32 }} />
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

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
      }
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
      }
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
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
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    }
  };

  const handleCall = (phone) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone, name, propertyTitle, message) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${name || 'there'}, I received your inquiry regarding "${propertyTitle || 'the property'}". ${
        message ? `You asked: "${message.slice(0, 80)}..."` : ''
      } How can I assist you today?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  /* Counts */
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  /* Filter */
  const filtered = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  /* Date Grouping */
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((n) => {
      const key = getDateGroup(n.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    const order = ['Today', 'Yesterday', 'Earlier This Week', 'Earlier This Month', 'Older'];
    return order
      .filter((k) => groups[k] && groups[k].length > 0)
      .map((k) => ({ label: k, items: groups[k] }));
  }, [filtered]);

  return (
    <main className="notif-page page-enter">
      <div className="notif-container">
        {/* Header & Filter Controls Box */}
        <div className="notif-header-box">
          <div className="notif-toolbar">
            <div className="notif-header-title">
              <h1>Notifications</h1>
              {unreadCount > 0 && (
                <span className="notif-unread-badge">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {notifications.length > 0 && unreadCount > 0 && (
              <button className="btn btn-outline btn-sm" onClick={markAllRead}>
                <CheckCheck size={14} /> Mark All as Read
              </button>
            )}
          </div>

          {/* Clean Borderless Filter Tabs (All / Unread only) */}
          <div className="notif-filter-tabs">
            {FILTER_TABS.map((tab) => {
              const badgeVal = tab.key === 'unread' ? unreadCount : notifications.length;

              return (
                <button
                  key={tab.key}
                  className={`notif-tab-btn${activeTab === tab.key ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  {badgeVal > 0 && <span className="notif-tab-count">{badgeVal}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="notif-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="empty-state">
            <AlertCircle size={40} style={{ color: 'var(--color-error)' }} />
            <h3>{error}</h3>
            <button className="btn btn-outline" onClick={fetchNotifications}>
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <Bell size={40} />
            <h3>No notifications found</h3>
            <p>
              {activeTab === 'unread'
                ? 'You have read all your notifications.'
                : 'When buyers submit inquiries on your property listings, they will appear here.'}
            </p>
          </div>
        )}

        {/* Grouped Notification List */}
        {!loading && !error && filtered.length > 0 && (
          <div>
            {grouped.map((group) => (
              <div key={group.label} className="notif-date-group">
                <div className="notif-date-label">{group.label}</div>
                <div className="notif-list">
                  {group.items.map((n) => {
                    const typeCfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.PROPERTY_INQUIRY;
                    const prop = getPropDetails(n);

                    return (
                      <div
                        key={n._id}
                        className={`notif-card${!n.isRead ? ' unread' : ''}`}
                        onClick={() => !n.isRead && markOneRead(n._id)}
                      >
                        <div className="notif-card-header">
                          <div className="notif-card-info">
                            <div className="notif-meta-row">
                              <span className={`badge ${typeCfg.badgeClass}`}>
                                {typeCfg.label}
                              </span>
                              <span className="notif-time">{formatTime(n.createdAt)}</span>
                            </div>

                            <h3 className="notif-card-title">{n.title || 'Property Inquiry'}</h3>
                          </div>
                        </div>

                        {/* Buyer Inquiry Content */}
                        <div className="notif-card-body">
                          {n.NAME && (
                            <p className="notif-sender">
                              <strong>From:</strong> {n.NAME}
                            </p>
                          )}
                          {n.PHONE && (
                            <p className="notif-phone">
                              <Phone size={13} /> <strong>Phone:</strong>{' '}
                              <a href={`tel:${n.PHONE}`} onClick={(e) => e.stopPropagation()}>
                                {n.PHONE}
                              </a>
                            </p>
                          )}
                          {n.INTERESTED_IN_THE_PROPERTY && (
                            <p className="notif-message-text">"{n.INTERESTED_IN_THE_PROPERTY}"</p>
                          )}
                        </div>

                        {/* Prominent Inquired Property Box with "View Property Details" Button (Renders when real property is attached) */}
                        {prop && (
                          <div className="notif-prop-box">
                            <div className="notif-prop-box-left">
                              {prop.image ? (
                                <img src={prop.image} alt={prop.title} className="notif-prop-img" loading="lazy" />
                              ) : (
                                <div className="notif-prop-placeholder">
                                  <HomeIcon size={24} />
                                </div>
                              )}
                              <div>
                                <div className="notif-prop-box-title">{prop.title}</div>
                                {prop.city && <div className="notif-prop-box-sub">{prop.city}</div>}
                              </div>
                            </div>

                            <Link
                              to={`/listings/${prop.id}`}
                              className="notif-view-prop-btn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={14} /> View Property Details
                            </Link>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="notif-card-actions">
                          {n.PHONE && (
                            <button
                              className="notif-act-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCall(n.PHONE);
                              }}
                            >
                              <Phone size={13} /> Call Buyer
                            </button>
                          )}

                          {n.PHONE && (
                            <button
                              className="notif-act-btn notif-act-whatsapp"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWhatsApp(n.PHONE, n.NAME, prop?.title, n.INTERESTED_IN_THE_PROPERTY);
                              }}
                            >
                              💬 WhatsApp Reply
                            </button>
                          )}

                          {!n.isRead && (
                            <button
                              className="notif-act-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                markOneRead(n._id);
                              }}
                            >
                              <CheckCheck size={13} /> Mark Read
                            </button>
                          )}

                          <button
                            className="notif-act-btn notif-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n._id);
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
