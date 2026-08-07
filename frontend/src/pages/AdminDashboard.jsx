import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, User, Home, LayoutGrid, ChevronLeft, ChevronRight,
  Trash2, ShieldCheck, ShieldAlert, Loader2, Building2, ExternalLink,
  UserPlus, ArrowRight
} from 'lucide-react';
import Modal from '../components/Modal';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL;
const ROLE_OPTIONS = ['buyer', 'agent', 'admin'];
const STATUS_OPTIONS = ['available', 'pending', 'sold', 'rented'];
const USERS_PER_PAGE = 20;
const LISTINGS_PER_PAGE = 20;

const formatMoney = (num) => 'GH₵ ' + Number(num).toLocaleString('en-GH');

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');

  // Overview Stats & Recent Activity
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Listings State
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsTotalPages, setListingsTotalPages] = useState(1);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingPropertyId, setDeletingPropertyId] = useState(null);

  // Inline row action loading tracking
  const [rowActionId, setRowActionId] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  useEffect(() => {
    if (tab === 'users') fetchUsers(usersPage, roleFilter);
  }, [tab, usersPage, roleFilter]);

  useEffect(() => {
    if (tab === 'listings') fetchListings(listingsPage, statusFilter);
  }, [tab, listingsPage, statusFilter]);

  // Fetch KPI Stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) setStats(data.data);
    } catch {
      // fallback
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Recent Activity (latest 5 users & latest 5 properties)
  const fetchRecentActivity = async () => {
    setRecentLoading(true);
    try {
      const [usersRes, listingsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/users?page=1&limit=5`, { credentials: 'include' }),
        fetch(`${API_BASE}/admin/properties?page=1&limit=5`, { credentials: 'include' }),
      ]);
      const usersData = await usersRes.json();
      const listingsData = await listingsRes.json();

      if (usersRes.ok && usersData.success) {
        const uList = Array.isArray(usersData.data) ? usersData.data : (usersData.data?.users || []);
        setRecentUsers(uList.slice(0, 5));
      }
      if (listingsRes.ok && listingsData.success) {
        const lList = Array.isArray(listingsData.data) ? listingsData.data : (listingsData.data?.properties || []);
        setRecentListings(lList.slice(0, 5));
      }
    } catch {
      // fallback
    } finally {
      setRecentLoading(false);
    }
  };

  // Fetch Users List
  const fetchUsers = async (page = 1, role = '') => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: USERS_PER_PAGE });
      if (role) params.set('role', role);
      const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(Array.isArray(data.data) ? data.data : (data.data?.users || []));
        setUsersTotal(data.total ?? data.data?.total ?? 0);
        setUsersTotalPages(data.totalPages ?? data.data?.totalPages ?? 1);
      }
    } catch {
      // fallback
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Admin Listings
  const fetchListings = async (page = 1, status = '') => {
    setListingsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LISTINGS_PER_PAGE });
      if (status) params.set('status', status);
      const res = await fetch(`${API_BASE}/admin/properties?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setListings(Array.isArray(data.data) ? data.data : (data.data?.properties || []));
        setListingsTotal(data.total ?? data.data?.total ?? 0);
        setListingsTotalPages(data.totalPages ?? data.data?.totalPages ?? 1);
      }
    } catch {
      // fallback
    } finally {
      setListingsLoading(false);
    }
  };

  // User Actions
  const handleChangeRole = async (userId, role) => {
    setRowActionId(userId);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        fetchUsers(usersPage, roleFilter);
        fetchRecentActivity();
      }
    } catch {
      // fallback
    } finally {
      setRowActionId(null);
    }
  };

  const handleApproveAgent = async (userId) => {
    setRowActionId(userId);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/approve`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (res.ok) {
        fetchUsers(usersPage, roleFilter);
        fetchRecentActivity();
      }
    } catch {
      // fallback
    } finally {
      setRowActionId(null);
    }
  };

  const handleRejectAgent = async (userId) => {
    setRowActionId(userId);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/reject`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (res.ok) {
        fetchUsers(usersPage, roleFilter);
        fetchRecentActivity();
      }
    } catch {
      // fallback
    } finally {
      setRowActionId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;
    setRowActionId(deletingUserId);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${deletingUserId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== deletingUserId));
        setUsersTotal((prev) => Math.max(0, prev - 1));
        fetchRecentActivity();
        fetchStats();
      }
    } catch {
      // fallback
    } finally {
      setRowActionId(null);
      setDeletingUserId(null);
    }
  };

  // Listing Actions
  const handleAdminPropertyStatusChange = async (propertyId, status) => {
    setRowActionId(propertyId);
    try {
      const res = await fetch(`${API_BASE}/admin/properties/${propertyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchListings(listingsPage, statusFilter);
        fetchRecentActivity();
      }
    } catch {
      // fallback
    } finally {
      setRowActionId(null);
    }
  };

  const handleDeleteListing = async () => {
    if (!deletingPropertyId) return;
    setRowActionId(deletingPropertyId);
    try {
      const res = await fetch(`${API_BASE}/admin/properties/${deletingPropertyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setListings((prev) => prev.filter((p) => p._id !== deletingPropertyId));
        setListingsTotal((prev) => Math.max(0, prev - 1));
        fetchRecentActivity();
        fetchStats();
      }
    } catch {
      // fallback
    } finally {
      setRowActionId(null);
      setDeletingPropertyId(null);
    }
  };

  const deletingUser = deletingUserId ? users.find((u) => u._id === deletingUserId) : null;
  const deletingProperty = deletingPropertyId ? listings.find((p) => p._id === deletingPropertyId) : null;

  const STAT_CARDS = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users },
    { label: 'Agents', value: stats.totalAgents, icon: UserCheck },
    { label: 'Buyers', value: stats.totalBuyers, icon: User },
    { label: 'Total Listings', value: stats.totalListings, icon: Building2 },
  ] : [];

  return (
    <div className="admin-wrap page-enter">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="section-subtext">Users, listings, and platform health in one place.</p>
      </div>

      <div className="admin-tab-bar">
        <button className={`admin-tab-item${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>
          <LayoutGrid size={18} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" /> Overview
        </button>
        <button className={`admin-tab-item${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
          <Users size={18} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" /> Users ({usersTotal})
        </button>
        <button className={`admin-tab-item${tab === 'listings' ? ' active' : ''}`} onClick={() => setTab('listings')}>
          <Home size={18} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" /> Listings ({listingsTotal})
        </button>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI Metric Cards */}
          <div className="admin-stats-grid">
            {statsLoading ? (
              [0, 1, 2, 3].map((i) => <div key={i} className="admin-stat-card skeleton-block" style={{ height: 100 }} />)
            ) : (
              STAT_CARDS.map(({ label, value, icon: Icon }) => (
                <div key={label} className="admin-stat-card">
                  <div className="admin-stat-icon">
                    <Icon size={26} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                  </div>
                  <span className="admin-stat-value">{value ?? 0}</span>
                  <span className="admin-stat-label">{label}</span>
                </div>
              ))
            )}
          </div>

          {/* Recent Activity Section */}
          <div className="admin-overview-grid">
            {/* Recent Users Card */}
            <div className="admin-recent-card">
              <div className="admin-recent-header">
                <div className="admin-recent-title">
                  <UserPlus size={20} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                  <h3>New Users</h3>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab('users')}>
                  View all <ArrowRight size={14} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                </button>
              </div>

              <div className="admin-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLoading ? (
                      <tr><td colSpan={3} className="admin-table-loading"><Loader2 size={18} strokeWidth={2.5} className="spin" /></td></tr>
                    ) : recentUsers.length === 0 ? (
                      <tr><td colSpan={3} className="admin-table-empty">No recent users found.</td></tr>
                    ) : (
                      recentUsers.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div className="admin-table-muted" style={{ fontSize: '0.75rem' }}>{u.email}</div>
                          </td>
                          <td>
                            <span className="badge badge-light" style={{ textTransform: 'capitalize' }}>
                              {u.role}
                            </span>
                          </td>
                          <td className="admin-table-muted" style={{ fontSize: '0.8rem' }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Listings Card */}
            <div className="admin-recent-card">
              <div className="admin-recent-header">
                <div className="admin-recent-title">
                  <Building2 size={20} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                  <h3>Recent Listings</h3>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab('listings')}>
                  View all <ArrowRight size={14} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                </button>
              </div>

              <div className="admin-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLoading ? (
                      <tr><td colSpan={3} className="admin-table-loading"><Loader2 size={18} strokeWidth={2.5} className="spin" /></td></tr>
                    ) : recentListings.length === 0 ? (
                      <tr><td colSpan={3} className="admin-table-empty">No recent listings found.</td></tr>
                    ) : (
                      recentListings.map((prop) => (
                        <tr key={prop._id}>
                          <td>
                            <Link to={`/listings/${prop._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                                {prop.title}
                              </div>
                            </Link>
                            <div className="admin-table-muted" style={{ fontSize: '0.75rem' }}>
                              {prop.city}{prop.region ? `, ${prop.region}` : ''}
                            </div>
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            {formatMoney(prop.price)}
                          </td>
                          <td>
                            <span className={`badge badge-${prop.status === 'available' ? 'success' : 'warning'}`} style={{ textTransform: 'capitalize' }}>
                              {prop.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div className="section-header-row">
            <p className="section-subtext">{usersTotal} user{usersTotal === 1 ? '' : 's'} total</p>
            <select
              className="input"
              style={{ width: 'auto' }}
              value={roleFilter}
              onChange={(e) => { setUsersPage(1); setRoleFilter(e.target.value); }}
            >
              <option value="">All roles</option>
              <option value="buyer">Buyers</option>
              <option value="agent">Agents</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Agent Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr><td colSpan={5} className="admin-table-loading"><Loader2 size={18} strokeWidth={2.5} className="spin" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="admin-table-empty">No users match this filter.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td className="admin-table-muted">{u.email}</td>
                      <td>
                        <select
                          className="input status-select"
                          value={u.role}
                          disabled={rowActionId === u._id}
                          onChange={(e) => handleChangeRole(u._id, e.target.value)}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {u.role === 'agent' ? (
                          <span className={`badge badge-${u.agentStatus === 'approved' ? 'success' : u.agentStatus === 'rejected' ? 'danger' : 'warning'}`}>
                            {u.agentStatus || 'pending'}
                          </span>
                        ) : (
                          <span className="admin-table-muted">&mdash;</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {u.role === 'agent' && u.agentStatus !== 'approved' && (
                            <button
                              className="btn btn-outline btn-sm"
                              disabled={rowActionId === u._id}
                              onClick={() => handleApproveAgent(u._id)}
                              title="Approve Agent"
                            >
                              <ShieldCheck size={16} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" /> Approve
                            </button>
                          )}
                          {u.role === 'agent' && u.agentStatus === 'approved' && (
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ color: 'var(--color-error)' }}
                              disabled={rowActionId === u._id}
                              onClick={() => handleRejectAgent(u._id)}
                              title="Block Agent"
                            >
                              <ShieldAlert size={16} strokeWidth={2.5} color="var(--color-error)" /> Block
                            </button>
                          )}
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={rowActionId === u._id}
                            onClick={() => setDeletingUserId(u._id)}
                            aria-label="Delete user"
                            title="Delete User"
                          >
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {usersTotalPages > 1 && (
            <div className="admin-pagination">
              <button className="btn btn-outline btn-sm" disabled={usersPage <= 1} onClick={() => setUsersPage((p) => p - 1)}>
                <ChevronLeft size={16} strokeWidth={2.5} /> Prev
              </button>
              <span className="section-subtext">Page {usersPage} of {usersTotalPages}</span>
              <button className="btn btn-outline btn-sm" disabled={usersPage >= usersTotalPages} onClick={() => setUsersPage((p) => p + 1)}>
                Next <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Listings Tab */}
      {tab === 'listings' && (
        <div>
          <div className="section-header-row">
            <p className="section-subtext">{listingsTotal} listing{listingsTotal === 1 ? '' : 's'} total</p>
            <select
              className="input"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => { setListingsPage(1); setStatusFilter(e.target.value); }}
            >
              <option value="">All statuses</option>
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Agent</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listingsLoading ? (
                  <tr><td colSpan={6} className="admin-table-loading"><Loader2 size={18} strokeWidth={2.5} className="spin" /></td></tr>
                ) : listings.length === 0 ? (
                  <tr><td colSpan={6} className="admin-table-empty">No listings match this filter.</td></tr>
                ) : (
                  listings.map((prop) => (
                    <tr key={prop._id}>
                      <td>
                        <strong>{prop.title}</strong>
                        <div className="admin-table-muted" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                          {prop.listingType} &middot; {prop.propertyType}
                        </div>
                      </td>
                      <td className="admin-table-muted">
                        {prop.agent?.name || 'Agent'}
                      </td>
                      <td className="admin-table-muted">
                        {prop.city}{prop.region ? `, ${prop.region}` : ''}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatMoney(prop.price)}
                      </td>
                      <td>
                        <select
                          className="input status-select"
                          value={prop.status || 'available'}
                          disabled={rowActionId === prop._id}
                          onChange={(e) => handleAdminPropertyStatusChange(prop._id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st} style={{ textTransform: 'capitalize' }}>{st}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Link to={`/listings/${prop._id}`} className="btn btn-outline btn-sm" aria-label="View listing" title="View Property Details">
                            <ExternalLink size={16} strokeWidth={2.5} color="var(--color-accent-dark, #8a6a10)" />
                          </Link>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={rowActionId === prop._id}
                            onClick={() => setDeletingPropertyId(prop._id)}
                            aria-label="Delete listing"
                            title="Delete Listing"
                          >
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {listingsTotalPages > 1 && (
            <div className="admin-pagination">
              <button className="btn btn-outline btn-sm" disabled={listingsPage <= 1} onClick={() => setListingsPage((p) => p - 1)}>
                <ChevronLeft size={16} strokeWidth={2.5} /> Prev
              </button>
              <span className="section-subtext">Page {listingsPage} of {listingsTotalPages}</span>
              <button className="btn btn-outline btn-sm" disabled={listingsPage >= listingsTotalPages} onClick={() => setListingsPage((p) => p + 1)}>
                Next <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUserId && (
        <Modal title="Delete this user?" onClose={() => setDeletingUserId(null)} width={420}>
          <p className="confirm-copy">
            {deletingUser ? `${deletingUser.name}'s` : "This user's"} account and all of their property listings will be permanently removed. This can&rsquo;t be undone.
          </p>
          <div className="modal-footer modal-footer--form">
            <button type="button" className="btn btn-outline" onClick={() => setDeletingUserId(null)}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={handleDeleteUser}>
              <Trash2 size={16} strokeWidth={2.5} /> Delete user
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Listing Modal */}
      {deletingPropertyId && (
        <Modal title="Delete this listing?" onClose={() => setDeletingPropertyId(null)} width={420}>
          <p className="confirm-copy">
            {deletingProperty ? `"${deletingProperty.title}"` : "This property listing"} will be permanently deleted. This can&rsquo;t be undone.
          </p>
          <div className="modal-footer modal-footer--form">
            <button type="button" className="btn btn-outline" onClick={() => setDeletingPropertyId(null)}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={handleDeleteListing}>
              <Trash2 size={16} strokeWidth={2.5} /> Delete listing
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
