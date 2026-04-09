// src/components/Hero.tsx
import "./styles/Hero.css";

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
}

interface HeroProps {
  featuredMovie: Movie | null;
  loading: boolean;
}

const Hero = ({ featuredMovie, loading }: HeroProps) => {
  if (loading) {
    return <div className="hero loading">Loading cinematic experience...</div>;
  }

  if (!featuredMovie) {
    return <div className="hero error">Failed to load trending movie.</div>;
  }

  // TMDB Base URL for high-res backdrop images
  const backdropUrl = featuredMovie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`
    : "";

  // Extract the year from either release_date (movie) or first_air_date (TV show)
  const dateString = featuredMovie.release_date || featuredMovie.first_air_date;
  const releaseYear = dateString ? dateString.split("-")[0] : "";

  // Safely grab the title or name
  const displayTitle = featuredMovie.title || featuredMovie.name || "";

  return (
    <section className="hero">
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      ></div>

      <div className="hero-backdrop"></div>

      <div className="hero-content">
        <div className="hero-badge animate-in">
          <span>🔥</span> Trending Today
        </div>

        <h1 className="hero-title animate-in delay-1">
          {displayTitle.toUpperCase()}
        </h1>

        <div className="hero-meta animate-in delay-2">
          <span>
            <span className="rating-star">★</span>{" "}
            {featuredMovie.vote_average.toFixed(1)}
          </span>
          <span>{releaseYear}</span>
        </div>

        <p className="hero-desc animate-in delay-2">{featuredMovie.overview}</p>

        <div className="hero-actions animate-in delay-3">
          <button className="btn-primary">
            <i className="bi bi-play-fill"></i> Watch Trailer
          </button>
          <button className="btn-ghost">
            <i className="bi bi-plus"></i> Add to Watchlist
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
