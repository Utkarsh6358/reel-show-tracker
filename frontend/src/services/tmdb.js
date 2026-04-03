const TMDB_KEY = process.env.REACT_APP_TMDB_KEY;
const BASE = "https://api.themoviedb.org/3";

const get = async (path) => {
  const res = await fetch(`${BASE}${path}?api_key=${TMDB_KEY}&language=en-US`);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
};

export const IMG = (path, size = "w342") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

export const fetchTrending = () => get("/trending/all/week");

export const fetchPopularMovies = () => get("/movie/popular");
export const fetchPopularSeries = () => get("/tv/popular");

export const fetchTopRatedMovies = () => get("/movie/top_rated");
export const fetchTopRatedSeries = () => get("/tv/top_rated");

export const fetchMovieDetails = (id) => get(`/movie/${id}`);
export const fetchSeriesDetails = (id) => get(`/tv/${id}`);

export const fetchDetails = (id, mediaType) =>
  mediaType === "movie" ? fetchMovieDetails(id) : fetchSeriesDetails(id);
