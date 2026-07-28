import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon, Building2, Trees, Briefcase, Warehouse,
  MapPin, Bed, Bath, Maximize2, ChevronRight, CheckCircle2,
  Users, Star, TrendingUp, Bookmark
} from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';

const API_BASE = import.meta.env.VITE_API_URL;

const formatMoney = (num) => 'GH₵ ' + Number(num).toLocaleString('en-GH');

const CATEGORIES = [
  { label: 'Houses',      icon: <HomeIcon size={24} />,    type: 'house' },
  { label: 'Apartments',  icon: <Building2 size={24} />,   type: 'apartment' },
  { label: 'Villas',      icon: <Trees size={24} />,       type: 'villa' },
  { label: 'Commercial',  icon: <Briefcase size={24} />,   type: 'commercial' },
  { label: 'Land',        icon: <Warehouse size={24} />,   type: 'land' },
];

const CITIES = [
  { name: 'Accra',       count: '500+', image: 'https://images.unsplash.com/photo-1588392382834-a891154bca4d?w=600&auto=format&fit=crop&q=80' },
  { name: 'Kumasi',      count: '200+', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format&fit=crop&q=80' },
  { name: 'Takoradi',    count: '120+', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&auto=format&fit=crop&q=80' },
  { name: 'Tamale',      count: '80+',  image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&auto=format&fit=crop&q=80' },
];

const STATS = [
  { number: '5,000+',  label: 'Properties Listed',    icon: <HomeIcon size={24} /> },
  { number: '1,200+',  label: 'Verified Agents',       icon: <Users size={24} /> },
  { number: '4.8★',    label: 'Average Rating',        icon: <Star size={24} /> },
  { number: '98%',     label: 'Client Satisfaction',   icon: <TrendingUp size={24} /> },
];

/* ── Skeleton card ─────────────────────────── */
function SkeletonCard() {
  return (
    <div className="prop-card-skeleton">
      <div className="skeleton skeleton-img" />
      <div style={{ padding: '16px' }}>
        <div className="skeleton skeleton-line skeleton-short" />
        <div className="skeleton skeleton-line skeleton-med" />
        <div className="skeleton skeleton-line" style={{ width: '40%' }} />
        <div className="skeleton-specs">
          <div className="skeleton skeleton-spec" />
          <div className="skeleton skeleton-spec" />
          <div className="skeleton skeleton-spec" />
        </div>
      </div>
    </div>
  );
}

/* ── Property card ─────────────────────────── */
function PropCard({ listing }) {
  const [fav, setFav] = useState(false);
  const mainImage =
    listing.images?.length > 0
      ? listing.images[0]
      : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600';

  const statusMap = {
    available: 'badge badge-success',
    pending:   'badge badge-warning',
    sold:      'badge badge-error',
    rented:    'badge badge-info',
  };

  return (
    <div style={{ position: 'relative' }}>
      <Link to={`/listings/${listing._id}`} className="prop-card">
        <div className="prop-card-image-wrap">
          <img src={mainImage} alt={listing.title} className="prop-card-image" loading="lazy" />
          <div className="prop-card-status">
            <span className={statusMap[listing.status] || 'badge badge-success'}>
              {listing.status ? listing.status.charAt(0).toUpperCase() + listing.status.slice(1) : 'Available'}
            </span>
            {listing.listingType && (
              <span className={`badge ${listing.listingType === 'rent' ? 'badge-info' : 'badge-light'}`}>
                For {listing.listingType.charAt(0).toUpperCase() + listing.listingType.slice(1)}
              </span>
            )}
          </div>
          <div className="prop-card-featured-badge">Featured</div>
        </div>
        <div className="prop-card-body">
          <p className="prop-card-price">{formatMoney(listing.price)}</p>
          <h3 className="prop-card-title">{listing.title}</h3>
          <p className="prop-card-location">
            <MapPin size={12} />
            {listing.city}, {listing.region}
          </p>
          <div className="prop-card-specs">
            {listing.bedrooms != null && (
              <span className="prop-spec"><Bed size={13} /> {listing.bedrooms} Beds</span>
            )}
            {listing.bathrooms != null && (
              <span className="prop-spec"><Bath size={13} /> {listing.bathrooms} Baths</span>
            )}
            {listing.area != null && (
              <span className="prop-spec"><Maximize2 size={13} /> {listing.area} m²</span>
            )}
          </div>
        </div>
      </Link>

      <button
        className={`prop-card-heart${fav ? ' active' : ''}`}
        onClick={() => setFav((f) => !f)}
        aria-label={fav ? 'Remove from saved' : 'Save property'}
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
      >
        <Bookmark size={15} fill={fav ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

/* ── Main component ─────────────────────────── */
export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    try {
      const res = await fetch(`${API_BASE}/properties?limit=6`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) setFeatured(data.data.slice(0, 6));
    } catch {
      // silently fail — home page still renders without featured
    } finally {
      setLoadingFeatured(false);
    }
  };

  return (
    <main className="page-enter">
      {/* ── Hero Carousel ── */}
      <HeroCarousel />

      {/* ── Category Grid ── */}
      <section className="home-section" style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <span className="section-label">Browse by Type</span>
          <h2 className="section-title">What Are You Looking For?</h2>
          <div className="category-grid">
            {CATEGORIES.map(({ label, icon, type }) => (
              <Link
                key={type}
                to={`/listings?propertyType=${type}`}
                className="category-card"
              >
                <div className="category-icon">{icon}</div>
                <span className="category-name">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <section className="home-section" style={{ background: 'var(--color-surface)' }}>
        <div className="container">
          <div className="featured-header">
            <div>
              <span className="section-label">✦ Hand-picked</span>
              <h2 className="section-title">Featured Listings</h2>
              <p className="section-subtitle">Our editors' top picks across Ghana right now.</p>
            </div>
            <Link to="/listings" className="btn btn-outline" style={{ flexShrink: 0 }}>
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="featured-grid">
            {loadingFeatured
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : featured.map((l) => <PropCard key={l._id} listing={l} />)
            }
          </div>

          {!loadingFeatured && featured.length === 0 && (
            <div className="empty-state">
              <HomeIcon size={40} />
              <h3>No listings yet</h3>
              <p>Check back soon — agents are adding new properties.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Trust Stats ── */}
      <div className="stats-strip">
        <div className="stats-grid">
          {STATS.map(({ number, label }) => (
            <div key={label}>
              <p className="stat-number">{number}</p>
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Popular Cities ── */}
      <section className="home-section" style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <span className="section-label">
            <MapPin size={12} /> Locations
          </span>
          <h2 className="section-title">Popular Cities</h2>
          <p className="section-subtitle">Find your next home in Ghana's most sought-after locations.</p>

          <div className="cities-grid">
            {CITIES.map(({ name, count, image }) => (
              <Link key={name} to={`/listings?city=${name}`} className="city-card">
                <img src={image} alt={name} className="city-card-img" loading="lazy" />
                <div className="city-card-overlay">
                  <p className="city-name">{name}</p>
                  <p className="city-count">{count} listings</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── About / CTA strip ── */}
      <section className="home-section" style={{ background: 'var(--color-surface)', textAlign: 'center' }}>
        <div className="container-sm">
          <span className="section-label"><CheckCircle2 size={12} /> Ghana-Built</span>
          <h2 className="section-title">Why PropertyConnect Ghana?</h2>
          <p className="section-subtitle" style={{ margin: '0 auto var(--space-xl)', textAlign: 'center' }}>
            A Ghanaian platform connecting buyers, renters, and agents. Verified listings,
            trusted agents, and direct communication — all in one place.
          </p>
          <div className="flex-center gap-md">
            <Link to="/listings" className="btn btn-primary btn-lg">
              Explore Listings <ChevronRight size={18} />
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg">
              List Your Property
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}