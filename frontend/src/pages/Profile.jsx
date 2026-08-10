import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera, Settings, LayoutGrid, Bookmark, Plus, Edit2, Trash2,
  MapPin, Phone, Calendar, X, AlertCircle, ShieldCheck, Zap, Upload,
  Loader2, CheckCircle2, ImagePlus, Home, Eye, ArrowRight, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavourites } from '../context/FavouritesContext';
import Modal from '../components/Modal';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL;
const formatMoney = (num) => 'GH₵ ' + Number(num).toLocaleString('en-GH');

const PROPERTY_TYPES = ['apartment', 'house', 'land', 'office', 'townhouse', 'villa'];

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const { favourites, toggleFavourite } = useFavourites();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const imageUploadRef = useRef(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState(
    user?.role === 'agent' ? 'listings' : 'saved'
  );

  // Agent State
  const [myListings, setMyListings] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loadingListings, setLoadingListings] = useState(false);
  const [inquiriesCount, setInquiriesCount] = useState(0);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState(null);

  // Uploads & Image States
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [propertyImageFiles, setPropertyImageFiles] = useState([]);

  // Edit Profile Form State
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Property Form State
  const [propTitle, setPropTitle] = useState('');
  const [propPrice, setPropPrice] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propCity, setPropCity] = useState('Accra');
  const [propRegion, setPropRegion] = useState('Greater Accra');
  const [propAddress, setPropAddress] = useState('');
  const [propBeds, setPropBeds] = useState('2');
  const [propBaths, setPropBaths] = useState('2');
  const [propArea, setPropArea] = useState('120');
  const [propListType, setPropListType] = useState('sale');
  const [propType, setPropType] = useState('apartment');
  const [propSaving, setPropSaving] = useState(false);
  const [propError, setPropError] = useState('');

  useEffect(() => {
    if (user?.role === 'agent') {
      fetchMyListings();
      fetchInquiriesCount();
    }
  }, [user]);

  // Fetch Agent's Own Listings
  const fetchMyListings = async () => {
    setLoadingListings(true);
    try {
      const res = await fetch(`${API_BASE}/properties/my-listings`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyListings(data.data || []);
        if (data.quota) setQuota(data.quota);
      }
    } catch {
      // fallback
    } finally {
      setLoadingListings(false);
    }
  };

  // Fetch Notification Inquiries count
  const fetchInquiriesCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications?limit=50`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const count = data.data.total ?? data.data.notifications?.length ?? 0;
        setInquiriesCount(count);
      }
    } catch {
      // fallback
    }
  };

  // Avatar Upload
  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarUploading(true);
    setProfileError('');
    setProfileSuccess('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE}/auth/me/profile-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileSuccess('Profile picture updated successfully!');
        if (refreshUser) refreshUser();
      } else {
        setProfileError(data.message || 'Could not upload profile picture.');
      }
    } catch {
      setProfileError('Could not reach the server.');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  // Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProfileSuccess('Profile updated successfully.');
        if (refreshUser) refreshUser();
        setTimeout(() => setShowEditModal(false), 1000);
      } else {
        setProfileError(data.message || 'Could not save profile.');
      }
    } catch {
      setProfileError('Could not reach the server.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleOpenEditProfile = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setProfileError('');
    setProfileSuccess('');
    setShowEditModal(true);
  };

  // Open Create Property Modal
  const handleOpenCreateProperty = () => {
    setEditingProperty(null);
    setPropTitle('');
    setPropPrice('');
    setPropDesc('');
    setPropCity('Accra');
    setPropRegion('Greater Accra');
    setPropAddress('');
    setPropBeds('2');
    setPropBaths('2');
    setPropArea('120');
    setPropListType('sale');
    setPropType('apartment');
    setExistingImages([]);
    setPropertyImageFiles([]);
    setPropError('');
    setShowPropertyModal(true);
  };

  // Open Edit Property Modal
  const handleOpenEditProperty = async (prop) => {
    setEditingProperty(prop);
    setPropTitle(prop.title || '');
    setPropPrice(prop.price || '');
    setPropDesc(prop.description || prop.desc || '');
    setPropCity(prop.city || '');
    setPropRegion(prop.region || '');
    setPropAddress(prop.address || prop.location || prop.streetAddress || '');
    setPropBeds(prop.bedrooms ?? '0');
    setPropBaths(prop.bathrooms ?? '0');
    setPropArea(prop.area ?? '0');
    setPropListType(prop.listingType || 'sale');
    setPropType(prop.propertyType || 'apartment');
    setExistingImages(prop.images || []);
    setPropertyImageFiles([]);
    setPropError('');
    setShowPropertyModal(true);

    try {
      const res = await fetch(`${API_BASE}/properties/${prop._id}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const full = data.data;
        if (full.description) setPropDesc(full.description);
        if (full.address) setPropAddress(full.address);
        if (full.title) setPropTitle(full.title);
        if (full.price) setPropPrice(full.price);
        if (full.city) setPropCity(full.city);
        if (full.region) setPropRegion(full.region);
        if (full.images) setExistingImages(full.images);
      }
    } catch {
      // fallback
    }
  };

  // Delete existing property photo (matches DELETE /api/properties/:id/images with body { imageUrl })
  const handleDeleteExistingImage = async (imgUrl) => {
    if (!editingProperty?._id) return;
    try {
      const res = await fetch(`${API_BASE}/properties/${editingProperty._id}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageUrl: imgUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setExistingImages((prev) => prev.filter((img) => img !== imgUrl));
        fetchMyListings();
      } else {
        setExistingImages((prev) => prev.filter((img) => img !== imgUrl));
      }
    } catch {
      setExistingImages((prev) => prev.filter((img) => img !== imgUrl));
    }
  };

  const handlePropertyImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPropertyImageFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const handleRemoveQueuedImage = (index) => {
    setPropertyImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Property Save
  const handleSaveProperty = async (e) => {
    e.preventDefault();
    setPropError('');

    if (!propTitle.trim() || !propPrice || !propDesc.trim() || !propCity.trim() || !propRegion.trim() || !propAddress.trim()) {
      setPropError('Please fill in Title, Price, Description, Address, City, and Region.');
      return;
    }

    setPropSaving(true);
    const bodyObj = {
      title: propTitle.trim(),
      description: propDesc.trim(),
      price: Number(propPrice),
      listingType: propListType,
      propertyType: propType,
      address: propAddress.trim(),
      city: propCity.trim(),
      region: propRegion.trim(),
      bedrooms: Number(propBeds),
      bathrooms: Number(propBaths),
      area: Number(propArea),
    };

    const isEdit = !!editingProperty;
    const url = isEdit ? `${API_BASE}/properties/${editingProperty._id}` : `${API_BASE}/properties`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bodyObj),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const createdId = isEdit ? editingProperty._id : data.data._id;

        if (propertyImageFiles.length > 0 && createdId) {
          const imgFormData = new FormData();
          propertyImageFiles.forEach((file) => imgFormData.append('images', file));
          await fetch(`${API_BASE}/properties/${createdId}/images`, {
            method: 'POST',
            credentials: 'include',
            body: imgFormData,
          });
        }

        setShowPropertyModal(false);
        fetchMyListings();
      } else {
        setPropError(data.message || 'Could not save property.');
      }
    } catch {
      setPropError('Could not reach the server.');
    } finally {
      setPropSaving(false);
    }
  };

  // Status Change via backend PATCH /api/properties/:id/status
  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/properties/${propertyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchMyListings();
    } catch {
      // fallback
    }
  };

  // Delete Property via backend DELETE /api/properties/:id
  const handleDeleteProperty = async () => {
    if (!deletingPropertyId) return;
    try {
      const res = await fetch(`${API_BASE}/properties/${deletingPropertyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setMyListings((prev) => prev.filter((p) => p._id !== deletingPropertyId));
      }
    } catch {
      // fallback
    } finally {
      setDeletingPropertyId(null);
    }
  };

  if (!user) {
    return (
      <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="empty-state">
          <ShieldCheck size={40} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
          <h3>Access Restricted</h3>
          <p>Please sign in to view your profile.</p>
          <Link to="/login" className="btn btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  const initials = user.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'PC';

  const memberDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'July 2025';

  const quotaPercent = quota?.maxActiveListings
    ? Math.min(100, Math.round((quota.activeListings / quota.maxActiveListings) * 100))
    : 0;
  const deletingProperty = deletingPropertyId
    ? myListings.find((p) => p._id === deletingPropertyId)
    : null;

  return (
    <div className="profile-wrap page-enter">
      {/* Header Container */}
      <div className="profile-header-container">
        <div className="profile-cover" aria-hidden="true" />

        <div className="profile-avatar-col">
          <div className="profile-avatar-wrap">
            {user?.profileImage && typeof user.profileImage === 'string' && user.profileImage.trim() ? (
              <img src={user.profileImage.trim()} alt={user.name || 'User'} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-fallback">{initials}</div>
            )}

            {avatarUploading && (
              <div className="profile-avatar-loading">
                <Loader2 size={22} strokeWidth={2.5} className="spin" />
              </div>
            )}
            <button
              type="button"
              className="profile-avatar-camera"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile photo"
              disabled={avatarUploading}
            >
              <Camera size={16} strokeWidth={2.5} />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarSelect}
              hidden
            />
          </div>
        </div>

        <div className="profile-header-content">
          <div className="profile-title-row">
            <h1 className="profile-username">{user.name}</h1>
            <span className="badge badge-light" style={{ textTransform: 'capitalize' }}>
              {user.role}
            </span>
            {user.role === 'agent' && (
              <Link to="/subscription" className="badge badge-accent" style={{ textDecoration: 'none' }}>
                <Zap size={13} strokeWidth={2.5} /> {user.subscription?.effectivePlan || quota?.plan || 'Free'} Plan
              </Link>
            )}

            <button className="btn btn-outline btn-sm profile-edit-btn" onClick={handleOpenEditProfile}>
              <Settings size={16} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" /> Edit Profile
            </button>

            {/* Mobile-only logout button — desktop uses navbar */}
            <button
              className="btn btn-outline btn-sm profile-mobile-logout"
              onClick={async () => { await logout(); navigate('/'); }}
            >
              <LogOut size={15} strokeWidth={2.3} /> Logout
            </button>
          </div>

          <div className="profile-stats-inline">
            {user.role === 'agent' && (
              <div className="profile-stat-card">
                <span className="profile-stat-count">{myListings.length}</span>
                <span className="profile-stat-label">Listings</span>
              </div>
            )}
            <div className="profile-stat-card">
              <span className="profile-stat-count">{favourites.length}</span>
              <span className="profile-stat-label">Saved</span>
            </div>
            {user.role === 'agent' && (
              <div className="profile-stat-card">
                <span className="profile-stat-count">{inquiriesCount}</span>
                <span className="profile-stat-label">Inquiries</span>
              </div>
            )}
          </div>

          <div className="profile-meta-row">
            <span><MapPin size={15} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" /> Accra, Ghana</span>
            {user.phone && <span><Phone size={15} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" /> {user.phone}</span>}
            <span><Calendar size={15} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" /> Joined {memberDate}</span>
          </div>

          {user.role === 'agent' && quota && (
            <div className="quota-bar-wrap">
              <div className="quota-bar-labels">
                <span>Active listings</span>
                <span>{quota.activeListings} of {quota.maxActiveListings} used &middot; {quota.plan} plan</span>
              </div>
              <div className="quota-bar-track">
                <div
                  className={`quota-bar-fill ${quotaPercent >= 100 ? 'quota-bar-fill--full' : ''}`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="profile-tab-bar">
        {user.role === 'agent' && (
          <button
            className={`profile-tab-item${activeTab === 'listings' ? ' active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <LayoutGrid size={18} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" /> My Listings
          </button>
        )}

        <button
          className={`profile-tab-item${activeTab === 'saved' ? ' active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark size={18} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" /> Saved Properties
        </button>
      </div>

      {/* Grid Container */}
      <div className="profile-grid-container">
        {activeTab === 'listings' && user.role === 'agent' && (
          <div>
            <div className="section-header-row">
              <div>
                <h2>Manage Listings</h2>
                {quota && (
                  <p className="section-subtext">
                    {quota.activeListings} of {quota.maxActiveListings} active listings used ({quota.plan} plan)
                  </p>
                )}
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleOpenCreateProperty}>
                <Plus size={16} strokeWidth={2.5} /> Add Property
              </button>
            </div>

            {loadingListings ? (
              <div className="grid-2">
                {[0, 1].map((i) => (
                  <div key={i} className="my-prop-grid-card skeleton-card">
                    <div className="my-prop-img-zone skeleton-block" />
                    <div className="my-prop-content">
                      <div className="skeleton-line skeleton-line--title" />
                      <div className="skeleton-line skeleton-line--price" />
                    </div>
                  </div>
                ))}
              </div>
            ) : myListings.length === 0 ? (
              <div className="empty-state">
                <Home size={40} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                <h3>No listings yet</h3>
                <p>Add your first property so buyers can start finding you.</p>
                <button className="btn btn-primary" onClick={handleOpenCreateProperty}>
                  <Plus size={16} strokeWidth={2.5} /> Add Property
                </button>
              </div>
            ) : (
              <div className="grid-2">
                {myListings.map((prop) => (
                  <div key={prop._id} className="my-prop-grid-card">
                    <div className="my-prop-img-zone">
                      <img src={(prop.images && prop.images.find(img => img && typeof img === 'string' && img.trim())) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500'} alt={prop.title} className="my-prop-img" />
                      <span className={`badge badge-${prop.status === 'available' ? 'success' : 'warning'}`} style={{ position: 'absolute', top: 10, left: 10 }}>
                        {prop.status}
                      </span>
                      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                        <Link
                          to={`/listings/${prop._id}`}
                          className="icon-btn-standalone"
                          aria-label="View property details"
                          title="View Details"
                        >
                          <Eye size={18} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                        </Link>
                      </div>
                    </div>

                    <div className="my-prop-content">
                      <Link to={`/listings/${prop._id}`} style={{ textDecoration: 'none' }}>
                        <h3 className="my-prop-title">{prop.title}</h3>
                      </Link>
                      <p className="my-prop-price">{formatMoney(prop.price)}</p>

                      <div className="my-prop-footer">
                        <select
                          className="input status-select"
                          value={prop.status || 'available'}
                          onChange={(e) => handleStatusChange(prop._id, e.target.value)}
                        >
                          <option value="available">Available</option>
                          <option value="pending">Pending</option>
                          <option value="sold">Sold</option>
                          <option value="rented">Rented</option>
                        </select>

                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEditProperty(prop)} aria-label="Edit property" title="Edit property">
                            <Edit2 size={16} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeletingPropertyId(prop._id)} aria-label="Delete property" title="Delete property">
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            <div className="section-header-row">
              <h2>Saved Properties</h2>
            </div>

            {favourites.length === 0 ? (
              <div className="empty-state">
                <Bookmark size={40} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                <h3>Nothing saved yet</h3>
                <p>Tap the bookmark icon on any listing to keep track of it here.</p>
                <Link to="/listings" className="btn btn-primary">Browse Listings</Link>
              </div>
            ) : (
              <div className="grid-2">
                {favourites.map((fav) => (
                  <div key={fav._id} className="my-prop-grid-card">
                    <div className="my-prop-img-zone">
                      <img src={(fav.images && fav.images.find(img => img && typeof img === 'string' && img.trim())) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500'} alt={fav.title} className="my-prop-img" />
                      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                        <Link
                          to={`/listings/${fav._id}`}
                          className="icon-btn-standalone"
                          aria-label="View property details"
                          title="View Details"
                        >
                          <Eye size={18} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                        </Link>
                        <button
                          type="button"
                          className="icon-btn-standalone icon-btn-standalone--danger"
                          onClick={() => toggleFavourite(fav)}
                          aria-label="Remove from saved"
                          title="Remove from Saved"
                        >
                          <Trash2 size={18} strokeWidth={2.5} color="var(--color-error)" />
                        </button>
                      </div>
                    </div>
                    <div className="my-prop-content">
                      <Link to={`/listings/${fav._id}`} style={{ textDecoration: 'none' }}>
                        <h3 className="my-prop-title">{fav.title}</h3>
                      </Link>
                      <p className="my-prop-price">{formatMoney(fav.price)}</p>

                      <div className="my-prop-footer">
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #475569)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={15} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                          {fav.city}{fav.region ? `, ${fav.region}` : ''}
                        </span>
                        <Link to={`/listings/${fav._id}`} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          View Details <ArrowRight size={15} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile modal */}
      {showEditModal && (
        <Modal title="Edit Profile" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleSaveProfile} className="modal-form">
            <div className="avatar-edit-row">
              <div className="profile-avatar-wrap profile-avatar-wrap--sm">
                {user?.profileImage && typeof user.profileImage === 'string' && user.profileImage.trim() ? (
                  <img src={user.profileImage.trim()} alt={user.name || 'User'} className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-fallback">{initials}</div>
                )}

              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}>
                {avatarUploading ? <Loader2 size={16} strokeWidth={2.5} className="spin" /> : <Upload size={16} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />}
                {avatarUploading ? 'Uploading…' : 'Change photo'}
              </button>
            </div>

            <label className="form-label">Full name</label>
            <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your full name" />

            <label className="form-label">Phone number</label>
            <input className="input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="e.g. 024 000 0000" />

            {profileError && <p className="form-message form-message--error"><AlertCircle size={15} strokeWidth={2.5} /> {profileError}</p>}
            {profileSuccess && <p className="form-message form-message--success"><CheckCircle2 size={15} strokeWidth={2.5} /> {profileSuccess}</p>}

            <div className="modal-footer modal-footer--form">
              <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                {profileSaving ? <Loader2 size={16} strokeWidth={2.5} className="spin" /> : null}
                {profileSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Property modal */}
      {showPropertyModal && (
        <Modal
          title={editingProperty ? 'Edit Property' : 'Add Property'}
          onClose={() => setShowPropertyModal(false)}
          width={640}
        >
          <form onSubmit={handleSaveProperty} className="modal-form">
            <label className="form-label">Title</label>
            <input className="input" value={propTitle} onChange={(e) => setPropTitle(e.target.value)} placeholder="e.g. 3-Bedroom Townhouse in East Legon" />

            <div className="form-row">
              <div>
                <label className="form-label">Price (GH₵)</label>
                <input className="input" type="number" min="0" value={propPrice} onChange={(e) => setPropPrice(e.target.value)} placeholder="e.g. 450000" />
              </div>
              <div>
                <label className="form-label">Listing type</label>
                <select className="input" value={propListType} onChange={(e) => setPropListType(e.target.value)}>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
            </div>

            <label className="form-label">Description</label>
            <textarea className="input textarea" rows={3} value={propDesc} onChange={(e) => setPropDesc(e.target.value)} placeholder="Describe the property, finishes, and what makes it stand out" />

            <div className="form-row">
              <div>
                <label className="form-label">City</label>
                <input className="input" value={propCity} onChange={(e) => setPropCity(e.target.value)} placeholder="e.g. Accra" />
              </div>
              <div>
                <label className="form-label">Region</label>
                <input className="input" value={propRegion} onChange={(e) => setPropRegion(e.target.value)} placeholder="e.g. Greater Accra" />
              </div>
            </div>

            <label className="form-label">Address</label>
            <input className="input" value={propAddress} onChange={(e) => setPropAddress(e.target.value)} placeholder="Street / landmark" />

            <div className="form-row form-row--four">
              <div>
                <label className="form-label">Type</label>
                <select className="input" value={propType} onChange={(e) => setPropType(e.target.value)}>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Beds</label>
                <input className="input" type="number" min="0" value={propBeds} onChange={(e) => setPropBeds(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Baths</label>
                <input className="input" type="number" min="0" value={propBaths} onChange={(e) => setPropBaths(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Area (m&sup2;)</label>
                <input className="input" type="number" min="0" value={propArea} onChange={(e) => setPropArea(e.target.value)} />
              </div>
            </div>

            <label className="form-label">Photos</label>
            <div className="image-manager-grid">
              {existingImages.filter(img => img && typeof img === 'string' && img.trim()).map((img) => (
                <div key={img} className="image-thumb">
                  <img src={img} alt="Property" />
                  <button type="button" className="image-thumb-remove" onClick={() => handleDeleteExistingImage(img)} aria-label="Remove photo">
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              ))}


              {propertyImageFiles.map((file, i) => (
                <div key={`${file.name}-${i}`} className="image-thumb image-thumb--pending">
                  <img src={URL.createObjectURL(file)} alt="New upload" />
                  <span className="image-thumb-pending-label">New</span>
                  <button type="button" className="image-thumb-remove" onClick={() => handleRemoveQueuedImage(i)} aria-label="Remove photo">
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              ))}

              <button type="button" className="image-add-tile" onClick={() => imageUploadRef.current?.click()}>
                <ImagePlus size={20} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                <span>Add photos</span>
              </button>
              <input type="file" accept="image/*" multiple ref={imageUploadRef} onChange={handlePropertyImageSelect} hidden />
            </div>

            {propError && <p className="form-message form-message--error"><AlertCircle size={15} strokeWidth={2.5} /> {propError}</p>}

            <div className="modal-footer modal-footer--form">
              <button type="button" className="btn btn-outline" onClick={() => setShowPropertyModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={propSaving}>
                {propSaving ? <Loader2 size={16} strokeWidth={2.5} className="spin" /> : null}
                {propSaving ? 'Saving…' : editingProperty ? 'Save changes' : 'Publish listing'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deletingPropertyId && (
        <Modal title="Delete this property?" onClose={() => setDeletingPropertyId(null)} width={420}>
          <p className="confirm-copy">
            {deletingProperty ? `"${deletingProperty.title}" will be removed` : 'This property will be removed'} from your listings and taken off search results. This can&rsquo;t be undone.
          </p>
          <div className="modal-footer modal-footer--form">
            <button type="button" className="btn btn-outline" onClick={() => setDeletingPropertyId(null)}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={handleDeleteProperty}>
              <Trash2 size={16} strokeWidth={2.5} /> Delete property
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
