import { Link } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import { useEffect, useRef, useState } from 'react';

const CITIES = [
  { name: 'Accra',      image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Kumasi',     image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Cape Coast', image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Takoradi',   image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Aburi',      image: 'https://images.unsplash.com/photo-1511497584788-876761c119ef?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Tamale',     image: 'https://images.unsplash.com/photo-1572276596237-5db2c3e16c5d?w=1200&auto=format&fit=crop&q=80' },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Browse Verified Listings',
    desc: 'Explore properties across Accra, Kumasi, Takoradi & more. Every listing is checked for clean title and accurate pricing — no fake ads, no surprises.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: '2',
    title: 'Connect with a Verified Agent',
    desc: 'We match you with licensed, REAC-registered agents only. No middlemen, no hidden fees, no overcharging. You deal directly with professionals.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    step: '3',
    title: 'Tour & Verify with Confidence',
    desc: 'Schedule virtual or in-person tours. Every property comes with title-check guidance and transparent cost breakdowns so you know exactly what you are paying for.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    step: '4',
    title: 'Close the Deal Stress-Free',
    desc: 'From offer to keys, our platform streamlines paperwork, legal checks, and agent coordination. Buy, sell, or rent without the usual Ghanaian property headache.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

const STATS = [
  { value: 1800000, suffix: '+', label: 'Housing Deficit in Ghana', prefix: '' },
  { value: 5.8, suffix: '%', label: 'Market Growth Rate (2026)', prefix: '' },
  { value: 10000, suffix: '+', label: 'Verified Listings', prefix: '' },
  { value: 98, suffix: '%', label: 'Client Satisfaction Rate', prefix: '' },
];

const TRUST_SIGNALS = [
  {
    title: 'Verified Agents Only',
    desc: 'Every agent on our platform is REAC-registered and background-checked. No unlicensed middlemen.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Clean Title Guarantee',
    desc: 'We guide you through Lands Commission checks and flag litigation risks before you pay a cedi.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'No Hidden Charges',
    desc: 'Transparent pricing on every listing. What you see is what you pay — no surprise "agent fees" at closing.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Diaspora Friendly',
    desc: 'Virtual tours, digital contracts, and remote payment support. Buy property in Ghana from anywhere in the world.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    name: 'Kwame Asante',
    role: 'First-Time Buyer, Accra',
    quote: 'I was scared of being overcharged by agents, but this platform connected me to a verified agent who walked me through every step. I got my East Legon townhouse at a fair price.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ama Owusu',
    role: 'Diaspora Investor, London',
    quote: 'Buying property from abroad used to feel impossible. The virtual tours and title-check support gave me confidence. I now own a rental unit in Kumasi without ever stepping foot there first.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Dr. Emmanuel Boateng',
    role: 'Family Home Buyer, Takoradi',
    quote: 'The transparency is what sold me. No hidden fees, no back-and-forth pricing games. The agent was professional and the closing was smooth. Highly recommended.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  },
];

const MARKET_INSIGHTS = [
  {
    tag: 'Market Report',
    title: 'Ghana Real Estate Outlook 2026: Steady Growth Ahead',
    excerpt: 'Prime Accra prices are projected to rise 5–10% over the next 12 months. Mid-market townhouses and gated communities are the strongest performers.',
    date: 'July 2026',
    readTime: '5 min read',
  },
  {
    tag: 'Buying Guide',
    title: 'Avoiding Title Fraud: What Every Ghanaian Buyer Must Know',
    excerpt: 'Land disputes account for 52–57% of all civil court cases in Ghana. Learn how to verify title at the Lands Commission and protect yourself.',
    date: 'June 2026',
    readTime: '7 min read',
  },
  {
    tag: 'Investment',
    title: "Why Kumasi is Ghana's Next Property Hotspot",
    excerpt: 'With major road infrastructure and Boankra logistics terminal driving growth, Kumasi is seeing strong cumulative price growth potential.',
    date: 'May 2026',
    readTime: '6 min read',
  },
];

/* ── Animated Counter Hook ─────────────────────────── */
function useCountUp(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(easeOut * end);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
}

function StatCard({ value, suffix, label, prefix }) {
  const isDecimal = value % 1 !== 0;
  const { count, ref } = useCountUp(value, 2500);
  const display = isDecimal ? count.toFixed(1) : Math.floor(count).toLocaleString();

  return (
    <div className="home-stat-card" ref={ref}>
      <div className="home-stat-value">
        {prefix}{display}{suffix}
      </div>
      <div className="home-stat-label">{label}</div>
    </div>
  );
}

/* ── Main component ─────────────────────────── */
export default function Home() {
  return (
    <main className="page-enter">
      {/* ── Hero Carousel (ORIGINAL — preserved) ── */}
      <HeroCarousel />

      {/* ── Value Proposition / Problem Section ── */}
      <section className="value-prop-section">
        <div className="value-prop-container">
          <div className="value-prop-text">
            <h2 className="value-prop-title">
              Tired of Overcharged Fees, Fake Listings & Shady Agents?
            </h2>
            <p className="value-prop-desc">
              We know how exhausting it is to find a property in Ghana. Agents overcharge, listings disappear, 
              and titles turn out fake. Our platform cuts through the noise — connecting you directly to 
              <strong> verified, licensed agents</strong> with clean listings and transparent pricing. 
              No stress. No surprises. Just property.
            </p>
            <div className="value-prop-ctas">
              <Link to="/listings" className="btn btn-primary btn-lg">Browse Listings</Link>
              <Link to="/register?role=agent" className="btn btn-secondary btn-lg">List Your Property</Link>
            </div>
          </div>
          <div className="value-prop-visual">
            <div className="value-prop-card value-prop-card--top">
              <div className="vpc-icon">🏠</div>
              <div>
                <strong>1.8M+</strong>
                <span>Housing deficit in Ghana — demand is real.</span>
              </div>
            </div>
            <div className="value-prop-card value-prop-card--middle">
              <div className="vpc-icon">🛡️</div>
              <div>
                <strong>52–57%</strong>
                <span>Of court cases are land disputes. We help you avoid them.</span>
              </div>
            </div>
            <div className="value-prop-card value-prop-card--bottom">
              <div className="vpc-icon">💰</div>
              <div>
                <strong>0.5%</strong>
                <span>Mortgage penetration. Most buyers pay cash — fairness matters.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-it-works-section">
        <div className="hiw-container">
          <div className="home-section-header">
            <h2 className="home-section-title">How It Works</h2>
            <p className="home-section-subtitle">
              From search to keys in four easy steps. We have removed the friction so you can focus on finding home.
            </p>
          </div>
          <div className="hiw-grid">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="hiw-card">
                <div className="hiw-icon">{item.icon}</div>
                <div className="hiw-step">{item.step}</div>
                <h3 className="hiw-title">{item.title}</h3>
                <p className="hiw-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prestige Landmark Edge-to-Edge Strip ── */}
      <section className="prestige-section">
        <div className="prestige-header-container">
          <h2 className="prestige-title">Find Properties Across Many Cities</h2>
          <p className="prestige-subtitle">
            Major cities or exclusive Ghanaian destinations. Choose the luxury that suits you.
          </p>
        </div>

        {/* Full Bleed Edge-to-Edge Rectangular Columns (Fixed Size, Zoom Image on Hover) */}
        <div className="prestige-full-grid">
          {CITIES.map(({ name, image }) => (
            <Link
              key={name}
              to={`/listings?city=${encodeURIComponent(name)}`}
              className="prestige-city-strip"
            >
              <img
                src={image}
                alt={`${name} city landmark`}
                className="prestige-city-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&auto=format&fit=crop&q=80';
                }}
              />
              <div className="prestige-city-overlay">
                <h3 className="prestige-city-name">{name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Ghana Real Estate in 2026 (Stats Counter) ── */}
      <section className="home-stats-section">
        <div className="home-stats-container">
          <div className="home-section-header home-section-header--light">
            <h2 className="home-section-title" style={{ color: '#ffffff' }}>Ghana Real Estate in 2026</h2>
            <p className="home-section-subtitle" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              The market is growing, but it rewards informed buyers. Here is what is happening right now.
            </p>
          </div>
          <div className="home-stats-grid">
            {STATS.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>
          <p className="home-stats-source">
            Sources: Minister of Works & Housing (Jan 2026), Bank of Ghana, Ghana Property Finder Q1 2026.
          </p>
        </div>
      </section>

      {/* ── Why Buyers Choose Us (Trust Signals) ── */}
      <section className="trust-section">
        <div className="trust-container">
          <div className="home-section-header">
            <h2 className="home-section-title">Why Buyers Choose Us</h2>
            <p className="home-section-subtitle">
              We are solving the three biggest problems in Ghanaian real estate: information asymmetry, 
              trust failure, and agent overcharging.
            </p>
          </div>
          <div className="trust-grid">
            {TRUST_SIGNALS.map((item, i) => (
              <div key={i} className="trust-card">
                <div className="trust-icon">{item.icon}</div>
                <h3 className="trust-title">{item.title}</h3>
                <p className="trust-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="home-section-header">
            <h2 className="home-section-title">What Our Clients Say</h2>
            <p className="home-section-subtitle">
              Ghanaians who found their property without the usual stress, overcharging, or title fears.
            </p>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <img src={t.avatar} alt={t.name} className="testimonial-avatar" loading="lazy" />
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Market Insights ── */}
      <section className="insights-section">
        <div className="insights-container">
          <div className="home-section-header">
            <h2 className="home-section-title">Market Insights</h2>
            <p className="home-section-subtitle">
              Data-driven updates on the Ghanaian property market so you buy, sell, and invest with confidence.
            </p>
          </div>
          <div className="insights-grid">
            {MARKET_INSIGHTS.map((article, i) => (
              <article key={i} className="insight-card">
                <span className="insight-tag">{article.tag}</span>
                <h3 className="insight-title">{article.title}</h3>
                <p className="insight-excerpt">{article.excerpt}</p>
                <div className="insight-footer">
                  <span>{article.date}</span>
                  <span>{article.readTime}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}