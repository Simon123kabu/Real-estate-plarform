import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/components.css';

/* Tab definitions — icons are SVG inline for precision & quality */
function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" fill={active ? 'white' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth="2" />
    </svg>
  );
}

function SearchIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  );
}

function BellIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function AdminIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export default function BottomTabBar() {
  const { isAuthenticated, role } = useAuth();

  return (
    <nav className="bottom-tab-bar" aria-label="Mobile navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
      >
        {({ isActive }) => (
          <>
            <span className="tab-icon"><HomeIcon active={isActive} /></span>
            <span className="tab-label">Home</span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/listings"
        className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
      >
        {({ isActive }) => (
          <>
            <span className="tab-icon"><SearchIcon active={isActive} /></span>
            <span className="tab-label">Browse</span>
          </>
        )}
      </NavLink>

      {isAuthenticated && role === 'agent' && (
        <NavLink
          to="/notifications"
          className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <span className="tab-icon"><BellIcon active={isActive} /></span>
              <span className="tab-label">Alerts</span>
            </>
          )}
        </NavLink>
      )}

      {isAuthenticated && role === 'admin' && (
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <span className="tab-icon"><AdminIcon active={isActive} /></span>
              <span className="tab-label">Admin</span>
            </>
          )}
        </NavLink>
      )}

      {isAuthenticated ? (
        <NavLink
          to="/profile"
          className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <span className="tab-icon"><ProfileIcon active={isActive} /></span>
              <span className="tab-label">Profile</span>
            </>
          )}
        </NavLink>
      ) : (
        <NavLink
          to="/login"
          className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <span className="tab-icon"><ProfileIcon active={isActive} /></span>
              <span className="tab-label">Sign in</span>
            </>
          )}
        </NavLink>
      )}
    </nav>
  );
}
