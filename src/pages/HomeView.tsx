import { useEffect, useState } from "react";
import Hero from "../components/Hero.tsx";
import TrendingContent from "../components/TrendingContent.tsx";
import "./styles/HomeView.css";

interface Movie {
  id: number;
  title: string;
  name: string;
  overview: string;
  backdrop_path: string | null;
  release_date: string;
  first_air_date: string;
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

        if (data.results && data.results.length > 0) {
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

  return (
    <>
      <Hero featuredMovie={featuredMovie} loading={loading} />
      <TrendingContent trendingMovies={trendingMovies} />
    </>
  );
};

export default HomeView;
