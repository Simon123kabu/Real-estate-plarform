import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL;

const statusOptions = ['available', 'pending', 'sold', 'rented'];

// ---------- PREVIEW/DEMO DATA (shown only when the backend can't be reached) ----------
const demoStats = {
  totalUsers: 128,
  totalAgents: 34,
  totalBuyers: 91,
  totalAdmins: 3,
  totalListings: 76,
  availableListings: 52,
  soldOrRentedListings: 24,
  newUsersThisWeek: 9,
  newListingsThisWeek: 5,
  pendingAgents: 2,
};

const demoUsers = [
  { _id: 'd1', name: 'Ama Owusu', email: 'ama@example.com', role: 'buyer', agentStatus: null },
  { _id: 'd2', name: 'Kwame Mensah', email: 'kwame@example.com', role: 'agent', agentStatus: 'approved' },
  { _id: 'd3', name: 'Efua Asante', email: 'efua@example.com', role: 'buyer', agentStatus: null },
  { _id: 'd4', name: 'Yaw Boateng', email: 'yaw@example.com', role: 'agent', agentStatus: 'rejected' },
  { _id: 'd5', name: 'Abena Serwaa', email: 'abena@example.com', role: 'admin', agentStatus: null },
  { _id: 'd6', name: 'Kofi Adjei', email: 'kofi@example.com', role: 'agent', agentStatus: 'pending' },
];

const demoListings = [
  { _id: 'l1', title: 'Modern 4-Bedroom House', city: 'Accra', agent: { name: 'Kwame Mensah' }, status: 'available' },
  { _id: 'l2', title: 'Cozy 2-Bedroom Apartment', city: 'Accra', agent: { name: 'Kwame Mensah' }, status: 'pending' },
  { _id: 'l3', title: 'Executive Villa', city: 'Accra', agent: { name: 'Yaw Boateng' }, status: 'sold' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview'); // overview | users | listings
  const [isPreview, setIsPreview] = useState(false);

  // ---------- STATS ----------
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ---------- RECENT ACTIVITY ----------
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.data);
        setIsPreview(false);
      } else {
        throw new Error('unavailable');
      }
    } catch (err) {
      setStats(demoStats);
      setIsPreview(true);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    setRecentLoading(true);
    try {
      const [usersRes, listingsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/users?page=1&limit=5`, { credentials: 'include' }),
        fetch(`${API_BASE}/admin/properties?page=1&limit=5`, { credentials: 'include' }),
      ]);
      const usersData = await usersRes.json();
      const listingsData = await listingsRes.json();

      if (usersRes.ok && usersData.success && listingsRes.ok && listingsData.success) {
        setRecentUsers((usersData.data.users || usersData.data).slice(0, 5));
        setRecentListings((listingsData.data.properties || listingsData.data).slice(0, 5));
      } else {
        throw new Error('unavailable');
      }
    } catch (err) {
      setRecentUsers(demoUsers.slice(0, 5));
      setRecentListings(demoListings.slice(0, 5));
      setIsPreview(true);
    } finally {
      setRecentLoading(false);
    }
  };

  // ---------- USERS ----------
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, roleFilter]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter);
      if (search && search.trim()) params.set('search', search.trim());
      const res = await fetch(`${API_BASE}/admin/users?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.data.users || data.data);
        setTotalPages(data.data.totalPages || 1);
        setIsPreview(false);
      } else {
        throw new Error('unavailable');
      }
    } catch (err) {
      setUsers(demoUsers);
      setTotalPages(1);
      setIsPreview(true);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const changeRole = async (userId, newRole) => {
    if (isPreview) {
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      return;
    }
    if (!confirm(`Change this user's role to "${newRole}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      } else {
        alert(data.message || 'Could not change role.');
      }
    } catch (err) {
      alert('Could not reach the server.');
    }
  };

  const toggleAgentStatus = async (user) => {
    const isActive = user.agentStatus === 'approved';
    if (isPreview) {
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, agentStatus: isActive ? 'rejected' : 'approved' } : u))
      );
      return;
    }
    const action = isActive ? 'reject' : 'approve';
    const confirmMsg = isActive ? 'Block this agent?' : 'Unblock this agent?';
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user._id}/${action}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, agentStatus: isActive ? 'rejected' : 'approved' } : u))
        );
      } else {
        alert(data.message || 'Could not update agent status.');
      }
    } catch (err) {
      alert('Could not reach the server.');
    }
  };

  const deleteUser = async (userId) => {
    if (isPreview) {
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      return;
    }
    if (!confirm('Delete this user? This will also remove all their listings and favourites.')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        alert(data.message || 'Could not delete user.');
      }
    } catch (err) {
      alert('Could not reach the server.');
    }
  };

  // ---------- LISTINGS ----------
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsTotalPages, setListingsTotalPages] = useState(1);

  useEffect(() => {
    if (tab === 'listings') fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, listingsPage, statusFilter]);

  const fetchListings = async () => {
    setListingsLoading(true);
    try {
      const params = new URLSearchParams({ page: listingsPage, limit: 20 });
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (cityFilter && cityFilter.trim()) params.set('city', cityFilter.trim());
      const res = await fetch(`${API_BASE}/admin/properties?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setListings(data.data.properties || data.data);
        setListingsTotalPages(data.data.totalPages || 1);
        setIsPreview(false);
      } else {
        throw new Error('unavailable');
      }
    } catch (err) {
      setListings(demoListings);
      setListingsTotalPages(1);
      setIsPreview(true);
    } finally {
      setListingsLoading(false);
    }
  };

  const handleListingFilterSubmit = (e) => {
    e.preventDefault();
    setListingsPage(1);
    fetchListings();
  };

  const changeListingStatus = async (listingId, newStatus) => {
    if (isPreview) {
      setListings((prev) => prev.map((l) => (l._id === listingId ? { ...l, status: newStatus } : l)));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/properties/${listingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setListings((prev) => prev.map((l) => (l._id === listingId ? { ...l, status: newStatus } : l)));
      } else {
        alert(data.message || 'Could not update status.');
      }
    } catch (err) {
      alert('Could not reach the server.');
    }
  };

  const deleteListing = async (listingId) => {
    if (isPreview) {
      setListings((prev) => prev.filter((l) => l._id !== listingId));
      return;
    }
    if (!confirm('Permanently remove this listing?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/properties/${listingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setListings((prev) => prev.filter((l) => l._id !== listingId));
      } else {
        alert(data.message || 'Could not delete listing.');
      }
    } catch (err) {
      alert('Could not reach the server.');
    }
  };

  return (
    <div className="page-bg" style={styles.wrap}>
      <h1 style={styles.title}>Admin Dashboard</h1>

      {isPreview && (
        <div style={styles.previewBanner}>
          ⚠ Showing preview layout with sample data — Simon's backend isn't connected yet.
          This will switch to real data automatically once it's live.
        </div>
      )}

      <div style={styles.tabs}>
        <button onClick={() => setTab('overview')} style={tab === 'overview' ? styles.tabActive : styles.tabInactive}>
          Overview
        </button>
        <button onClick={() => setTab('users')} style={tab === 'users' ? styles.tabActive : styles.tabInactive}>
          Users
        </button>
        <button onClick={() => setTab('listings')} style={tab === 'listings' ? styles.tabActive : styles.tabInactive}>
          Listings
        </button>
      </div>

      {tab === 'overview' && (
        <>
          {statsLoading ? (
            <p style={styles.stateText}>Loading stats...</p>
          ) : (
            stats && (
              <div style={styles.statsGrid}>
                <div className="card-modern" style={styles.statCard}>
                  <p style={styles.statNumber}>{stats.totalUsers ?? 0}</p>
                  <p style={styles.statLabel}>Total Users</p>
                </div>
                <div className="card-modern" style={styles.statCard}>
                  <p style={styles.statNumber}>{stats.totalAgents ?? 0}</p>
                  <p style={styles.statLabel}>Agents</p>
                </div>
                <div className="card-modern" style={styles.statCard}>
                  <p style={styles.statNumber}>{stats.totalBuyers ?? 0}</p>
                  <p style={styles.statLabel}>Buyers</p>
                </div>
                <div className="card-modern" style={styles.statCard}>
                  <p style={styles.statNumber}>{stats.totalAdmins ?? 0}</p>
                  <p style={styles.statLabel}>Admins</p>
                </div>
                <div className="card-modern" style={styles.statCard}>
                  <p style={styles.statNumber}>{stats.totalListings ?? 0}</p>
                  <p style={styles.statLabel}>Total Listings</p>
                </div>
                <div className="card-modern" style={styles.statCard}>
                  <p style={styles.statNumber}>{stats.availableListings ?? 0}</p>
                  <p style={styles.statLabel}>Available</p>
                </div>
                <div className="card-modern" style={styles.statCard}>
                  <p style={styles.statNumber}>{stats.soldOrRentedListings ?? 0}</p>
                  <p style={styles.statLabel}>Sold / Rented</p>
                </div>
                <div className="card-modern" style={styles.statCard}>
                  <p style={styles.statNumber}>{stats.newUsersThisWeek ?? 0}</p>
                  <p style={styles.statLabel}>New Users This Week</p>
                </div>
                <div className="card-modern" style={styles.statCard}>
                  <p style={styles.statNumber}>{stats.newListingsThisWeek ?? 0}</p>
                  <p style={styles.statLabel}>New Listings This Week</p>
                </div>
                <div className="card-modern" style={styles.statCard}>
                  <p style={styles.statNumber}>{stats.pendingAgents ?? 0}</p>
                  <p style={styles.statLabel}>Pending Agents</p>
                </div>
              </div>
            )
          )}

          <h2 style={styles.sectionHeading}>Recent Activity</h2>

          {recentLoading ? (
            <p style={styles.stateText}>Loading recent activity...</p>
          ) : (
            <div style={styles.activityGrid}>
              <div className="card-modern" style={styles.activityCard}>
                <h3 style={styles.activityTitle}>Newest Users</h3>
                <ul style={styles.activityList}>
                  {recentUsers.map((user) => (
                    <li key={user._id} style={styles.activityItem}>
                      <span style={styles.activityName}>{user.name}</span>
                      <span style={styles.activityMeta}>{user.role}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-modern" style={styles.activityCard}>
                <h3 style={styles.activityTitle}>Newest Listings</h3>
                <ul style={styles.activityList}>
                  {recentListings.map((listing) => (
                    <li key={listing._id} style={styles.activityItem}>
                      <span style={styles.activityName}>{listing.title}</span>
                      <span style={styles.activityMeta}>{listing.city}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'users' && (
        <div>
          <form onSubmit={handleSearchSubmit} style={styles.filterRow}>
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              style={styles.select}
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyer</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" style={styles.searchButton}>Search</button>
          </form>

          {usersLoading ? (
            <p style={styles.stateText}>Loading users...</p>
          ) : (
            <>
              <div className="card-modern" style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td style={styles.td}>{user.name}</td>
                        <td style={styles.td}>{user.email}</td>
                        <td style={styles.td}>
                          <select
                            value={user.role}
                            onChange={(e) => changeRole(user._id, e.target.value)}
                            style={styles.roleSelect}
                          >
                            <option value="buyer">Buyer</option>
                            <option value="agent">Agent</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={styles.td}>
                          {user.role === 'agent' ? (
                            <span
                              style={
                                user.agentStatus === 'approved'
                                  ? styles.activeBadge
                                  : user.agentStatus === 'pending'
                                  ? styles.pendingBadge
                                  : styles.suspendedBadge
                              }
                            >
                              {user.agentStatus === 'approved'
                                ? 'Active'
                                : user.agentStatus === 'pending'
                                ? 'Pending Approval'
                                : 'Suspended'}
                            </span>
                          ) : (
                            <span style={styles.naText}>—</span>
                          )}
                        </td>
                        <td style={{ ...styles.td, ...styles.actionsCell }}>
                          {user.role === 'agent' && user.agentStatus === 'pending' && (
                            <button onClick={() => toggleAgentStatus(user)} style={styles.approveButton}>
                              Approve
                            </button>
                          )}
                          {user.role === 'agent' && user.agentStatus !== 'pending' && (
                            <button onClick={() => toggleAgentStatus(user)} style={styles.secondaryButton}>
                              {user.agentStatus === 'approved' ? 'Block' : 'Unblock'}
                            </button>
                          )}
                          <button onClick={() => deleteUser(user._id)} style={styles.removeButton}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td style={styles.emptyCell} colSpan={5}>No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={styles.pagination}>
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={styles.pageButton}>
                  ← Previous
                </button>
                <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={styles.pageButton}>
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'listings' && (
        <div>
          <form onSubmit={handleListingFilterSubmit} style={styles.filterRow}>
            <input
              type="text"
              placeholder="Filter by city"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              style={styles.searchInput}
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setListingsPage(1);
              }}
              style={styles.select}
            >
              <option value="">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button type="submit" style={styles.searchButton}>Filter</button>
          </form>

          {listingsLoading ? (
            <p style={styles.stateText}>Loading listings...</p>
          ) : (
            <>
              <div className="card-modern" style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Title</th>
                      <th style={styles.th}>City</th>
                      <th style={styles.th}>Agent</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <tr key={listing._id}>
                        <td style={styles.td}>{listing.title}</td>
                        <td style={styles.td}>{listing.city}</td>
                        <td style={styles.td}>{listing.agent?.name || '—'}</td>
                        <td style={styles.td}>
                          <select
                            value={listing.status}
                            onChange={(e) => changeListingStatus(listing._id, e.target.value)}
                            style={styles.roleSelect}
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => deleteListing(listing._id)} style={styles.removeButton}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {listings.length === 0 && (
                      <tr>
                        <td style={styles.emptyCell} colSpan={5}>No listings found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={styles.pagination}>
                <button disabled={listingsPage <= 1} onClick={() => setListingsPage((p) => Math.max(1, p - 1))} style={styles.pageButton}>
                  ← Previous
                </button>
                <span style={styles.pageInfo}>Page {listingsPage} of {listingsTotalPages}</span>
                <button disabled={listingsPage >= listingsTotalPages} onClick={() => setListingsPage((p) => p + 1)} style={styles.pageButton}>
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { padding: '40px 32px', maxWidth: '1100px', margin: '0 auto' },
  title: { marginBottom: '20px' },
  previewBanner: {
    backgroundColor: '#fff8e1',
    color: '#8a6d00',
    padding: '14px 20px',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.9rem',
    marginBottom: '24px',
  },
  tabs: { display: 'flex', gap: '10px', marginBottom: '32px', borderBottom: '1px solid #ddd' },
  tabActive: {
    padding: '10px 20px', border: 'none', borderBottom: '3px solid var(--color-primary)',
    backgroundColor: 'transparent', color: 'var(--color-primary)', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  tabInactive: {
    padding: '10px 20px', border: 'none', borderBottom: '3px solid transparent',
    backgroundColor: 'transparent', color: '#777', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' },
  statCard: { backgroundColor: 'var(--color-white)', padding: '24px', textAlign: 'center' },
  statNumber: { fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '6px' },
  statLabel: { color: '#777', fontSize: '0.9rem', fontWeight: 600 },
  sectionHeading: { fontSize: '1.3rem', color: 'var(--color-secondary)', marginTop: '40px', marginBottom: '20px' },
  activityGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  activityCard: { backgroundColor: 'var(--color-white)', padding: '20px' },
  activityTitle: { fontSize: '1rem', color: 'var(--color-secondary)', marginBottom: '14px' },
  activityList: { listStyle: 'none', padding: 0, margin: 0 },
  activityItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee', fontSize: '0.9rem' },
  activityName: { color: 'var(--color-charcoal)', fontWeight: 600 },
  activityMeta: { color: '#999', fontSize: '0.8rem', textTransform: 'capitalize' },
  stateText: { color: '#777', padding: '20px 0' },
  filterRow: { display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'var(--font-body)' },
  select: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'var(--font-body)' },
  searchButton: {
    padding: '10px 20px', backgroundColor: 'var(--color-primary)', color: 'var(--color-white)',
    border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  tableWrap: { backgroundColor: 'var(--color-white)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '14px 16px', backgroundColor: 'var(--color-secondary)',
    color: 'var(--color-cream)', fontSize: '0.9rem', whiteSpace: 'nowrap',
  },
  td: { padding: '14px 16px', borderBottom: '1px solid #eee', fontSize: '0.9rem' },
  actionsCell: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  roleSelect: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' },
  activeBadge: {
    backgroundColor: '#e6f4ea', color: '#1e7e34', padding: '4px 10px',
    borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700,
  },
  suspendedBadge: {
    backgroundColor: '#fdecea', color: 'var(--color-primary)', padding: '4px 10px',
    borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700,
  },
  pendingBadge: {
    backgroundColor: '#fff8e1', color: '#b8860b', padding: '4px 10px',
    borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700,
  },
  approveButton: {
    padding: '6px 14px', backgroundColor: 'var(--color-secondary)', color: 'var(--color-cream)',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
  },
  naText: { color: '#bbb' },
  secondaryButton: {
    padding: '6px 14px', backgroundColor: 'transparent', color: 'var(--color-secondary)',
    border: '1px solid var(--color-secondary)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem',
  },
  removeButton: {
    padding: '6px 14px', backgroundColor: 'transparent', color: 'var(--color-primary)',
    border: '1px solid var(--color-primary)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem',
  },
  emptyCell: { padding: '24px', textAlign: 'center', color: '#777' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' },
  pageButton: { padding: '8px 16px', backgroundColor: 'var(--color-white)', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  pageInfo: { fontSize: '0.85rem', color: '#777' },
};
