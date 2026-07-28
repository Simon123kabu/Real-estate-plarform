import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Maximize2, Bookmark, Phone, Mail,
  ChevronRight, ChevronLeft, X, CheckCircle2, AlertCircle, Home as HomeIcon, Camera
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
    <div className="detail-gallery-carousel">
      <div className="skeleton detail-gallery-stage" />
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <div className="skeleton" style={{ width: 100, height: 70, borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ width: 100, height: 70, borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ width: 100, height: 70, borderRadius: 'var(--radius-md)' }} />
      </div>
    </div>
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
      const res = await fetch(`${API_BASE}/properties/${listing._id}/inquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

/* ── Main Detail Page ── */
export default function PropertyDetail() {
  const { id } = useParams();
  const { isFavourite, toggleFavourite } = useFavourites();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

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

  const images = listing?.images?.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200'];

  const handleNextImage = (e) => {
    if (e) e.stopPropagation();
    setActiveImg((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e) => {
    if (e) e.stopPropagation();
    setActiveImg((prev) => (prev - 1 + images.length) % images.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'Escape') setShowLightbox(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  if (loading) {
    return (
      <div className="detail-page page-enter">
        <div className="detail-wrap">
          <GallerySkeleton />
          <div className="detail-layout">
            <div className="detail-info">
              <div className="skeleton skeleton-line" style={{ width: '70%', height: 32, marginBottom: 12 }} />
              <div className="skeleton skeleton-line" style={{ width: '40%', height: 18, marginBottom: 16 }} />
              <div className="skeleton skeleton-line" style={{ width: '30%', height: 28, marginBottom: 24 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="detail-page page-enter">
        <div className="detail-wrap" style={{ textAlign: 'center', padding: '60px 0' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-error)', marginBottom: 16 }} />
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

  return (
    <div className="detail-page page-enter">
      <div className="detail-wrap">
        {/* ── Breadcrumbs ── */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/"><HomeIcon size={14} /> Home</Link>
          <ChevronRight size={14} className="breadcrumb-sep" />
          <Link to="/listings">Listings</Link>
          <ChevronRight size={14} className="breadcrumb-sep" />
          <span className="breadcrumb-current">{listing.title}</span>
        </nav>

        {/* ── Interactive Image Carousel & Gallery ── */}
        <div className="detail-gallery-carousel">
          {/* Main Stage */}
          <div className="detail-gallery-stage" onClick={() => setShowLightbox(true)}>
            <img
              src={images[activeImg]}
              alt={`${listing.title} — photo ${activeImg + 1}`}
              className="detail-gallery-main-img"
            />

            {/* Photo Counter Badge */}
            <div className="detail-gallery-badge">
              <Camera size={13} /> {activeImg + 1} / {images.length}
            </div>

            {/* Fullscreen Expand Button */}
            <button
              className="detail-gallery-expand-btn"
              onClick={(e) => { e.stopPropagation(); setShowLightbox(true); }}
              title="View full screen"
              aria-label="View full screen"
            >
              <Maximize2 size={15} />
            </button>

            {/* Left/Right Carousel Arrows */}
            {images.length > 1 && (
              <>
                <button
                  className="detail-gallery-arrow gallery-arrow-prev"
                  onClick={handlePrevImage}
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  className="detail-gallery-arrow gallery-arrow-next"
                  onClick={handleNextImage}
                  aria-label="Next photo"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>

          {/* Horizontal Thumbnails Strip */}
          {images.length > 1 && (
            <div className="detail-gallery-thumbs">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`detail-thumb-btn${i === activeImg ? ' active' : ''}`}
                  onClick={() => setActiveImg(i)}
                  title={`View photo ${i + 1}`}
                >
                  <img src={img} alt={`Thumbnail ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Content Layout ── */}
        <div className="detail-layout">
          {/* Left: Property Info */}
          <div className="detail-info">
            <div className="detail-title-row">
              <h1 className="detail-title">{listing.title}</h1>
              <span className={STATUS_CLASS[listing.status] || STATUS_CLASS.available}>
                {listing.status ? listing.status.charAt(0).toUpperCase() + listing.status.slice(1) : 'Available'}
              </span>
            </div>

            <p className="detail-location">
              <MapPin size={15} />
              {listing.address && `${listing.address}, `}{listing.city}, {listing.region}
            </p>

            <p className="detail-price">{formatMoney(listing.price)}</p>

            {/* Spec pills */}
            <div className="detail-specs">
              {listing.bedrooms != null && (
                <span className="spec-pill"><Bed size={15} /> {listing.bedrooms} Bedrooms</span>
              )}
              {listing.bathrooms != null && (
                <span className="spec-pill"><Bath size={15} /> {listing.bathrooms} Bathrooms</span>
              )}
              {listing.area != null && (
                <span className="spec-pill"><Maximize2 size={15} /> {listing.area} m²</span>
              )}
              {listing.listingType && (
                <span className="spec-pill badge badge-light" style={{ textTransform: 'capitalize' }}>
                  For {listing.listingType}
                </span>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <>
                <h3 className="detail-desc-title">About this property</h3>
                <p className="detail-desc">{listing.description}</p>
              </>
            )}
          </div>

          {/* Right: Agent Sidebar */}
          <aside className="detail-sidebar">
            {listing.agent && (
              <div className="agent-sidebar-card">
                <p className="agent-sidebar-label">Listed by</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                  <div className="agent-sidebar-avatar">
                    {listing.agent.profileImage ? (
                      <img src={listing.agent.profileImage} alt={listing.agent.name} />
                    ) : (
                      agentInitials
                    )}
                  </div>
                  <div>
                    <p className="agent-sidebar-name">{listing.agent.name}</p>
                    <span className="badge badge-light" style={{ fontSize: '10px' }}>Verified Agent</span>
                  </div>
                </div>

                {listing.agent.phone && (
                  <a href={`tel:${listing.agent.phone}`} className="agent-sidebar-contact" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Phone size={14} /> {listing.agent.phone}
                  </a>
                )}

                {listing.agent.email && (
                  <a href={`mailto:${listing.agent.email}`} className="agent-sidebar-contact" style={{ textDecoration: 'none', color: 'inherit', marginBottom: 'var(--space-md)' }}>
                    <Mail size={14} /> {listing.agent.email}
                  </a>
                )}

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowModal(true)}>
                  Contact Agent
                </button>
              </div>
            )}

            {!listing.agent && (
              <div className="agent-sidebar-card">
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowModal(true)}>
                  I'm Interested
                </button>
              </div>
            )}

            {/* Bookmark button */}
            <button className={`detail-fav-btn${fav ? ' active' : ''}`} onClick={() => toggleFavourite(listing)}>
              <Bookmark size={16} fill={fav ? 'currentColor' : 'none'} />
              {fav ? 'Saved Property' : 'Save Property'}
            </button>

            {/* Back link */}
            <Link to="/listings" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
              ← Back to Listings
            </Link>
          </aside>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showModal && <InquiryModal listing={listing} onClose={() => setShowModal(false)} />}

      {/* ── Fullscreen Lightbox Modal ── */}
      {showLightbox && (
        <div className="modal-overlay" onClick={() => setShowLightbox(false)} style={{ background: 'rgba(0, 0, 0, 0.93)', zIndex: 1000 }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowLightbox(false)}
              style={{ position: 'absolute', top: 20, right: 20, color: '#ffffff', background: 'rgba(255, 255, 255, 0.15)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={24} />
            </button>

            <div style={{ position: 'absolute', top: 24, left: 24, color: '#ffffff', fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: 'var(--radius-pill)' }}>
              <Camera size={15} /> {activeImg + 1} / {images.length}
            </div>

            <img
              src={images[activeImg]}
              alt={listing.title}
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  style={{ position: 'absolute', left: 20, color: '#ffffff', background: 'rgba(255, 255, 255, 0.18)', border: 'none', borderRadius: '50%', width: 52, height: 52, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={30} />
                </button>
                <button
                  onClick={handleNextImage}
                  style={{ position: 'absolute', right: 20, color: '#ffffff', background: 'rgba(255, 255, 255, 0.18)', border: 'none', borderRadius: '50%', width: 52, height: 52, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Next photo"
                >
                  <ChevronRight size={30} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
