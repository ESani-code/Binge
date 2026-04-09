// src/pages/SearchResults.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "./styles/SearchResults.css";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Genre {
  id: number;
  name: string;
}

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: string;
  popularity: number;
}

interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface FilterState {
  genres: number[];
  sortBy: string;
  minRating: number;
  year: string;
}

type ContentType = "movie" | "tv" | "new" | "search";

// ─── Constants ───────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "release_date.desc", label: "Newest First" },
  { value: "release_date.asc", label: "Oldest First" },
  { value: "revenue.desc", label: "Top Box Office" },
  { value: "original_title.asc", label: "A–Z" },
] as const;

const YEARS = Array.from({ length: 35 }, (_, i) =>
  String(new Date().getFullYear() - i),
);

const TMDB_IMG = "https://image.tmdb.org/t/p";
const POSTER_SM = `${TMDB_IMG}/w342`;
const BACKDROP_SM = `${TMDB_IMG}/w780`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getDisplayTitle = (item: MediaItem): string =>
  item.title ?? item.name ?? "Untitled";

const getYear = (item: MediaItem): string => {
  const raw = item.release_date ?? item.first_air_date ?? "";
  return raw ? raw.split("-")[0] : "—";
};

const getMediaLabel = (item: MediaItem, contentType: ContentType): string => {
  if (contentType === "search") {
    return item.media_type === "tv" ? "TV" : "Film";
  }
  return contentType === "tv" ? "TV" : "Film";
};

// ─── Component ───────────────────────────────────────────────────────────────
const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── URL-driven state ──────────────────────────────────────────────────────
  const queryParam = searchParams.get("query") ?? "";
  const typeParam = (searchParams.get("type") ?? "movie") as ContentType;
  const pageParam = Number(searchParams.get("page") ?? "1");

  const contentType: ContentType = queryParam ? "search" : typeParam;

  // ── Local state ───────────────────────────────────────────────────────────
  const [results, setResults] = useState<MediaItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    sortBy: "popularity.desc",
    minRating: 0,
    year: "",
  });

  const abortRef = useRef<AbortController | null>(null);

  // ── API key ───────────────────────────────────────────────────────────────
  const apiKey = (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_TMDB_API_KEY;

  // ── Fetch genres ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiKey) return;

    const endpoint =
      contentType === "tv"
        ? `https://api.themoviedb.org/3/genre/tv/list?api_key=${apiKey}`
        : `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`;

    fetch(endpoint)
      .then((r) => r.json())
      .then((data: { genres: Genre[] }) => setAllGenres(data.genres ?? []))
      .catch(() => setAllGenres([]));
  }, [contentType, apiKey]);

  // ── Build fetch URL ───────────────────────────────────────────────────────
  const buildUrl = useCallback((): string => {
    if (!apiKey) return "";

    const base = "https://api.themoviedb.org/3";
    const shared = new URLSearchParams({
      api_key: apiKey,
      page: String(pageParam),
      language: "en-US",
    });

    if (contentType === "search") {
      shared.set("query", queryParam);
      shared.set("include_adult", "false");
      return `${base}/search/multi?${shared}`;
    }

    if (contentType === "new") {
      // Now playing movies + on-air TV merged (we'll do movies only for /new)
      return `${base}/movie/now_playing?${shared}`;
    }

    // Discover endpoint for movie / tv
    const discover = new URLSearchParams(shared);
    discover.set("sort_by", filters.sortBy);
    discover.set("include_adult", "false");
    discover.set("include_video", "false");
    discover.set("vote_count.gte", "50");

    if (filters.genres.length > 0) {
      discover.set("with_genres", filters.genres.join(","));
    }
    if (filters.minRating > 0) {
      discover.set("vote_average.gte", String(filters.minRating));
    }
    if (filters.year) {
      if (contentType === "movie") {
        discover.set("primary_release_year", filters.year);
      } else {
        discover.set("first_air_date_year", filters.year);
      }
    }

    return `${base}/discover/${contentType}?${discover}`;
  }, [apiKey, contentType, pageParam, queryParam, filters]);

  // ── Fetch results ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiKey) {
      setError("TMDB API key is missing. Add VITE_TMDB_API_KEY to your .env");
      setLoading(false);
      return;
    }

    const url = buildUrl();
    if (!url) return;

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    fetch(url, { signal: abortRef.current.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PaginatedResponse<MediaItem>>;
      })
      .then((data) => {
        // Filter out items with no poster or backdrop for a cleaner grid
        const filtered = (data.results ?? []).filter(
          (item) =>
            item.poster_path !== null &&
            // For search/multi, exclude 'person' results
            item.media_type !== "person",
        );
        setResults(filtered);
        setTotalPages(Math.min(data.total_pages ?? 0, 500)); // TMDB caps at 500
        setTotalResults(data.total_results ?? 0);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError("Failed to load content. Please try again.");
        setLoading(false);
      });

    return () => abortRef.current?.abort();
  }, [buildUrl, apiKey]);

  // ── Helpers: update URL params (keeps filters, resets page) ───────────────
  const goToPage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleGenre = (id: number) => {
    setFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(id)
        ? prev.genres.filter((g) => g !== id)
        : [...prev.genres, id],
    }));
    // Reset to page 1 when filter changes
    const next = new URLSearchParams(searchParams);
    next.set("page", "1");
    setSearchParams(next);
  };

  const clearFilters = () => {
    setFilters({
      genres: [],
      sortBy: "popularity.desc",
      minRating: 0,
      year: "",
    });
  };

  // ── Section title ─────────────────────────────────────────────────────────
  const getSectionTitle = (): string => {
    if (queryParam) return `Results for "${queryParam}"`;
    if (contentType === "movie") return "Movies";
    if (contentType === "tv") return "TV Shows";
    if (contentType === "new") return "New Releases";
    return "Browse";
  };

  // ── Bookmark toggle (persists to localStorage) ────────────────────────────
  const toggleBookmark = (item: MediaItem) => {
    try {
      const raw = localStorage.getItem("binge_watchlist");
      const list: MediaItem[] = raw ? JSON.parse(raw) : [];
      const exists = list.some((m) => m.id === item.id);
      const updated = exists
        ? list.filter((m) => m.id !== item.id)
        : [...list, item];
      localStorage.setItem("binge_watchlist", JSON.stringify(updated));
      // Force re-render so bookmark icon updates
      setResults((prev) => [...prev]);
    } catch {
      /* noop */
    }
  };

  const isBookmarked = (id: number): boolean => {
    try {
      const raw = localStorage.getItem("binge_watchlist");
      const list: MediaItem[] = raw ? JSON.parse(raw) : [];
      return list.some((m) => m.id === id);
    } catch {
      return false;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="search-page">
      {/* ── Page Header ── */}
      <div className="search-page-header">
        <div className="search-page-header-inner">
          <h1 className="search-page-title">{getSectionTitle()}</h1>
          {totalResults > 0 && !loading && (
            <span className="search-result-count">
              {totalResults.toLocaleString()} results
            </span>
          )}
        </div>

        {/* Mobile sidebar toggle */}
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? "Close filters" : "Open filters"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="14" y2="12" />
            <line x1="4" y1="18" x2="10" y2="18" />
          </svg>
          {sidebarOpen ? "Hide Filters" : "Filters"}
        </button>
      </div>

      {/* ── Main Layout ── */}
      <div className={`search-layout${sidebarOpen ? " sidebar-visible" : ""}`}>
        {/* ════ FILTER SIDEBAR ════ */}
        <aside
          className={`filter-sidebar${sidebarOpen ? " open" : ""}`}
          aria-label="Filter options"
        >
          <div className="sidebar-header">
            <span className="sidebar-title">Filters</span>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear all
            </button>
          </div>

          {/* ── Sort By ── */}
          {contentType !== "search" && contentType !== "new" && (
            <div className="filter-group">
              <h3 className="filter-group-label">Sort by</h3>
              <div className="sort-options">
                {SORT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`sort-option${filters.sortBy === value ? " active" : ""}`}
                    onClick={() => setFilters((f) => ({ ...f, sortBy: value }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Genres ── */}
          {allGenres.length > 0 && (
            <div className="filter-group">
              <h3 className="filter-group-label">Genre</h3>
              <div className="genre-pill-grid">
                {allGenres.map((genre) => (
                  <button
                    key={genre.id}
                    className={`genre-filter-pill${filters.genres.includes(genre.id) ? " active" : ""}`}
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Min Rating ── */}
          <div className="filter-group">
            <h3 className="filter-group-label">
              Min Rating
              <span className="filter-value-badge">
                {filters.minRating > 0 ? `${filters.minRating}+` : "Any"}
              </span>
            </h3>
            <div className="rating-slider-wrapper">
              <input
                type="range"
                min={0}
                max={9}
                step={1}
                value={filters.minRating}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minRating: Number(e.target.value),
                  }))
                }
                className="rating-slider"
                aria-label="Minimum rating"
              />
              <div className="rating-slider-labels">
                <span>Any</span>
                <span>9+</span>
              </div>
            </div>
          </div>

          {/* ── Year ── */}
          {contentType !== "search" && (
            <div className="filter-group">
              <h3 className="filter-group-label">Release Year</h3>
              <select
                className="year-select"
                value={filters.year}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, year: e.target.value }))
                }
                aria-label="Filter by release year"
              >
                <option value="">Any year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Content Type Switcher (only when browsing, not searching) ── */}
          {!queryParam && (
            <div className="filter-group">
              <h3 className="filter-group-label">Content Type</h3>
              <div className="content-type-switcher">
                <button
                  className={`type-btn${contentType === "movie" || contentType === "new" ? " active" : ""}`}
                  onClick={() => navigate("/search?type=movie&page=1")}
                >
                  Movies
                </button>
                <button
                  className={`type-btn${contentType === "tv" ? " active" : ""}`}
                  onClick={() => navigate("/search?type=tv&page=1")}
                >
                  TV Shows
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* ════ RESULTS AREA ════ */}
        <main
          className="results-area"
          aria-label="Search results"
          aria-live="polite"
        >
          {/* ── Error State ── */}
          {error && (
            <div className="state-message error-state">
              <span className="state-icon">⚠</span>
              <p>{error}</p>
            </div>
          )}

          {/* ── Loading Skeletons ── */}
          {loading && !error && (
            <div className="results-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="result-card skeleton-card">
                  <div className="card-poster-area skeleton" />
                  <div className="card-body">
                    <div className="skeleton skeleton-line long" />
                    <div className="skeleton skeleton-line short" />
                    <div className="skeleton skeleton-line medium" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Empty State ── */}
          {!loading && !error && results.length === 0 && (
            <div className="state-message empty-state">
              <span className="state-icon">🎬</span>
              <h2>No results found</h2>
              {queryParam && (
                <p>
                  Nothing matched "<strong>{queryParam}</strong>". Try a
                  different term or adjust your filters.
                </p>
              )}
              {!queryParam && (
                <p>
                  Try adjusting your filters or selecting a different category.
                </p>
              )}
              <button className="btn btn-ghost" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}

          {/* ── Results Grid ── */}
          {!loading && !error && results.length > 0 && (
            <>
              <div className="results-grid">
                {results.map((item) => {
                  const title = getDisplayTitle(item);
                  const year = getYear(item);
                  const label = getMediaLabel(item, contentType);
                  const rating = item.vote_average.toFixed(1);
                  const bookmarked = isBookmarked(item.id);
                  const itemType = item.media_type === "tv" ? "tv" : "movie";
                  const itemPath = `/movie/${item.id}`;

                  const posterUrl = item.poster_path
                    ? `${POSTER_SM}${item.poster_path}`
                    : null;
                  const backdropUrl = item.backdrop_path
                    ? `${BACKDROP_SM}${item.backdrop_path}`
                    : null;

                  const genres = item.genre_ids
                    .slice(0, 2)
                    .map((gid) => allGenres.find((g) => g.id === gid)?.name)
                    .filter(Boolean) as string[];

                  return (
                    <article
                      key={`${itemType}-${item.id}`}
                      className="result-card glass-card"
                      aria-label={title}
                    >
                      {/* ── Poster ── */}
                      <div className="card-poster-area">
                        {posterUrl ? (
                          <img
                            src={posterUrl}
                            alt={`${title} poster`}
                            className="card-poster-img"
                            loading="lazy"
                          />
                        ) : backdropUrl ? (
                          <img
                            src={backdropUrl}
                            alt={`${title} backdrop`}
                            className="card-poster-img card-poster-backdrop"
                            loading="lazy"
                          />
                        ) : (
                          <div className="card-poster-placeholder">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              opacity="0.3"
                            >
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <path d="M8 21h8M12 17v4" />
                            </svg>
                          </div>
                        )}

                        {/* Poster overlay on hover */}
                        <div className="card-poster-overlay">
                          <Link
                            to={itemPath}
                            className="card-play-btn"
                            aria-label={`View details for ${title}`}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </Link>
                        </div>

                        {/* Rating badge — top left */}
                        <div
                          className={`card-rating-badge${Number(rating) >= 7.5 ? " high" : Number(rating) >= 6 ? " mid" : " low"}`}
                          aria-label={`Rating: ${rating}`}
                        >
                          ★ {rating}
                        </div>

                        {/* Bookmark — top right */}
                        <button
                          className={`card-bookmark-btn${bookmarked ? " bookmarked" : ""}`}
                          onClick={() => toggleBookmark(item)}
                          aria-label={
                            bookmarked
                              ? "Remove from watchlist"
                              : "Add to watchlist"
                          }
                          aria-pressed={bookmarked}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill={bookmarked ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                      </div>

                      {/* ── Card Body ── */}
                      <div className="card-body">
                        <div className="card-meta-row">
                          <span className="card-type-label">{label}</span>
                          <span className="card-year">{year}</span>
                        </div>

                        <h2 className="card-title">
                          <Link to={itemPath}>{title}</Link>
                        </h2>

                        {genres.length > 0 && (
                          <div className="card-genres">
                            {genres.map((g) => (
                              <span key={g} className="card-genre-tag">
                                {g}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="card-overview">
                          {item.overview || "No overview available."}
                        </p>

                        <Link to={itemPath} className="card-details-link">
                          View Details →
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <nav className="pagination" aria-label="Page navigation">
                  <button
                    className="pagination-btn"
                    onClick={() => goToPage(pageParam - 1)}
                    disabled={pageParam <= 1}
                    aria-label="Previous page"
                  >
                    ← Prev
                  </button>

                  <div className="pagination-pages">
                    {/* Show smart page window */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (pageParam <= 3) {
                        page = i + 1;
                      } else if (pageParam >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = pageParam - 2 + i;
                      }
                      return (
                        <button
                          key={page}
                          className={`pagination-page${page === pageParam ? " active" : ""}`}
                          onClick={() => goToPage(page)}
                          aria-label={`Page ${page}`}
                          aria-current={page === pageParam ? "page" : undefined}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={() => goToPage(pageParam + 1)}
                    disabled={pageParam >= totalPages}
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResults;
