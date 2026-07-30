import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import '../styles/components.css';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&auto=format&fit=crop&q=80',
    headline: 'Find Your Perfect Home in Ghana',
    subtitle: 'Browse thousands of verified listings across Accra, Kumasi, Takoradi and beyond.',
  },
  {
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1400&auto=format&fit=crop&q=80',
    headline: 'Verified Agents, Genuine Properties',
    subtitle: 'Every listing is posted by a licensed, verified agent. Search with total confidence.',
  },
  {
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&auto=format&fit=crop&q=80',
    headline: 'From First Home to Dream Estate',
    subtitle: 'Whether renting, buying, or investing — we connect you to the right property at the right price.',
  },
];

const AUTOPLAY_MS = 5000;

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  // Automatic continuous slideshow transition
  useEffect(() => {
    const timer = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [goNext]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/listings');
    }
  };

  return (
    <section className="hero" aria-label="Hero carousel">
      {/* ── Slides (Continuous auto crossfade + Ken-Burns zoom) ── */}
      <div className="hero-slides" aria-live="polite" aria-atomic="true">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`hero-slide${i === current ? ' active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
            aria-hidden={i !== current}
          />
        ))}
      </div>

      {/* ── Centered content ── */}
      <div className="hero-content">
        <h1 className="hero-title" key={`title-${current}`}>
          {slides[current].headline}
        </h1>

        <p className="hero-subtitle" key={`sub-${current}`}>
          {slides[current].subtitle}
        </p>

        {/* Search bar */}
        <form
          className="hero-search"
          onSubmit={handleSearch}
          role="search"
          aria-label="Search for properties"
        >
          <MapPin size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
          <input
            className="hero-search-input"
            type="text"
            placeholder="Search by city, region, or property type…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search properties"
            id="hero-search-input"
          />
          <button type="submit" className="hero-search-btn" aria-label="Search">
            <Search size={15} />
            Search
          </button>
        </form>
      </div>
    </section>
  );
}