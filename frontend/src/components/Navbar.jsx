import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/components.css';

export default function Navbar() {
  const { isAuthenticated, role, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // Detect scroll for glass opacity shift
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/');
  };

  // Derive initials from user name
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      {/* ── Logo ── */}
      <Link to="/" className="navbar-logo" onClick={closeMenu}>
        Property<span>Connect</span>
      </Link>

      {/* ── Desktop right-side controls ── */}
      <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
        {/* Public links */}
        <NavLink
          to="/"
          end
          className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          onClick={closeMenu}
        >
          Home
        </NavLink>

        <NavLink
          to="/listings"
          className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          onClick={closeMenu}
        >
          Listings
        </NavLink>

        {/* Admin only */}
        {isAuthenticated && role === 'admin' && (
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            onClick={closeMenu}
          >
            Admin
          </NavLink>
        )}

        <span className="navbar-sep" aria-hidden="true" />

        {/* ── Dark mode toggle ── */}
        <button
          className="navbar-theme-btn"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun size={22} strokeWidth={2.3} /> : <Moon size={22} strokeWidth={2.3} />}
        </button>

        {/* ── Agents only: bell icon ── */}
        {isAuthenticated && role === 'agent' && (
          <Link
            to="/notifications"
            className="navbar-bell"
            aria-label="Notifications"
            onClick={closeMenu}
          >
            <Bell size={22} strokeWidth={2.3} />
            {/* Unread dot — show if there are unread notifications */}
            {/* <span className="navbar-bell-dot" aria-hidden="true" /> */}
          </Link>
        )}

        {/* ── Authenticated: avatar → /profile ── */}
        {isAuthenticated ? (
          <>
            <Link
              to="/profile"
              className="navbar-avatar"
              aria-label="View profile"
              onClick={closeMenu}
              title={user?.name || 'Profile'}
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} />
              ) : (
                initials
              )}
            </Link>

            <button
              className="navbar-logout"
              onClick={handleLogout}
              aria-label="Log out"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="navbar-cta" onClick={closeMenu}>
            Sign in
          </Link>
        )}
      </div>

      {/* ── Mobile hamburger ── */}
      <button
        className="navbar-toggle"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={24} strokeWidth={2.4} /> : <Menu size={24} strokeWidth={2.4} />}
      </button>
    </nav>
  );
}
