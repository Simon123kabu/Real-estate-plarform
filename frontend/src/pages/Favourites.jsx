import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Bed, Bath, Maximize2, Trash2 } from 'lucide-react';
import { useFavourites } from '../context/FavouritesContext';
import '../styles/pages.css';

const formatMoney = (num) => 'GH₵ ' + Number(num).toLocaleString('en-GH');

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="prop-card-skeleton">
      <div className="skeleton skeleton-img" />
      <div style={{ padding: '16px' }}>
        <div className="skeleton skeleton-line" style={{ width: '45%', height: '18px' }} />
        <div className="skeleton skeleton-line skeleton-med" />
        <div className="skeleton skeleton-line skeleton-short" />
        <div className="skeleton-specs">
          <div className="skeleton skeleton-spec" />
          <div className="skeleton skeleton-spec" />
          <div className="skeleton skeleton-spec" />
        </div>
      </div>
    </div>
  );
}

export default function Favourites() {
  const { favourites, loading, toggleFavourite } = useFavourites();

  return (
    <div className="listings-page page-enter">
      {/* ── Hero Banner ── */}
      <div className="listings-hero">
        <span className="badge badge-light" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', marginBottom: 'var(--space-xs)' }}>
          <Bookmark size={12} fill="currentColor" /> Saved Properties
        </span>
        <h1>My Favourites</h1>
        <p>Bookmarked listings you're interested in</p>
      </div>

      <div className="listings-grid-wrap" style={{ paddingTop: 'var(--space-xl)' }}>
        {loading && (
          <div className="listings-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && favourites.length === 0 && (
          <div className="empty-state">
            <Bookmark size={40} />
            <h3>No saved properties yet</h3>
            <p>Browse listings and click the bookmark icon on any property to save it here.</p>
            <Link to="/listings" className="btn btn-primary">Browse Listings</Link>
          </div>
        )}

        {!loading && favourites.length > 0 && (
          <div className="listings-grid">
            {favourites.map((listing) => {
              const mainImage =
                listing.images && listing.images.length > 0
                  ? listing.images[0]
                  : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600';

              return (
                <div key={listing._id} style={{ position: 'relative' }}>
                  <Link to={`/listings/${listing._id}`} className="prop-card">
                    <div className="prop-card-image-wrap">
                      <img src={mainImage} alt={listing.title} className="prop-card-image" loading="lazy" />
                      {listing.status && (
                        <div className="prop-card-status">
                          <span className={`badge badge-${listing.status === 'available' ? 'success' : listing.status === 'pending' ? 'warning' : 'error'}`}>
                            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="prop-card-body">
                      <p className="prop-card-price">{formatMoney(listing.price)}</p>
                      <h3 className="prop-card-title">{listing.title}</h3>
                      <p className="prop-card-location">
                        <MapPin size={12} />
                        {listing.city}, {listing.region}
                      </p>
                      <div className="prop-card-specs">
                        {listing.bedrooms != null && <span className="prop-spec"><Bed size={13} />{listing.bedrooms} Beds</span>}
                        {listing.bathrooms != null && <span className="prop-spec"><Bath size={13} />{listing.bathrooms} Baths</span>}
                        {listing.area != null && <span className="prop-spec"><Maximize2 size={13} />{listing.area} m²</span>}
                      </div>
                    </div>
                  </Link>

                  <button
                    className="prop-card-heart active"
                    style={{ position: 'absolute', top: 12, right: 12, zIndex: 5 }}
                    onClick={(e) => { e.preventDefault(); toggleFavourite(listing); }}
                    aria-label="Remove from saved"
                    title="Remove from saved"
                  >
                    <Bookmark size={20} strokeWidth={2.4} fill="currentColor" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
