import { useState } from "react";
import "./styles/TrendingContent.css"; // Ensure this path is correct for your setup

// Strict typing for the data we need from the API
export interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type?: string;
  genre_ids?: number[];
}

interface TrendingContentProps {
  trendingMovies: Movie[];
}

// TMDB uses ID numbers for genres. Here is a quick map of the most popular ones!
const GENRE_MAP: Record<string, number> = {
  Action: 28,
  Comedy: 35,
  Drama: 18,
  "Sci-Fi": 878,
  Animation: 16,
};

const TrendingContent = ({ trendingMovies }: TrendingContentProps) => {
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = [
    "All",
    "Movies",
    "TV Shows",
    "Action",
    "Comedy",
    "Drama",
    "Sci-Fi",
    "Animation",
  ];

  // Filter the raw API data based on the selected pill
  const filteredMovies = trendingMovies.filter((movie) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Movies") return movie.media_type === "movie";
    if (activeFilter === "TV Shows") return movie.media_type === "tv";

    // If it's a specific genre, check if the movie's genre_ids array includes our mapped ID
    const genreId = GENRE_MAP[activeFilter];
    if (genreId && movie.genre_ids) {
      return movie.genre_ids.includes(genreId);
    }

    return true;
  });

  return (
    <section className="section trending-section">
      <div className="section-header">
        <h2 className="section-title">
          Trending <span>Today</span>
        </h2>
      </div>

      {/* Filter Pills */}
      <div className="scroll-row filters-row">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`genre-pill ${activeFilter === filter ? "active" : ""}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Movie Cards */}
      <div className="scroll-row cards-row">
        {filteredMovies.map((movie) => {
          // Safely extract properties depending on if it's a movie or series
          const displayTitle = movie.title || movie.name || "Unknown";
          const dateString = movie.release_date || movie.first_air_date;
          const year = dateString ? dateString.split("-")[0] : "N/A";
          const posterUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : ""; // Fallback background color handles missing posters

          return (
            <div key={movie.id} className="movie-card">
              <div
                className="card-image"
                style={{ backgroundImage: `url(${posterUrl})` }}
              >
                <div className="rating">
                  <i className="bi bi-star-fill rating-star"></i>{" "}
                  {movie.vote_average?.toFixed(1)}
                </div>
                <button
                  className="card-bookmark"
                  aria-label="Save to watchlist"
                >
                  <i className="bi bi-bookmark"></i>
                </button>
              </div>

              <div className="card-content">
                <h3 className="card-title" title={displayTitle}>
                  {displayTitle}
                </h3>
                <div className="card-meta">
                  <span>{year}</span>
                  <span>•</span>
                  <span style={{ textTransform: "capitalize" }}>
                    {movie.media_type || "Movie"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMovies.length === 0 && (
          <p style={{ color: "var(--color-text-tertiary)", marginTop: "1rem" }}>
            No titles found for this filter.
          </p>
        )}
      </div>
    </section>
  );
};

export default TrendingContent;
