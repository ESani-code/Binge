// src/components/Header.tsx
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import "./styles/Header.css";

// ─── Types ───────────────────────────────────────────────────────────────────
type NavItem = {
  label: string;
  type: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Movies", type: "movie" },
  { label: "TV Shows", type: "tv" },
  { label: "New Releases", type: "new" },
];

// ─── Component ───────────────────────────────────────────────────────────────
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("query") ?? "",
  );
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active nav type from URL
  const currentType = searchParams.get("type");
  const isSearchPage = location.pathname.includes("search");

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Sync search input when URL query changes ───────────────────────────────
  useEffect(() => {
    setSearchQuery(searchParams.get("query") ?? "");
  }, [searchParams]);

  // ── Debounced search handler ───────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        if (value.trim().length > 1) {
          navigate(`/search?query=${encodeURIComponent(value.trim())}&page=1`);
        } else if (value.trim().length === 0 && isSearchPage) {
          // Clear search — go back to home
          navigate("/");
        }
      }, 420);
    },
    [navigate, isSearchPage],
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      navigate(
        `/search?query=${encodeURIComponent(searchQuery.trim())}&page=1`,
      );
    }
    if (e.key === "Escape") {
      setSearchQuery("");
    }
  };

  // ── Nav click handler ──────────────────────────────────────────────────────
  const handleNavClick = (type: string) => {
    setSearchQuery(""); // clear search text when browsing by category
    setMobileMenuOpen(false);
    navigate(`/search?type=${type}&page=1`);
  };

  // ── Watchlist count — reads from localStorage directly ────────────────────
  // (Will be replaced by useContext(WatchlistContext) once provider is built)
  const getWatchlistCount = (): number => {
    try {
      const stored = localStorage.getItem("binge_watchlist");
      return stored ? (JSON.parse(stored) as unknown[]).length : 0;
    } catch {
      return 0;
    }
  };

  const watchlistCount = getWatchlistCount();

  return (
    <header className={`binge-header${scrolled ? " scrolled" : ""}`}>
      {/* ── Logo ── */}
      <button
        className="header-logo"
        onClick={() => navigate("/")}
        aria-label="Go to homepage"
      >
        BINGE
      </button>

      {/* ── Desktop Nav ── */}
      <nav
        className="header-nav"
        role="navigation"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map(({ label, type }) => (
          <button
            key={type}
            className={`nav-link${isSearchPage && currentType === type ? " active" : ""}`}
            onClick={() => handleNavClick(type)}
          >
            {label}
            {isSearchPage && currentType === type && (
              <span className="nav-link-indicator" aria-hidden="true" />
            )}
          </button>
        ))}
      </nav>

      {/* ── Header Actions ── */}
      <div className="header-actions">
        {/* Search bar */}
        <div className="header-search-bar" role="search">
          <svg
            className="search-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search movies, shows..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            aria-label="Search movies and shows"
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => {
                setSearchQuery("");
                navigate("/");
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Watchlist button */}
        <button
          className="watchlist-btn"
          onClick={() => navigate("/watchlist")}
          aria-label={`Watchlist, ${watchlistCount} items`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span className="watchlist-label">Watchlist</span>
          {watchlistCount > 0 && (
            <span className="watchlist-count" aria-hidden="true">
              {watchlistCount}
            </span>
          )}
        </button>

        {/* Mobile menu toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className={`hamburger${mobileMenuOpen ? " open" : ""}`} />
        </button>
      </div>

      {/* ── Mobile Dropdown Menu ── */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {NAV_ITEMS.map(({ label, type }) => (
            <button
              key={type}
              className={`mobile-nav-link${currentType === type ? " active" : ""}`}
              onClick={() => handleNavClick(type)}
            >
              {label}
            </button>
          ))}
          <button
            className="mobile-nav-link"
            onClick={() => {
              setMobileMenuOpen(false);
              navigate("/watchlist");
            }}
          >
            Watchlist {watchlistCount > 0 && `(${watchlistCount})`}
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
