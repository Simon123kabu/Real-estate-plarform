import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import '../styles/components.css';

/* ── Inline SVG social icons (lucide-react removed brand icons) ── */
const IconFacebook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);
const IconLinkedIn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Browse Listings', to: '/listings' },
  { label: 'Login', to: '/login' },
  { label: 'Register', to: '/register' },
];

const cities = [
  { label: 'Accra', to: '/listings?city=Accra' },
  { label: 'Kumasi', to: '/listings?city=Kumasi' },
  { label: 'Takoradi', to: '/listings?city=Takoradi' },
  { label: 'Tamale', to: '/listings?city=Tamale' },
  { label: 'Cape Coast', to: '/listings?city=Cape+Coast' },
];

const socials = [
  { icon: <IconFacebook />, href: '#', label: 'Facebook' },
  { icon: <IconX />,        href: '#', label: 'X (Twitter)' },
  { icon: <IconInstagram />,href: '#', label: 'Instagram' },
  { icon: <IconLinkedIn />, href: '#', label: 'LinkedIn' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-top">
        {/* ── Brand column ── */}
        <div className="footer-brand">
          <h3>
            Property<span>Connect</span>
          </h3>
          <p>
            Connecting you to homes, apartments, and land across Ghana. 
            Find your perfect property with trusted, verified agents.
          </p>

          <div className="footer-socials" aria-label="Social media links">
            {socials.map(({ icon, href, label }) => (
              <a
                key={label}
                href={href}
                className="footer-social-btn"
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* ── Quick Links column ── */}
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            {quickLinks.map(({ label, to }) => (
              <li key={label}>
                <Link to={to}>
                  <ArrowRight size={12} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Popular Cities column ── */}
        <div className="footer-col">
          <h4>Popular Cities</h4>
          <ul>
            {cities.map(({ label, to }) => (
              <li key={label}>
                <Link to={to}>
                  <MapPin size={12} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Contact + Newsletter column ── */}
        <div className="footer-col footer-newsletter">
          <h4>Contact Us</h4>
          <ul style={{ marginBottom: '24px' }}>
            <li>
              <a href="mailto:info@propertyconnectghana.com">
                <Mail size={12} />
                info@propertyconnectghana.com
              </a>
            </li>
            <li>
              <a href="tel:+233000000000">
                <Phone size={12} />
                +233 00 000 0000
              </a>
            </li>
            <li>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.6)' }}>
                <MapPin size={12} />
                Accra, Ghana
              </span>
            </li>
          </ul>

          <h4>Newsletter</h4>
          <p>Get the latest listings delivered to your inbox.</p>
          <form
            className="footer-newsletter-form"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Newsletter signup"
          >
            <input
              type="email"
              className="footer-newsletter-input"
              placeholder="Your email address"
              aria-label="Email address for newsletter"
            />
            <button type="submit" className="footer-newsletter-btn">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {year} PropertyConnect Ghana. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}