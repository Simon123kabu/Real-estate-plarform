import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, MapPin, Bed, Bath, Maximize2, Bookmark, ChevronLeft, ChevronRight,
  X, AlertCircle, RefreshCw, SlidersHorizontal, Phone
} from 'lucide-react';
import { useFavourites } from '../context/FavouritesContext';

const API_BASE = import.meta.env.VITE_API_URL;
const formatMoney = (num) => 'GH₵ ' + Number(num).toLocaleString('en-GH');

const STATUS_CLASS = {
  available: 'badge badge-success',
  pending:   'badge badge-warning',
  sold:      'badge badge-error',
  rented:    'badge badge-info',
};

const PROPERTY_TYPES = ['house', 'apartment', 'villa', 'land', 'commercial'];
const BEDROOM_OPTIONS = [
  { label: '1 Bed', value: '1' },
  { label: '2 Beds', value: '2' },
  { label: '3 Beds', value: '3' },
  { label: '4+ Beds', value: '4' },
];
const CITIES = ['Accra', 'Kumasi', 'Cape Coast', 'Takoradi', 'Tema', 'Tamale', 'Sunyani', 'Ho'];

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="lst-card-skeleton">
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

/* ── Property Card (enhanced) ── */
function PropCard({ listing }) {
  const { isFavourite, toggleFavourite } = useFavourites();
  const fav = isFavourite(listing._id);
  const mainImage = listing.images?.length > 0
    ? listing.images[0]
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600';

  const agentInitials = listing.agent?.name
    ? listing.agent.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AG';

  return (
    <div className="lst-card-wrap">
      <Link to={`/listings/${listing._id}`} className="lst-card">
        <div className="lst-card-img-wrap">
          <img
            src={mainImage}
            alt={listing.title}
            className="lst-card-img"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600';
            }}
          />
          <div className="lst-card-badges">
            <span className={STATUS_CLASS[listing.status] || STATUS_CLASS.available}>
              {listing.status ? listing.status.charAt(0).toUpperCase() + listing.status.slice(1) : 'Available'}
            </span>
            {listing.listingType && (
              <span className={`badge ${listing.listingType === 'rent' ? 'badge-info' : 'badge-accent'}`}>
                For {listing.listingType.charAt(0).toUpperCase() + listing.listingType.slice(1)}
              </span>
            )}
          </div>
          <button
            className={`lst-card-save${fav ? ' saved' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavourite(listing);
            }}
            aria-label={fav ? 'Remove from saved' : 'Save property'}
          >
            <Bookmark size={16} strokeWidth={2.4} fill={fav ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="lst-card-body">
          <div className="lst-card-price-row">
            <span className="lst-card-price">{formatMoney(listing.price)}</span>
            {listing.propertyType && (
              <span className="lst-card-type">
                {listing.propertyType.charAt(0).toUpperCase() + listing.propertyType.slice(1)}
              </span>
            )}
          </div>
          <h3 className="lst-card-title">{listing.title}</h3>
          <p className="lst-card-loc">
            <MapPin size={13} />
            {listing.address ? `${listing.address}, ` : ''}{listing.city}, {listing.region}
          </p>
          <div className="lst-card-specs">
            {listing.bedrooms != null && listing.bedrooms > 0 && (
              <span className="lst-spec"><Bed size={13} /> {listing.bedrooms} Bed{listing.bedrooms > 1 ? 's' : ''}</span>
            )}
            {listing.bathrooms != null && listing.bathrooms > 0 && (
              <span className="lst-spec"><Bath size={13} /> {listing.bathrooms} Bath{listing.bathrooms > 1 ? 's' : ''}</span>
            )}
            {listing.area != null && (
              <span className="lst-spec"><Maximize2 size={13} /> {listing.area.toLocaleString()} m²</span>
            )}
          </div>

          <div className="lst-card-agent">
            <div className="lst-agent-info">
              <div className="lst-agent-avatar">
                {listing.agent?.profileImage ? (
                  <img src={listing.agent.profileImage} alt={listing.agent.name} />
                ) : (
                  agentInitials
                )}
              </div>
              <div>
                <div className="lst-agent-name">{listing.agent?.name || 'Agent'}</div>
                <div className="lst-agent-label">Verified Agent</div>
              </div>
            </div>
            <span className="lst-contact-btn">
              <Phone size={12} /> Contact
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  Main Listings Page                                       */
/* ══════════════════════════════════════════════════════════ */
export default function Listings() {
  const [searchParams] = useSearchParams();

  const [search,     setSearch]     = useState(searchParams.get('search') || searchParams.get('keyword') || '');
  const [minPrice,   setMinPrice]   = useState('');
  const [maxPrice,   setMaxPrice]   = useState('');
  const [bedrooms,   setBedrooms]   = useState('any');
  const [propType,   setPropType]   = useState(searchParams.get('propertyType') || 'any');
  const [listType,   setListType]   = useState('any');
  const [sortBy,     setSortBy]     = useState('newest');
  const [selectedCities, setSelectedCities] = useState([]);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  /* Toggle helpers */
  const toggleCity = (c) =>
    setSelectedCities((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

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
      if (selectedCities.length === 1) params.set('city', selectedCities[0]);
      if (sortBy)              params.set('sort', sortBy);

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
  }, [search, minPrice, maxPrice, bedrooms, propType, listType, selectedCities, sortBy, page]);

  // Sync URL searchParam changes
  useEffect(() => {
    const urlQuery = searchParams.get('search') || searchParams.get('keyword') || '';
    if (urlQuery && urlQuery !== search) {
      setSearch(urlQuery);
    }
  }, [searchParams]);

  // Debounced auto-search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings(1);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, minPrice, maxPrice, bedrooms, propType, listType, selectedCities, sortBy]);

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
    setSelectedCities([]);
    setPage(1);
    fetchListings(1);
  };

  const activeFilterCount =
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (bedrooms !== 'any' ? 1 : 0) +
    (propType !== 'any' ? 1 : 0) +
    (listType !== 'any' ? 1 : 0) +
    selectedCities.length;

  // Page numbers
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1);

  return (
    <main className="lst-page page-enter">
      {/* ═══════════════════════════════════════════ */}
      {/* SEARCH BAND (sticky)                        */}
      {/* ═══════════════════════════════════════════ */}
      <section className="lst-search-band">
        <div className="lst-search-inner">
          <form className="lst-search-field" onSubmit={handleSearchSubmit}>
            <Search size={17} className="lst-search-icon" />
            <input
              type="text"
              placeholder="Search city, neighborhood, or keyword…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search properties"
              id="listings-search"
            />
            {search && (
              <button type="button" className="lst-search-clear" onClick={() => setSearch('')}>
                <X size={15} />
              </button>
            )}
          </form>

          <button
            className={`lst-filter-pill${showMobileFilters ? ' active' : ''}`}
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal size={14} />
            <span className="lst-filter-pill-label">Filters</span>
            {activeFilterCount > 0 && (
              <span className="lst-filter-count">{activeFilterCount}</span>
            )}
          </button>

          <select
            className="lst-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="oldest">Oldest First</option>
          </select>

          <button type="submit" className="lst-search-btn" onClick={handleSearchSubmit}>
            <Search size={14} /> Search
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* MOBILE FILTER CHIPS                         */}
      {/* ═══════════════════════════════════════════ */}
      <div className={`lst-mobile-chips${showMobileFilters ? ' open' : ''}`}>
        {PROPERTY_TYPES.map((t) => (
          <button
            key={t}
            className={`lst-chip${propType === t ? ' active' : ''}`}
            onClick={() => setPropType(propType === t ? 'any' : t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <button
          className={`lst-chip${listType === 'sale' ? ' active' : ''}`}
          onClick={() => setListType(listType === 'sale' ? 'any' : 'sale')}
        >
          For Sale
        </button>
        <button
          className={`lst-chip${listType === 'rent' ? ' active' : ''}`}
          onClick={() => setListType(listType === 'rent' ? 'any' : 'rent')}
        >
          For Rent
        </button>
        {activeFilterCount > 0 && (
          <button className="lst-chip lst-chip-clear" onClick={clearFilters}>
            <X size={12} /> Clear All
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* RESULTS BAR                                 */}
      {/* ═══════════════════════════════════════════ */}
      <div className="lst-results-bar">
        <p className="lst-results-count">
          {loading ? 'Loading…' : (
            <>Showing <strong>{total.toLocaleString()}</strong> propert{total === 1 ? 'y' : 'ies'}{search && ` for "${search}"`}</>
          )}
        </p>
        {activeFilterCount > 0 && (
          <button className="lst-clear-btn" onClick={clearFilters}>
            <X size={13} /> Clear {activeFilterCount} Filter{activeFilterCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* MAIN GRID: Sidebar + Listings               */}
      {/* ═══════════════════════════════════════════ */}
      <div className="lst-layout">
        {/* ── Sidebar Filters ── */}
        <aside className="lst-sidebar">
          {/* Price */}
          <div className="lst-filter-group">
            <h4 className="lst-filter-heading">Price Range (GH₵)</h4>
            <div className="lst-price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className="lst-price-sep">—</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Property Type */}
          <div className="lst-filter-group">
            <h4 className="lst-filter-heading">Property Type</h4>
            <div className="lst-checkbox-list">
              {PROPERTY_TYPES.map((t) => (
                <label key={t} className="lst-checkbox-row">
                  <input
                    type="radio"
                    name="propType"
                    checked={propType === t}
                    onChange={() => setPropType(propType === t ? 'any' : t)}
                  />
                  <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                </label>
              ))}
              {propType !== 'any' && (
                <button className="lst-sidebar-reset" onClick={() => setPropType('any')}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Bedrooms */}
          <div className="lst-filter-group">
            <h4 className="lst-filter-heading">Bedrooms</h4>
            <div className="lst-checkbox-list">
              {BEDROOM_OPTIONS.map((opt) => (
                <label key={opt.value} className="lst-checkbox-row">
                  <input
                    type="radio"
                    name="bedrooms"
                    checked={bedrooms === opt.value}
                    onChange={() => setBedrooms(bedrooms === opt.value ? 'any' : opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
              {bedrooms !== 'any' && (
                <button className="lst-sidebar-reset" onClick={() => setBedrooms('any')}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Listing Type */}
          <div className="lst-filter-group">
            <h4 className="lst-filter-heading">Listing Type</h4>
            <div className="lst-checkbox-list">
              <label className="lst-checkbox-row">
                <input
                  type="radio"
                  name="listType"
                  checked={listType === 'sale'}
                  onChange={() => setListType(listType === 'sale' ? 'any' : 'sale')}
                />
                <span>For Sale</span>
              </label>
              <label className="lst-checkbox-row">
                <input
                  type="radio"
                  name="listType"
                  checked={listType === 'rent'}
                  onChange={() => setListType(listType === 'rent' ? 'any' : 'rent')}
                />
                <span>For Rent</span>
              </label>
              {listType !== 'any' && (
                <button className="lst-sidebar-reset" onClick={() => setListType('any')}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* City */}
          <div className="lst-filter-group lst-filter-group-last">
            <h4 className="lst-filter-heading">City</h4>
            <div className="lst-checkbox-list">
              {CITIES.map((c) => (
                <label key={c} className="lst-checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedCities.includes(c)}
                    onChange={() => toggleCity(c)}
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button className="lst-clear-all-btn" onClick={clearFilters}>
              Clear {activeFilterCount} Filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
        </aside>

        {/* ── Listings Grid ── */}
        <div className="lst-area">
          {error && (
            <div className="lst-error-state">
              <AlertCircle size={22} />
              <span>{error}</span>
              <button className="btn btn-outline btn-sm" onClick={() => fetchListings(page)}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}

          {!error && (
            <div className="lst-grid">
              {loading
                ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
                : listings.map((l) => <PropCard key={l._id} listing={l} />)
              }
            </div>
          )}

          {!loading && !error && listings.length === 0 && (
            <div className="empty-state">
              <Search size={40} />
              <h3>No properties found</h3>
              <p>Try adjusting your search or clearing your filters.</p>
              <button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
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
                  <span key={n}>
                    {prev && n - prev > 1 && <span className="page-info">…</span>}
                    <button
                      className={`page-btn${n === page ? ' active' : ''}`}
                      onClick={() => handlePageChange(n)}
                      aria-label={`Page ${n}`}
                      aria-current={n === page ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  </span>
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
    </main>
  );
}
