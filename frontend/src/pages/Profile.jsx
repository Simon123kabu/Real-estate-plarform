import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, Settings, Share2, LayoutGrid, Bookmark, Plus, Edit2, Trash2,
  MapPin, Phone, Calendar, X, AlertCircle, ShieldCheck, Zap, Upload, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavourites } from '../context/FavouritesContext';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL;
const formatMoney = (num) => 'GH₵ ' + Number(num).toLocaleString('en-GH');

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { favourites, removeFavourite } = useFavourites();
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

  // Fetch Agent's Own Listings using backend endpoint /api/properties/my-listings
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
      if (res.ok && data.success && data.data?.notifications) {
        setInquiriesCount(data.data.notifications.length || 0);
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

    // Fetch full details (description + address) from GET /api/properties/:id
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

  // Delete existing property photo
  const handleDeleteExistingImage = async (imgUrl) => {
    if (!editingProperty?._id) return;
    const filename = imgUrl.split('/').pop();
    try {
      const res = await fetch(`${API_BASE}/properties/${editingProperty._id}/images/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setExistingImages((prev) => prev.filter((img) => img !== imgUrl));
        fetchMyListings();
      } else {
        // Fallback filtering if backend soft deletes
        setExistingImages((prev) => prev.filter((img) => img !== imgUrl));
      }
    } catch {
      setExistingImages((prev) => prev.filter((img) => img !== imgUrl));
    }
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

        // If new image files were selected, upload them
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
          <ShieldCheck size={40} />
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

  return (
    <div className="profile-wrap page-enter">
      {/* ── Seamless Header Container ── */}
      <div className="profile-header-container">
        {/* Avatar Left */}
        <div className="profile-avatar-col">
          <div className="profile-avatar-wrap" style={{ cursor: 'default' }}>
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-fallback">{initials}</div>
            )}
          </div>
        </div>

        {/* Header Details Right */}
        <div className="profile-header-content">
          {/* Row 1: Username/Name + Roles + Actions */}
          <div className="profile-title-row">
            <h1 className="profile-username">{user.name}</h1>
            <span className="badge badge-light" style={{ textTransform: 'capitalize' }}>
              {user.role}
            </span>
            {user.role === 'agent' && (
              <Link
                to="/subscription"
                className="badge badge-accent"
                style={{ textDecoration: 'none', textTransform: 'capitalize' }}
                title="Manage Subscription Plan"
              >
                <Zap size={11} /> {user.subscription?.effectivePlan || quota?.plan || 'Free'} Plan
              </Link>
            )}

            <button className="btn btn-outline btn-sm" onClick={() => setShowEditModal(true)}>
              <Settings size={14} /> Edit Profile
            </button>
          </div>

          {/* Row 2: Stats (Listings · Saved · Inquiries) */}
          <div className="profile-stats-inline">
            {user.role === 'agent' && (
              <div>
                <span className="profile-stat-count">{myListings.length}</span>
                <span className="profile-stat-label">Listings</span>
              </div>
            )}
            <div>
              <span className="profile-stat-count">{favourites.length}</span>
              <span className="profile-stat-label">Saved</span>
            </div>
            {user.role === 'agent' && (
              <div>
                <span className="profile-stat-count">{inquiriesCount}</span>
                <span className="profile-stat-label">Inquiries</span>
              </div>
            )}
          </div>

          {/* Row 3: Meta Information */}
          <div className="profile-meta-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} /> Accra, Ghana
            </span>
            {user.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={13} /> {user.phone}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} /> Joined {memberDate}
            </span>
          </div>
        </div>
      </div>

      {/* ── Top Border Divider Tab Bar ── */}
      <div className="profile-tab-bar">
        {user.role === 'agent' && (
          <button
            className={`profile-tab-item${activeTab === 'listings' ? ' active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <LayoutGrid size={15} /> My Listings
          </button>
        )}

        <button
          className={`profile-tab-item${activeTab === 'saved' ? ' active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark size={15} /> Saved Properties
        </button>
      </div>

      {/* ── Fixed Grid Container ── */}
      <div className="profile-grid-container">
        {/* TAB A: Agent Listings */}
        {activeTab === 'listings' && user.role === 'agent' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  Manage Listings
                </h2>
                {quota && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Quota: {quota.activeListings} of {quota.maxActiveListings} active listings used ({quota.plan} plan)
                  </p>
                )}
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleOpenCreateProperty}>
                <Plus size={15} /> Add Property
              </button>
            </div>

            {loadingListings ? (
              <div className="grid-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="my-prop-grid-card">
                    <div className="skeleton" style={{ height: 200 }} />
                    <div style={{ padding: '16px' }}>
                      <div className="skeleton skeleton-line" style={{ width: '65%', height: 16, marginBottom: 8 }} />
                      <div className="skeleton skeleton-line" style={{ width: '40%', height: 16 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid-3">
                {myListings.map((prop) => (
                  <div key={prop._id} className="my-prop-grid-card">
                    <div className="my-prop-img-zone">
                      <img
                        src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500'}
                        alt={prop.title}
                        className="my-prop-img"
                      />
                      <span
                        className={`badge badge-${prop.status === 'available' ? 'success' : prop.status === 'pending' ? 'warning' : 'error'}`}
                        style={{ position: 'absolute', top: 10, left: 10 }}
                      >
                        {prop.status}
                      </span>
                    </div>

                    <div className="my-prop-content">
                      <h3 className="my-prop-title">{prop.title}</h3>
                      <p className="my-prop-price">{formatMoney(prop.price)}</p>

                      <div className="my-prop-footer">
                        <select
                          className="input"
                          value={prop.status || 'available'}
                          onChange={(e) => handleStatusChange(prop._id, e.target.value)}
                          style={{ padding: '3px 6px', fontSize: 'var(--text-xs)', width: 'auto' }}
                        >
                          <option value="available">Available</option>
                          <option value="pending">Pending</option>
                          <option value="sold">Sold</option>
                          <option value="rented">Rented</option>
                        </select>

                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenEditProperty(prop)}
                            title="Edit property"
                            style={{ padding: '4px 8px' }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeletingPropertyId(prop._id)}
                            title="Delete property"
                            style={{ padding: '4px 8px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {myListings.length === 0 && !loadingListings && (
              <div className="empty-state">
                <LayoutGrid size={40} />
                <h3>No properties listed yet</h3>
                <p>Click "+ Add Property" to create your first listing.</p>
                <button className="btn btn-primary" onClick={handleOpenCreateProperty}>
                  <Plus size={16} /> Add Property
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB B: Saved Properties */}
        {activeTab === 'saved' && (
          <div>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                Saved Properties
              </h2>
            </div>

            <div className="grid-3">
              {favourites.map((fav) => (
                <div key={fav._id} className="my-prop-grid-card">
                  <div className="my-prop-img-zone">
                    <img
                      src={fav.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500'}
                      alt={fav.title}
                      className="my-prop-img"
                    />
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ position: 'absolute', top: 10, right: 10, borderRadius: '50%', width: 30, height: 30, padding: 0, justifyContent: 'center' }}
                      onClick={() => removeFavourite(fav._id)}
                      title="Remove from saved"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="my-prop-content">
                    <Link to={`/listings/${fav._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 className="my-prop-title">{fav.title}</h3>
                    </Link>
                    <p className="my-prop-price">{formatMoney(fav.price)}</p>
                  </div>
                </div>
              ))}
            </div>

            {favourites.length === 0 && (
              <div className="empty-state">
                <Bookmark size={40} />
                <h3>No saved properties</h3>
                <p>Browse listings and click the bookmark icon on any property to save it here.</p>
                <Link to="/listings" className="btn btn-primary">Browse Listings</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal 1: Edit Profile (Includes Profile Picture Upload) ── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>Edit Profile</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowEditModal(false)}>
                  <X size={16} />
                </button>
              </div>

              {/* Profile Photo Upload Row inside Modal */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  background: 'var(--color-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--color-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                      {initials}
                    </div>
                  )}
                </div>

                <div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    Profile Photo
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    <Camera size={13} /> {avatarUploading ? 'Uploading…' : 'Change Profile Picture'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <input className="input" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>

                <div>
                  <label className="label">Email (Read-only)</label>
                  <input className="input" type="email" value={user.email} disabled />
                </div>

                {profileError && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{profileError}</p>}
                {profileSuccess && <p style={{ color: 'var(--color-success)', fontSize: 'var(--text-sm)' }}>{profileSuccess}</p>}

                <button className="btn btn-primary" type="submit" disabled={profileSaving} style={{ width: '100%', justifyContent: 'center' }}>
                  {profileSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Create / Edit Property Form ── */}
      {showPropertyModal && (
        <div className="modal-overlay" onClick={() => setShowPropertyModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 'var(--space-xl)' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>
                  {editingProperty ? `Edit property: ${editingProperty.title}` : 'New property'}
                </h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPropertyModal(false)} style={{ padding: 6 }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProperty} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {/* 1. Existing Saved Photos Section (If editing) */}
                {editingProperty && existingImages.length > 0 && (
                  <div>
                    <label className="label">Currently Saved Property Photos ({existingImages.length})</label>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                        gap: 10,
                        padding: 'var(--space-sm)',
                        background: 'var(--color-surface-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {existingImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: 80,
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={`Saved photo ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingImage(imgUrl)}
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'var(--color-error)',
                              color: '#ffffff',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: 'var(--shadow-sm)',
                            }}
                            title="Delete this saved photo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Drag & Drop Upload Zone for NEW Photos */}
                <div>
                  <label className="label">
                    {editingProperty ? 'Add More Property Photos' : 'Property Photos'}
                  </label>
                  <div
                    onClick={() => imageUploadRef.current?.click()}
                    style={{
                      border: '2px dashed var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-lg)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--color-surface-elevated)',
                      transition: 'border-color var(--transition-fast)',
                    }}
                  >
                    {propertyImageFiles.length === 0 ? (
                      <>
                        <Upload size={28} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          Drag photos here or click to upload (JPEG, PNG, WebP)
                        </p>
                      </>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-primary)' }}>
                            ✓ {propertyImageFiles.length} new photo(s) selected
                          </span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                            + Click to add more
                          </span>
                        </div>

                        {/* Thumbnail Preview Grid for NEW files */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                            gap: 10,
                            marginTop: 10,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {propertyImageFiles.map((file, idx) => (
                            <div
                              key={idx}
                              style={{
                                position: 'relative',
                                width: '100%',
                                height: 80,
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`New upload preview ${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPropertyImageFiles((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                style={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  background: 'rgba(0, 0, 0, 0.75)',
                                  color: '#ffffff',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                                title="Remove photo"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={imageUploadRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files);
                      setPropertyImageFiles((prev) => [...prev, ...newFiles]);
                    }}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* 3. Title */}
                <div>
                  <label className="label">Property Title</label>
                  <input className="input" type="text" placeholder="e.g. Modern 3-Bedroom Villa with Swimming Pool" value={propTitle} onChange={(e) => setPropTitle(e.target.value)} />
                </div>

                {/* 4. Description */}
                <div>
                  <label className="label">Description</label>
                  <textarea className="input" rows={3} placeholder="Describe key features, amenities, finishing, compound size, security, and nearby landmarks..." value={propDesc} onChange={(e) => setPropDesc(e.target.value)} style={{ resize: 'vertical' }} />
                </div>

                {/* 5. Address */}
                <div>
                  <label className="label">Street Address</label>
                  <input className="input" type="text" placeholder="e.g. 14 Admiralty Way, East Legon" value={propAddress} onChange={(e) => setPropAddress(e.target.value)} />
                </div>

                {/* 6. City & Region (2 cols) */}
                <div className="grid-2">
                  <div>
                    <label className="label">City</label>
                    <input className="input" type="text" placeholder="e.g. Accra" value={propCity} onChange={(e) => setPropCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Region</label>
                    <input className="input" type="text" placeholder="e.g. Greater Accra" value={propRegion} onChange={(e) => setPropRegion(e.target.value)} />
                  </div>
                </div>

                {/* 7. Price, Bedrooms, Bathrooms (3 cols) */}
                <div className="grid-3">
                  <div>
                    <label className="label">Price (GH₵)</label>
                    <input className="input" type="number" placeholder="e.g. 250000" value={propPrice} onChange={(e) => setPropPrice(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Bedrooms</label>
                    <input className="input" type="number" placeholder="e.g. 3" value={propBeds} onChange={(e) => setPropBeds(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Bathrooms</label>
                    <input className="input" type="number" placeholder="e.g. 2" value={propBaths} onChange={(e) => setPropBaths(e.target.value)} />
                  </div>
                </div>

                {/* 8. Area & Listing Type (2 cols) */}
                <div className="grid-2">
                  <div>
                    <label className="label">Area (m²)</label>
                    <input className="input" type="number" placeholder="e.g. 180" value={propArea} onChange={(e) => setPropArea(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Listing Type</label>
                    <select className="input" value={propListType} onChange={(e) => setPropListType(e.target.value)}>
                      <option value="sale">For Sale</option>
                      <option value="rent">For Rent</option>
                    </select>
                  </div>
                </div>

                {/* 9. Property Type (Full width) */}
                <div>
                  <label className="label">Property Category</label>
                  <select className="input" value={propType} onChange={(e) => setPropType(e.target.value)}>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                {/* Error Banner */}
                {propError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-error)', fontSize: 'var(--text-sm)', background: 'var(--color-error-light)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                    <AlertCircle size={15} /> {propError}
                  </div>
                )}

                {/* 10. Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowPropertyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={propSaving}>
                    {propSaving ? 'Saving…' : editingProperty ? 'Update property' : 'Save property'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Delete Confirmation ── */}
      {deletingPropertyId && (
        <div className="modal-overlay" onClick={() => setDeletingPropertyId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
              <AlertCircle size={40} style={{ color: 'var(--color-error)', marginBottom: 'var(--space-md)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
                Delete Listing?
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                Are you sure you want to delete this property? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeletingPropertyId(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDeleteProperty}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
