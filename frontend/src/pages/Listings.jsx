import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, Bed, Bath, Maximize2, Bookmark, ChevronLeft, ChevronRight, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useFavourites } from '../context/FavouritesContext';

const API_BASE = import.meta.env.VITE_API_URL;
const formatMoney = (num) => 'GH₵ ' + Number(num).toLocaleString('en-GH');

const STATUS_CLASS = {
  available: 'badge badge-success',
  pending:   'badge badge-warning',
  sold:      'badge badge-error',
  rented:    'badge badge-info',
};

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

/* ── Property card ── */
function PropCard({ listing }) {
  const { isFavourite, toggleFavourite } = useFavourites();
  const fav = isFavourite(listing._id);
  const mainImage = listing.images?.length > 0
    ? listing.images[0]
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600';

  return (
    <div style={{ position: 'relative' }}>
      <Link to={`/listings/${listing._id}`} className="prop-card">
        <div className="prop-card-image-wrap">
          <img src={mainImage} alt={listing.title} className="prop-card-image" loading="lazy" />
          <div className="prop-card-status">
            <span className={STATUS_CLASS[listing.status] || STATUS_CLASS.available}>
              {listing.status ? listing.status.charAt(0).toUpperCase() + listing.status.slice(1) : 'Available'}
            </span>
            {listing.listingType && (
              <span className={`badge ${listing.listingType === 'rent' ? 'badge-info' : 'badge-light'}`}>
                For {listing.listingType.charAt(0).toUpperCase() + listing.listingType.slice(1)}
              </span>
            )}
          </div>
        </div>
        <div className="prop-card-body">
          <p className="prop-card-price">{formatMoney(listing.price)}</p>
          <h3 className="prop-card-title">{listing.title}</h3>
          <p className="prop-card-location">
            <MapPin size={12} />
            {listing.city}, {listing.region}
          </p>
          <div className="prop-card-specs">
            {listing.bedrooms  != null && <span className="prop-spec"><Bed size={13} />{listing.bedrooms} Beds</span>}
            {listing.bathrooms != null && <span className="prop-spec"><Bath size={13} />{listing.bathrooms} Baths</span>}
            {listing.area      != null && <span className="prop-spec"><Maximize2 size={13} />{listing.area} m²</span>}
          </div>
        </div>
      </Link>

      <button
        className={`prop-card-heart${fav ? ' active' : ''}`}
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
        onClick={(e) => { e.preventDefault(); toggleFavourite(listing); }}
        aria-label={fav ? 'Remove from saved' : 'Save property'}
      >
        <Bookmark size={15} fill={fav ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

/* ── Main Listings page ── */
export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search,     setSearch]     = useState(searchParams.get('search') || searchParams.get('keyword') || '');
  const [minPrice,   setMinPrice]   = useState('');
  const [maxPrice,   setMaxPrice]   = useState('');
  const [bedrooms,   setBedrooms]   = useState('any');
  const [propType,   setPropType]   = useState(searchParams.get('propertyType') || 'any');
  const [listType,   setListType]   = useState('any');
  const [showFilter, setShowFilter] = useState(false);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);

  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const fetchListings = useCallback(async (pg = page) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: pg, limit: 12 });
      if (search.trim()) {
        params.set('search', search.trim());
        params.set('keyword', search.trim());
      }
      if (minPrice)            params.set('minPrice', minPrice);
      if (maxPrice)            params.set('maxPrice', maxPrice);
      if (bedrooms !== 'any')  params.set('minBedrooms', bedrooms);
      if (propType !== 'any')  params.set('propertyType', propType);
      if (listType !== 'any')  params.set('listingType', listType);

      const res  = await fetch(`${API_BASE}/properties?${params}`, { credentials: 'include' });
      const data = await res.json();

      if (res.ok && data.success) {
        setListings(data.data);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || data.data.length);
      } else {
        setError(data.message || 'Could not load listings.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, minPrice, maxPrice, bedrooms, propType, listType, page]);

  // Sync URL searchParam changes (e.g. from Hero carousel search)
  useEffect(() => {
    const urlQuery = searchParams.get('search') || searchParams.get('keyword') || '';
    if (urlQuery && urlQuery !== search) {
      setSearch(urlQuery);
    }
  }, [searchParams]);

  // Debounced auto-search on typing & filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings(1);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, minPrice, maxPrice, bedrooms, propType, listType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchListings(1);
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchListings(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setMinPrice(''); setMaxPrice('');
    setBedrooms('any'); setPropType('any'); setListType('any');
    setPage(1); fetchListings(1);
  };

  const hasFilters = minPrice || maxPrice || bedrooms !== 'any' || propType !== 'any' || listType !== 'any';

  // Page numbers array
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1);

  return (
    <div className="listings-page page-enter">
      {/* ── Hero + Search ── */}
      <div className="listings-hero">
        <h1>All Listings</h1>
        <p>Browse {total > 0 ? `${total.toLocaleString()} verified` : ''} properties across Ghana</p>
        <div className="listings-search-wrap">
          <form className="listings-search" onSubmit={handleSearchSubmit} role="search">
            <MapPin size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
            <input
              className="listings-search-input"
              type="text"
              placeholder="Search by title, city, or keyword…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search properties"
              id="listings-search"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', display: 'flex' }}>
                <X size={16} />
              </button>
            )}
            <button type="submit" className="listings-search-btn">
              <Search size={14} /> Search
            </button>
          </form>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="listings-toolbar">
        <p className="listings-results-count">
          {loading ? 'Loading…' : `${total.toLocaleString()} ${total === 1 ? 'listing' : 'listings'} found`}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              <X size={14} /> Clear filters
            </button>
          )}
          <button
            className={`listings-filter-btn${showFilter ? ' active' : ''}`}
            onClick={() => setShowFilter((f) => !f)}
            aria-expanded={showFilter}
          >
            <SlidersHorizontal size={15} />
            {showFilter ? 'Hide Filters' : 'Filters'}
            {hasFilters && <span className="badge badge-primary" style={{ padding: '1px 7px', fontSize: '10px' }}>ON</span>}
          </button>
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilter && (
        <div className="filter-panel">
          <div className="filter-panel-inner">
            <div className="filter-group">
              <label className="label">Min Price (GH₵)</label>
              <input className="input" type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </div>
            <div className="filter-group">
              <label className="label">Max Price (GH₵)</label>
              <input className="input" type="number" placeholder="No limit" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            <div className="filter-group">
              <label className="label">Min Bedrooms</label>
              <select className="input" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
                <option value="any">Any</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label className="label">Property Type</label>
              <select className="input" value={propType} onChange={(e) => setPropType(e.target.value)}>
                <option value="any">Any</option>
                {['house','apartment','villa','land','commercial'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="label">Listing Type</label>
              <select className="input" value={listType} onChange={(e) => setListType(e.target.value)}>
                <option value="any">Any</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
            <div className="filter-actions">
              <button className="btn btn-primary btn-sm" onClick={() => { setPage(1); fetchListings(1); setShowFilter(false); }}>
                Apply Filters
              </button>
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      <div className="listings-grid-wrap">
        {error && (
          <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', color: 'var(--color-error)', marginBottom: 'var(--space-md)' }}>
              <AlertCircle size={20} /> <span>{error}</span>
            </div>
            <button className="btn btn-outline" onClick={() => fetchListings(page)}>
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        {!error && (
          <div className="listings-grid">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
              : listings.map((l) => <PropCard key={l._id} listing={l} />)
            }
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="empty-state">
            <Search size={40} />
            <h3>No listings found</h3>
            <p>Try adjusting your search or clearing your filters.</p>
            <button className="btn btn-outline" onClick={clearFilters}>Clear Filters</button>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-ghost btn-sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} /> Prev
            </button>

            {pageNums.map((n, i) => {
              const prev = pageNums[i - 1];
              return (
                <>
                  {prev && n - prev > 1 && <span className="page-info">…</span>}
                  <button
                    key={n}
                    className={`page-btn${n === page ? ' active' : ''}`}
                    onClick={() => handlePageChange(n)}
                    aria-label={`Page ${n}`}
                    aria-current={n === page ? 'page' : undefined}
                  >
                    {n}
                  </button>
                </>
              );
            })}

            <button
              className="btn btn-ghost btn-sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              aria-label="Next page"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
