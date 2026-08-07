import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Bookmark, ChevronRight, ChevronLeft, X, CheckCircle2, AlertCircle,
  Home as HomeIcon, Camera, Shield
} from 'lucide-react';
import { useFavourites } from '../context/FavouritesContext';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL;
const formatMoney = (num) => 'GH₵ ' + Number(num).toLocaleString('en-GH');

const STATUS_CLASS = {
  available: 'badge badge-success',
  pending:   'badge badge-warning',
  sold:      'badge badge-error',
  rented:    'badge badge-info',
};

/* ── Gallery skeleton ── */
function GallerySkeleton() {
  return (
    <div className="dtl-gallery-section">
      <div className="dtl-gallery-grid">
        <div className="skeleton dtl-gallery-item dtl-gallery-hero" style={{ height: '100%' }} />
        <div className="skeleton dtl-gallery-item" style={{ height: '100%' }} />
        <div className="skeleton dtl-gallery-item" style={{ height: '100%' }} />
        <div className="skeleton dtl-gallery-item" style={{ height: '100%' }} />
        <div className="skeleton dtl-gallery-item" style={{ height: '100%' }} />
      </div>
    </div>
  );
}

/* ── Lightbox Component ── */
function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setCurrent((i) => (i - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [images.length, onClose]);

  return createPortal(
    <div className="dtl-lightbox-overlay" onClick={onClose}>
      <button className="dtl-lightbox-close" onClick={onClose} aria-label="Close photo modal">
        <X size={22} />
      </button>

      {images.length > 1 && (
        <button
          className="dtl-lightbox-nav dtl-lightbox-prev"
          onClick={(e) => {
            e.stopPropagation();
            setCurrent((i) => (i - 1 + images.length) % images.length);
          }}
          aria-label="Previous photo"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      <div className="dtl-lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={images[current]} alt={`Photo ${current + 1}`} className="dtl-lightbox-img" />
      </div>

      {images.length > 1 && (
        <button
          className="dtl-lightbox-nav dtl-lightbox-next"
          onClick={(e) => {
            e.stopPropagation();
            setCurrent((i) => (i + 1) % images.length);
          }}
          aria-label="Next photo"
        >
          <ChevronRight size={28} />
        </button>
      )}

      <div className="dtl-lightbox-counter">
        <Camera size={14} /> {current + 1} / {images.length}
      </div>
    </div>,
    document.body
  );
}

/* ── Inquiry Modal ── */
function InquiryModal({ listing, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/notifications/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          propertyId: listing._id,
          NAME: name.trim(),
          PHONE: phone.trim(),
          INTERESTED_IN_THE_PROPERTY: message.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Could not send inquiry.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Inquire About Property</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>
              <CheckCircle2 size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-md)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>
                Inquiry Sent!
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                The agent has received your message and will contact you shortly.
              </p>
              <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Interested in <strong>{listing.title}</strong>? Send a message directly to the agent.
              </p>

              <div>
                <label className="label">Your Name *</label>
                <input className="input" type="text" placeholder="e.g. John Mensah" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="label">Phone Number *</label>
                <input className="input" type="tel" placeholder="e.g. +233 24 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div>
                <label className="label">Message *</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Hi, I am interested in this property. Is it still available for viewing?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
                {submitting ? 'Sending Inquiry…' : 'Send Inquiry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  Main Detail Page                                         */
/* ══════════════════════════════════════════════════════════ */
export default function PropertyDetail() {
  const { id } = useParams();
  const { isFavourite, toggleFavourite } = useFavourites();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/properties/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setListing(data.data);
      } else {
        setError(data.message || 'Property not found.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validImages = (listing?.images || []).filter(img => img && typeof img === 'string' && img.trim() !== '');
  const images = validImages.length > 0
    ? validImages
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200'];

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  /* Loading state */
  if (loading) {
    return (
      <div className="dtl-page page-enter">
        <div className="dtl-wrap">
          <GallerySkeleton />
          <div className="dtl-layout">
            <div className="dtl-left">
              <div className="dtl-card">
                <div className="skeleton skeleton-line" style={{ width: '70%', height: 32, marginBottom: 12 }} />
                <div className="skeleton skeleton-line" style={{ width: '40%', height: 18, marginBottom: 16 }} />
                <div className="skeleton skeleton-line" style={{ width: '30%', height: 28, marginBottom: 24 }} />
                <div className="skeleton skeleton-line" style={{ width: '100%', height: 14, marginBottom: 8 }} />
                <div className="skeleton skeleton-line" style={{ width: '100%', height: 14, marginBottom: 8 }} />
                <div className="skeleton skeleton-line" style={{ width: '80%', height: 14 }} />
              </div>
            </div>
            <div>
              <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Error state */
  if (error || !listing) {
    return (
      <div className="dtl-page page-enter">
        <div className="dtl-wrap" style={{ textAlign: 'center', padding: '80px 0' }}>
          <AlertCircle size={52} style={{ color: 'var(--color-error)', marginBottom: 16 }} />
          <h2>{error || 'Property Not Found'}</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
            The property you are looking for may have been removed or is unavailable.
          </p>
          <Link to="/listings" className="btn btn-primary">
            ← Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  const fav = isFavourite(listing._id);
  const agentInitials = listing.agent?.name
    ? listing.agent.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AG';

  const createdDate = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="dtl-page page-enter">
      {/* ═══════════════════════════════════════════ */}
      {/* BREADCRUMB                                   */}
      {/* ═══════════════════════════════════════════ */}
      <nav className="dtl-breadcrumb" aria-label="Breadcrumb">
        <div className="dtl-breadcrumb-inner">
          <Link to="/"><HomeIcon size={13} /> Home</Link>
          <ChevronRight size={13} className="dtl-bread-sep" />
          <Link to="/listings">Listings</Link>
          <ChevronRight size={13} className="dtl-bread-sep" />
          {listing.city && (
            <>
              <Link to={`/listings?search=${encodeURIComponent(listing.city)}`}>{listing.city}</Link>
              <ChevronRight size={13} className="dtl-bread-sep" />
            </>
          )}
          <span className="dtl-bread-current">{listing.title}</span>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════ */}
      {/* IMAGE GALLERY (Mosaic Grid)                  */}
      {/* ═══════════════════════════════════════════ */}
      <section className="dtl-gallery-section">
        <div className={`dtl-gallery-grid count-${Math.min(images.length, 5)}`}>
          {images.slice(0, 5).map((img, i) => (
            <div
              key={i}
              className={`dtl-gallery-item${i === 0 && images.length > 1 ? ' dtl-gallery-hero' : ''}`}
              onClick={() => openLightbox(i)}
            >
              <img src={img} alt={`${listing.title} — photo ${i + 1}`} loading={i < 2 ? 'eager' : 'lazy'} />
              {i === 4 && images.length > 5 && (
                <div className="dtl-gallery-more">
                  <Camera size={18} />
                  <span>+ {images.length - 5} Photos</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="dtl-thumbs">
            {images.map((img, i) => (
              <button
                key={i}
                className="dtl-thumb-btn"
                onClick={() => openLightbox(i)}
                title={`View photo ${i + 1}`}
              >
                <img src={img} alt={`Thumbnail ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* MAIN LAYOUT: Left Content + Right Sidebar    */}
      {/* ═══════════════════════════════════════════ */}
      <div className="dtl-layout">
        <div className="dtl-left">

          {/* ── Header Card ── */}
          <div className="dtl-card dtl-header-card">
            <div className="dtl-badges-row">
              <span className={STATUS_CLASS[listing.status] || STATUS_CLASS.available}>
                {listing.status ? listing.status.charAt(0).toUpperCase() + listing.status.slice(1) : 'Available'}
              </span>
              {listing.listingType && (
                <span className={`badge ${listing.listingType === 'rent' ? 'badge-info' : 'badge-accent'}`}>
                  For {listing.listingType.charAt(0).toUpperCase() + listing.listingType.slice(1)}
                </span>
              )}
              {listing.propertyType && (
                <span className="badge badge-light">
                  {listing.propertyType.charAt(0).toUpperCase() + listing.propertyType.slice(1)}
                </span>
              )}
            </div>

            <h1 className="dtl-title">{listing.title}</h1>
            <p className="dtl-location">
              <MapPin size={15} />
              {listing.address && `${listing.address}, `}{listing.city}, {listing.region}
            </p>

            <div className="dtl-specs-bar">
              {listing.bedrooms != null && listing.bedrooms > 0 && (
                <div className="dtl-spec">
                  <div className="dtl-spec-val">{listing.bedrooms}</div>
                  <div className="dtl-spec-lbl">Bedroom{listing.bedrooms > 1 ? 's' : ''}</div>
                </div>
              )}
              {listing.bathrooms != null && listing.bathrooms > 0 && (
                <div className="dtl-spec">
                  <div className="dtl-spec-val">{listing.bathrooms}</div>
                  <div className="dtl-spec-lbl">Bathroom{listing.bathrooms > 1 ? 's' : ''}</div>
                </div>
              )}
              {listing.area != null && (
                <div className="dtl-spec">
                  <div className="dtl-spec-val">{listing.area.toLocaleString()}</div>
                  <div className="dtl-spec-lbl">Sq Meters</div>
                </div>
              )}
              {listing.propertyType && (
                <div className="dtl-spec">
                  <div className="dtl-spec-val" style={{ fontSize: 'var(--text-base)' }}>
                    {listing.propertyType.charAt(0).toUpperCase() + listing.propertyType.slice(1)}
                  </div>
                  <div className="dtl-spec-lbl">Property Type</div>
                </div>
              )}
            </div>

            <div className="dtl-price-row">
              <span className="dtl-price">{formatMoney(listing.price)}</span>
              {listing.listingType && (
                <span className="dtl-price-note">
                  For {listing.listingType.charAt(0).toUpperCase() + listing.listingType.slice(1)}
                  {createdDate && ` • Listed ${createdDate}`}
                </span>
              )}
            </div>
          </div>

          {/* ── Description ── */}
          {listing.description && (
            <div className="dtl-card">
              <h3 className="dtl-section-title">
                <span className="dtl-section-icon">📝</span> About This Property
              </h3>
              <div className="dtl-desc">
                {listing.description.split('\n').filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* RIGHT SIDEBAR — Sticky                       */}
        {/* ═══════════════════════════════════════════ */}
        <aside className="dtl-sidebar">
          {/* Agent Card */}
          <div className="dtl-sidebar-card dtl-agent-card">
            <div className="dtl-agent-header">
              <div className="dtl-agent-avatar-lg">
                {listing?.agent?.profileImage && typeof listing.agent.profileImage === 'string' && listing.agent.profileImage.trim() ? (
                  <img src={listing.agent.profileImage.trim()} alt={listing.agent?.name || 'Agent'} />
                ) : (
                  agentInitials
                )}
              </div>

              <div>
                <div className="dtl-agent-name-lg">{listing.agent?.name || 'Property Agent'}</div>
                <div className="dtl-agent-title-lg">
                  <Shield size={13} /> Verified Agent
                </div>
              </div>
            </div>

            <button className="dtl-cta-btn dtl-cta-primary" onClick={() => setShowModal(true)}>
              Contact Agent
            </button>

            <button
              className={`dtl-cta-btn dtl-cta-save${fav ? ' saved' : ''}`}
              onClick={() => toggleFavourite(listing)}
            >
              <Bookmark size={16} strokeWidth={2.4} fill={fav ? 'currentColor' : 'none'} />
              {fav ? 'Saved Property' : 'Save Property'}
            </button>
          </div>

          {/* Safety Tip */}
          <div className="dtl-safety-tip">
            <strong>⚠️ Safety First</strong>
            <p>Never send money before viewing the property and verifying the title. Our agents will never ask for payment via mobile money before a site visit. Report suspicious behavior immediately.</p>
          </div>

          {/* Back link */}
          <Link to="/listings" className="dtl-back-link">
            <ChevronLeft size={15} /> Back to Listings
          </Link>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* LIGHTBOX                                     */}
      {/* ═══════════════════════════════════════════ */}
      {lightboxOpen && (
        <Lightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Inquiry Modal */}
      {showModal && <InquiryModal listing={listing} onClose={() => setShowModal(false)} />}
    </div>
  );
}
