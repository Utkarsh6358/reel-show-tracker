import { useState, useEffect, useCallback } from "react";
import { fetchDetails, IMG } from "../services/tmdb";
import { saveShowDirect } from "../services/api";

export default function ShowDetailModal({ show, onClose, userId }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle"); // idle | loading | saved | exists | error

  // show can come from TMDB (has .id, .media_type) or from our DB (has .title, .plot)
  const title = show.title || show.name || show.original_name || "";
  const year = (show.release_date || show.first_air_date || "").slice(0, 4);
  const backdropUrl = show.backdrop_path
    ? IMG(show.backdrop_path, "w1280")
    : null;
  const posterUrl = show.poster_path
    ? IMG(show.poster_path, "w342")
    : show.poster || null;

  const loadDetails = useCallback(async () => {
    try {
      if (show.id && show.media_type) {
        const data = await fetchDetails(show.id, show.media_type);
        setDetails(data);
      } else {
        // Fallback: use OMDb for DB-sourced shows
        const key = process.env.REACT_APP_OMDB_KEY;
        const q = title;
        if (key && q) {
          const res = await fetch(
            `https://www.omdbapi.com/?apikey=${key}&t=${encodeURIComponent(q)}&plot=full`
          );
          const d = await res.json();
          if (d.Response === "True") setDetails({ omdb: true, ...d });
        }
      }
    } catch (e) {
      console.error("Could not load details", e);
    } finally {
      setLoading(false);
    }
  }, [show, title]);

  useEffect(() => {
    loadDetails();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [loadDetails]);

  const plot = details?.omdb
    ? details.Plot
    : details?.overview || show.plot || show.overview || "No description available.";

  const rating = details?.omdb
    ? details.imdbRating
    : details?.vote_average?.toFixed(1) || show.rating || "N/A";

  const genres = details?.omdb
    ? (details.Genre || "").split(", ")
    : (details?.genres || []).map((g) => g.name);

  const runtime = details?.omdb
    ? details.Runtime
    : details?.runtime
      ? `${details.runtime} min`
      : details?.episode_run_time?.[0]
        ? `${details.episode_run_time[0]} min / ep`
        : "";

  const seasons = details?.number_of_seasons;

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " trailer scene clip")}`;
  const instagramUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(title.replace(/\s+/g, '').toLowerCase())}`;
  const streamExUrl = `https://streamex.sh/search?query=${encodeURIComponent(title.toLowerCase())}`;
  const animeKaiUrl = `https://animekai.to/browser?keyword=${encodeURIComponent(title)}`;

  const handleAddToWatchlist = async () => {
    if (!userId) return;
    setSaveState("loading");
    try {
      await saveShowDirect(title, userId);
      setSaveState("saved");
    } catch (e) {
      if (e.message?.includes("Already")) setSaveState("exists");
      else setSaveState("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative z-10 bg-[#13161e] w-full md:max-w-3xl max-h-[92vh] md:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero backdrop */}
        <div className="relative h-52 md:h-72 shrink-0 overflow-hidden">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900/40 to-purple-900/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#13161e] via-[#13161e]/40 to-transparent" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/80 transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 md:px-7 pb-8">
          <div className="flex gap-4 -mt-16 mb-5">
            {/* Poster */}
            {posterUrl && (
              <div className="w-24 md:w-28 shrink-0 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10">
                <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex flex-col justify-end pt-16 min-w-0">
              <h2 className="text-2xl font-extrabold text-white leading-tight">{title}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {year && <span className="text-gray-400 text-sm">{year}</span>}
                {runtime && <span className="text-gray-400 text-sm">• {runtime}</span>}
                {seasons && <span className="text-gray-400 text-sm">• {seasons} Seasons</span>}
                <span className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {rating}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Add to Watchlist */}
            {userId && (
              <button
                onClick={handleAddToWatchlist}
                disabled={saveState === "loading" || saveState === "saved" || saveState === "exists"}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border ${saveState === "saved" ? "bg-green-600/30 border-green-500/50 text-green-400" :
                    saveState === "exists" ? "bg-white/5 border-white/10 text-gray-400 cursor-default" :
                      saveState === "error" ? "bg-red-500/20 border-red-500/30 text-red-400" :
                        "bg-blue-600/20 hover:bg-blue-600/40 border-blue-500/30 text-blue-400 hover:text-blue-300"
                  }`}
              >
                {saveState === "loading" && <span className="animate-spin">⏳</span>}
                {saveState === "saved" && "✅"}
                {saveState === "exists" && "✓"}
                {saveState === "error" && "❌"}
                {saveState === "idle" && "＋"}
                {saveState === "saved" ? "Added to Watchlist!" :
                  saveState === "exists" ? "Already in Watchlist" :
                    saveState === "error" ? "Failed, try again" :
                      saveState === "loading" ? "Saving..." : "Add to Watchlist"}
              </button>
            )}

            {/* Watch on StreamEx */}
            <a
              href={streamExUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/40 hover:to-teal-600/40 border-emerald-500/30 text-emerald-300 hover:text-emerald-200 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch on StreamEx
            </a>

            {/* Watch on AnimeKai */}
            <a
              href={animeKaiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border bg-gradient-to-r from-orange-600/20 to-red-600/20 hover:from-orange-600/40 hover:to-red-600/40 border-orange-500/30 text-orange-300 hover:text-orange-200 transition-all duration-200"
            >
              <span className="text-lg">⛩</span>
              Watch on AnimeKai
            </a>

            {/* Instagram Explore */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border bg-gradient-to-r from-pink-600/20 to-purple-600/20 hover:from-pink-600/40 hover:to-purple-600/40 border-pink-500/30 text-pink-300 hover:text-pink-200 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram Explore
            </a>
          </div>

          {/* Genre chips */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {genres.map((g) => (
                <span key={g} className="px-3 py-1 text-xs rounded-full bg-white/10 text-gray-300 border border-white/10">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Plot */}
          {loading ? (
            <div className="h-4 bg-white/10 rounded animate-pulse mb-2 w-full" />
          ) : (
            <p className="text-gray-300 leading-relaxed text-sm mb-7">{plot}</p>
          )}

          {/* Recommended Reels */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-white font-bold text-lg mb-4">🎬 Recommended Reels</h3>
            <p className="text-gray-400 text-sm mb-4">
              Watch clips, trailers and fan reels for <span className="text-white font-semibold">{title}</span> on YouTube:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "🎬 Official Trailer", q: `${title} official trailer` },
                { label: "🎞 Scene Clips", q: `${title} best scenes` },
                { label: "📌 Fan Edits", q: `${title} fan edit reel` },
                { label: "📺 Full Episodes", q: `${title} full episode` },
                { label: "🌟 Cast Interviews", q: `${title} cast interview` },
                { label: "💬 Reviews", q: `${title} review` },
              ].map(({ label, q }) => (
                <a
                  key={label}
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-200 group"
                >
                  <span className="text-red-500 text-lg">▶</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded-xl text-red-400 hover:text-red-300 font-semibold transition-all duration-200 text-sm"
            >
              🔍 Search all reels on YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
