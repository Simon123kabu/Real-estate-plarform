import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL;

const formatMoney = (num) => 'GH₵ ' + Number(num).toLocaleString('en-GH');

export default function AgentDashboard() {
  const [listings, setListings] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [area, setArea] = useState('');
  const [listingType, setListingType] = useState('rent');
  const [propertyType, setPropertyType] = useState('house');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/properties/my-listings`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setListings(data.data);
        setQuota(data.quota || null);
      } else {
        setError(data.message || 'Could not load your listings.');
      }
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCity('');
    setRegion('');
    setAddress('');
    setPrice('');
    setBedrooms('');
    setBathrooms('');
    setArea('');
    setListingType('rent');
    setPropertyType('house');
    setDescription('');
    setImageFiles([]);
    setEditingId(null);
    setFormError('');
  };

  const startEdit = (listing) => {
    setEditingId(listing._id);
    setTitle(listing.title || '');
    setCity(listing.city || '');
    setRegion(listing.region || '');
    setAddress(listing.address || '');
    setPrice(listing.price ?? '');
    setBedrooms(listing.bedrooms ?? '');
    setBathrooms(listing.bathrooms ?? '');
    setArea(listing.area ?? '');
    setListingType(listing.listingType || 'rent');
    setPropertyType(listing.propertyType || 'house');
    setDescription(listing.description || '');
    setImageFiles([]);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title || !description || !price || !address || !city || !region) {
      setFormError('Please fill in Title, Description, Price, Address, City, and Region.');
      return;
    }

    setSubmitting(true);

    const payload = {
      title,
      description,
      price: Number(price),
      listingType,
      propertyType,
      address,
      city,
      region,
      bedrooms: bedrooms ? Number(bedrooms) : 0,
      bathrooms: bathrooms ? Number(bathrooms) : 0,
      area: area ? Number(area) : undefined,
    };

    try {
      let propertyId = editingId;

      if (editingId) {
        const res = await fetch(`${API_BASE}/properties/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setFormError(data.message || 'Could not update listing.');
          setSubmitting(false);
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/properties`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setFormError(data.message || 'Could not create listing.');
          setSubmitting(false);
          return;
        }
        propertyId = data.data._id;
      }

      if (imageFiles.length > 0 && propertyId) {
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append('images', file));

        const uploadRes = await fetch(`${API_BASE}/properties/${propertyId}/images`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          setFormError(
            uploadData.message ||
              'Listing saved, but photo upload failed. You can try again by editing this listing.'
          );
        }
      }

      resetForm();
      setShowForm(false);
      fetchMyListings();
    } catch (err) {
      setFormError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (listingId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/properties/${listingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setListings((prev) =>
          prev.map((l) => (l._id === listingId ? { ...l, status: newStatus } : l))
        );
      } else {
        alert(data.message || 'Could not update status.');
      }
    } catch (err) {
      alert('Could not reach the server.');
    }
  };

  const deleteListing = async (listingId) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;

    try {
      const res = await fetch(`${API_BASE}/properties/${listingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        fetchMyListings();
      } else {
        alert(data.message || 'Could not delete listing.');
      }
    } catch (err) {
      alert('Could not reach the server.');
    }
  };

  const atLimit = quota && quota.canCreateListing === false;

  return (
    <div className="page-bg" style={styles.wrap}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Listings</h1>
        <button
          onClick={() => {
            if (showForm) resetForm();
            setShowForm((prev) => !prev);
          }}
          style={styles.addButton}
          disabled={!showForm && atLimit}
        >
          {showForm ? 'Cancel' : '+ Add New Listing'}
        </button>
      </div>

      {quota && (
        <div style={styles.quotaBanner}>
          <strong>{quota.effectivePlan}</strong> plan — {quota.activeListings} of{' '}
          {quota.maxActiveListings} active listings used.
          {atLimit && (
            <>
              {' '}You've reached your limit.{' '}
              <a href="/subscription" style={styles.upgradeLink}>Upgrade your plan</a> to add more.
            </>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card-modern" style={styles.form}>
          <h2 style={styles.formTitle}>{editingId ? 'Edit Listing' : 'New Listing'}</h2>

          <input
            type="text"
            placeholder="Property Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.textarea}
          />

          <input
            type="text"
            placeholder="Street Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={styles.input}
          />

          <div style={styles.row}>
            <input
              type="text"
              placeholder="City (e.g. Accra)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={styles.inputHalf}
            />
            <input
              type="text"
              placeholder="Region (e.g. Greater Accra)"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={styles.inputHalf}
            />
          </div>

          <input
            type="number"
            placeholder="Price (GH₵)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={styles.input}
          />

          <div style={styles.row}>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              style={styles.inputHalf}
            >
              <option value="rent">For Rent</option>
              <option value="sale">For Sale</option>
            </select>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              style={styles.inputHalf}
            >
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>

          <div style={styles.row}>
            <input
              type="number"
              placeholder="Bedrooms"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              style={styles.inputHalf}
            />
            <input
              type="number"
              placeholder="Bathrooms"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              style={styles.inputHalf}
            />
            <input
              type="number"
              placeholder="Area (m²)"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              style={styles.inputHalf}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Photos (up to 10)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files))}
              style={styles.fileInput}
            />
            {imageFiles.length > 0 && (
              <p style={styles.fileCount}>{imageFiles.length} photo(s) selected</p>
            )}
          </div>

          {formError && <p style={styles.errorText}>{formError}</p>}

          <button type="submit" style={styles.submitButton} disabled={submitting}>
            {submitting ? 'Saving...' : editingId ? 'Update Listing' : 'Save Listing'}
          </button>
        </form>
      )}

      {loading && <p style={styles.stateText}>Loading your listings...</p>}

      {error && (
        <div style={styles.errorBox}>
          <p>{error}</p>
          <button onClick={fetchMyListings} style={styles.retryButton}>Retry</button>
        </div>
      )}

      {!loading && !error && listings.length === 0 && (
        <div style={styles.empty}>
          <p style={styles.emptyText}>
            You haven't added any listings yet. Click "+ Add New Listing" to get started.
          </p>
        </div>
      )}

      {!loading && !error && listings.length > 0 && (
        <div style={styles.grid}>
          {listings.map((listing) => {
            const mainImage =
              listing.images && listing.images.length > 0
                ? listing.images[0]
                : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500';

            return (
              <div key={listing._id} className="card-modern" style={styles.card}>
                <img src={mainImage} alt={listing.title} style={styles.cardImage} />
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{listing.title}</h3>
                  <p style={styles.cardLocation}>{listing.region}, {listing.city}</p>
                  <p style={styles.cardPrice}>{formatMoney(listing.price)}</p>
                  <p style={styles.cardSpecs}>
                    {listing.bedrooms ?? '-'} Bed • {listing.bathrooms ?? '-'} Bath
                    {listing.visibility === 'expired' && (
                      <span style={styles.expiredTag}> • Expired</span>
                    )}
                  </p>

                  <select
                    value={listing.status}
                    onChange={(e) => changeStatus(listing._id, e.target.value)}
                    style={styles.statusSelect}
                  >
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                  </select>

                  <div style={styles.cardActions}>
                    <button onClick={() => startEdit(listing)} style={styles.editButton}>
                      Edit
                    </button>
                    <button
                      onClick={() => deleteListing(listing._id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { padding: '40px 32px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' },
  title: { marginBottom: 0 },
  addButton: {
    padding: '12px 20px', backgroundColor: 'var(--color-primary)', color: 'var(--color-white)',
    border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  quotaBanner: {
    backgroundColor: 'var(--color-white)', padding: '14px 20px', borderRadius: '10px',
    marginBottom: '32px', fontSize: '0.9rem', color: 'var(--color-charcoal)',
  },
  upgradeLink: { color: 'var(--color-primary)', fontWeight: 700 },
  form: {
    display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--color-white)',
    padding: '28px', marginBottom: '40px', maxWidth: '560px',
  },
  formTitle: { marginBottom: '8px' },
  row: { display: 'flex', gap: '14px' },
  input: { padding: '14px', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'var(--font-body)', fontSize: '1rem' },
  inputHalf: { flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'var(--font-body)', fontSize: '1rem' },
  textarea: { padding: '14px', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'var(--font-body)', fontSize: '1rem', minHeight: '90px', resize: 'vertical' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-secondary)' },
  fileInput: { fontFamily: 'var(--font-body)' },
  fileCount: { fontSize: '0.85rem', color: '#666' },
  errorText: { color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' },
  submitButton: {
    padding: '14px', backgroundColor: 'var(--color-secondary)', color: 'var(--color-cream)',
    border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '1rem',
  },
  stateText: { textAlign: 'center', color: '#777', padding: '40px 0' },
  errorBox: { padding: '20px', backgroundColor: '#fdecea', color: 'var(--color-primary)', borderRadius: '10px', textAlign: 'center', maxWidth: '500px' },
  retryButton: { marginTop: '10px', padding: '8px 16px', backgroundColor: 'var(--color-primary)', color: 'var(--color-white)', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  empty: { padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--color-white)', borderRadius: '12px' },
  emptyText: { color: '#777', fontSize: '1.05rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' },
  card: { backgroundColor: 'var(--color-white)', overflow: 'hidden' },
  cardImage: { width: '100%', height: '190px', objectFit: 'cover' },
  cardBody: { padding: '20px' },
  cardTitle: { marginBottom: '6px' },
  cardLocation: { fontSize: '0.95rem', color: '#666', marginBottom: '6px', fontWeight: 600 },
  cardPrice: { fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '6px' },
  cardSpecs: { fontSize: '0.9rem', color: '#555', marginBottom: '14px' },
  expiredTag: { color: 'var(--color-primary)', fontWeight: 700 },
  statusSelect: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '14px', fontSize: '0.9rem' },
  cardActions: { display: 'flex', gap: '10px' },
  editButton: {
    flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'var(--color-secondary)',
    border: '1px solid var(--color-secondary)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
  },
  deleteButton: {
    flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'var(--color-primary)',
    border: '1px solid var(--color-primary)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
  },
};
