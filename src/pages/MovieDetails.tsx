import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./styles/MovieDetails.css";

// The summary data passed from the Link state
interface PreloadedMedia {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type?: string;
}

// The full data returned from the individual movie/tv API endpoint
interface FullMediaDetails extends PreloadedMedia {
  runtime?: number;
  episode_run_time?: number[];
  genres: { id: number; name: string }[];
  status: string;
  tagline: string;
}

const TMDB_IMG_BASE = "https://image.tmdb.org/t/p";
const BACKDROP_SIZE = "/original";
const POSTER_SIZE = "/w500";

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Grab the instant data passed from the previous page's <Link state={...}>
  const preloadedData = location.state?.preloadedData as
    | PreloadedMedia
    | undefined;

  // 2. State to hold the full details once they finish fetching
  const [fullDetails, setFullDetails] = useState<FullMediaDetails | null>(null);
  const [loading, setLoading] = useState(!preloadedData); // Only load if no preloaded data

  useEffect(() => {
    // If the user navigates directly to /movie/123 via URL, we won't have preloaded data.
    // We also want to fetch full details (like runtime & tagline) even if we do have preloaded data.
    const fetchFullDetails = async () => {
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        // Note: For a real app, you might check if it's a TV show or Movie. Defaulting to movie here.
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`,
        );

        if (!response.ok) throw new Error("Failed to fetch details");

        const data = await response.json();
        setFullDetails(data);
      } catch (error) {
        console.error("Error fetching full details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFullDetails();
  }, [id]);

  // Use full details if available, otherwise fallback to the instant preloaded data
  const displayData = fullDetails || preloadedData;

  if (loading) {
    return <div className="details-loading">Loading movie details...</div>;
  }

  if (!displayData) {
    return (
      <div className="details-error">
        <h2>Movie not found.</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const title = displayData.title || displayData.name;
  const year = (
    displayData.release_date ||
    displayData.first_air_date ||
    ""
  ).split("-")[0];
  const backdropUrl = displayData.backdrop_path
    ? `${TMDB_IMG_BASE}${BACKDROP_SIZE}${displayData.backdrop_path}`
    : "";
  const posterUrl = displayData.poster_path
    ? `${TMDB_IMG_BASE}${POSTER_SIZE}${displayData.poster_path}`
    : "";

  return (
    <div className="movie-details-container">
      {/* ── Background Hero Image ── */}
      <div
        className="details-hero-backdrop"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      >
        <div className="hero-overlay-gradient"></div>
      </div>

      {/* ── Main Content ── */}
      <div className="details-content">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="details-grid">
          {/* Poster Column */}
          <div className="details-poster-col">
            {posterUrl ? (
              <img src={posterUrl} alt={title} className="details-poster" />
            ) : (
              <div className="details-poster-placeholder">No Poster</div>
            )}
          </div>

          {/* Info Column */}
          <div className="details-info-col">
            <h1 className="details-title">
              {title} <span className="details-year">({year})</span>
            </h1>

            {/* Tagline (Only exists in fullDetails) */}
            {fullDetails?.tagline && (
              <h3 className="details-tagline">"{fullDetails.tagline}"</h3>
            )}

            <div className="details-meta">
              <span className="meta-rating">
                ★ {displayData.vote_average.toFixed(1)}
              </span>

              {/* Runtime (Only exists in fullDetails) */}
              {fullDetails?.runtime ? (
                <span className="meta-runtime">{fullDetails.runtime} min</span>
              ) : null}
            </div>

            {/* Genres (Only exists in fullDetails) */}
            {fullDetails?.genres && (
              <div className="details-genres">
                {fullDetails.genres.map((g) => (
                  <span key={g.id} className="genre-pill">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <div className="details-overview-section">
              <h2>Overview</h2>
              <p className="details-overview-text">{displayData.overview}</p>
            </div>

            {/* You can later add <Outlet /> here for Nested Routes (Cast, Reviews, etc.) */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
