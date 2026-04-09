import { useEffect, useState } from "react";
import "./styles/HomeView.css";

interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
}

const HomeView = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        //Fetching Movie data from TMDB API
        const response = await fetch(
          `https://api.themoviedb.org/3/trending/all/day?api_key=${apiKey}`,
        );
        const data = await response.json();

        setTrendingMovies(data.results);

        if (data.results && data.results.lenght > 0) {
          setFeaturedMovie(data.results[0]);
        }

        setLoading(false);
      } catch (error) {
        // console.error("Error fetching trending data:", error);
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

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

  // Extract just the year from the YYYY-MM-DD release_date string
  const releaseYear = featuredMovie.release_date?.split("-")[0];

  return (
    <>
      <section className="hero">
        {/* Background with the actual movie backdrop */}
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        ></div>

        {/* Dark gradient overlays to make text readable */}
        <div className="hero-backdrop"></div>

        <div className="hero-content">
          <div className="hero-badge animate-in">
            <span>🔥</span> Trending Today
          </div>

          <h1 className="hero-title animate-in delay-1">
            {featuredMovie.title.toUpperCase()}
          </h1>

          <div className="hero-meta animate-in delay-2">
            <span>
              <span className="rating-star">★</span>{" "}
              {featuredMovie.vote_average.toFixed(1)}
            </span>
            <span>{releaseYear}</span>
          </div>

          <p className="hero-desc animate-in delay-2">
            {featuredMovie.overview}
          </p>

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
    </>
  );
};

export default HomeView;
