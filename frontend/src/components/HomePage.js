import { useState, useEffect } from "react";
import {
  fetchTrending,
  fetchPopularMovies,
  fetchPopularSeries,
  fetchTopRatedMovies,
  fetchTopRatedSeries,
  fetchSearchResults,
  IMG,
} from "../services/tmdb";
import ShowDetailModal from "./ShowDetailModal";

function PosterCard({ item, onClick }) {
  const title = item.title || item.name || item.original_name;
  const rating = item.vote_average?.toFixed(1);
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const posterUrl = item.poster_path ? IMG(item.poster_path) : null;
  const badge = item.media_type === "tv" ? "Series" : item.media_type === "movie" ? "Movie" : "";

  return (
    <div
      onClick={() => onClick(item)}
      className="flex-none w-36 cursor-pointer group"
    >
      <div className="relative rounded-xl overflow-hidden aspect-[2/3] bg-white/5 border border-white/10 group-hover:border-purple-500/50 transition-all duration-300 shadow-lg group-hover:shadow-purple-500/20 group-hover:-translate-y-1">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs text-center p-2">
            No Poster
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <p className="text-white font-semibold text-xs leading-tight line-clamp-2">{title}</p>
          {rating && (
            <p className="text-amber-400 text-xs font-bold mt-1">⭐ {rating}</p>
          )}
        </div>
        {/* Badge */}
        {badge && (
          <div className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badge === "Movie" ? "bg-blue-600/90" : "bg-purple-600/90"} text-white`}>
            {badge}
          </div>
        )}
      </div>
      <p className="text-gray-300 text-xs mt-2 line-clamp-1 font-medium">{title}</p>
      {year && <p className="text-gray-500 text-[11px]">{year}</p>}
    </div>
  );
}

function ScrollRow({ title, emoji, items, onCardClick, loading }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h2>
      {loading ? (
        <div className="flex gap-4 overflow-x-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-none w-36 aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {items.map((item) => (
            <PosterCard key={`${item.id}-${item.media_type}`} item={item} onClick={onCardClick} />
          ))}
        </div>
      )}
    </div>
  );
}

function Top10Card({ item, index, onClick }) {
  const title = item.title || item.name || item.original_name;
  const posterUrl = item.poster_path ? IMG(item.poster_path) : null;

  return (
    <div
      onClick={() => onClick(item)}
      className="flex-none w-40 md:w-56 h-48 md:h-72 relative cursor-pointer group flex items-end ml-4 md:ml-6 shrink-0"
    >
      {/* Giant Hollow Number */}
      <div 
        className="absolute -left-6 md:-left-8 -bottom-4 md:-bottom-6 text-[100px] md:text-[140px] font-black leading-none select-none text-black group-hover:-translate-y-2 transition-transform duration-300 z-0 tracking-tighter"
        style={{ WebkitTextStroke: "3px rgba(255,255,255,0.8)" }}
      >
        {index + 1}
      </div>
      
      {/* Poster */}
      <div className="relative w-2/3 md:w-3/4 h-[85%] rounded-xl overflow-hidden shadow-2xl z-10 group-hover:scale-105 group-hover:shadow-purple-500/30 transition-all duration-300 bg-zinc-900 border border-white/10 ml-auto">
        {posterUrl ? (
          <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs text-center p-2">No Poster</div>
        )}
      </div>
    </div>
  );
}

function Top10Row({ items, onCardClick, loading }) {
  if (!items.length && !loading) return null;
  const top10 = items.slice(0, 10);

  return (
    <div className="mb-14 mt-4">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2 px-1">
        <span>🏆</span> Top 10 Trending Today
      </h2>
      {loading ? (
        <div className="flex gap-4 md:gap-8 overflow-x-hidden pt-4 pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-none w-40 md:w-56 h-48 md:h-72 bg-white/5 rounded-xl animate-pulse ml-8" />
          ))}
        </div>
      ) : (
        <div className="flex gap-1 md:gap-2 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent pt-8 pl-4 items-end">
          {top10.map((item, index) => (
            <Top10Card key={`${item.id}-top10`} item={item} index={index} onClick={onCardClick} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage({ userId }) {
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShow, setSelectedShow] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all"); // all | movie | tv

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = window.useRef ? window.useRef(null) : { current: null };

  useEffect(() => {
    const load = async () => {
      try {
        const [trendRes, popMovRes, popTvRes, topMovRes, topTvRes] = await Promise.all([
          fetchTrending(),
          fetchPopularMovies(),
          fetchPopularSeries(),
          fetchTopRatedMovies(),
          fetchTopRatedSeries(),
        ]);

        setTrending(
          (trendRes.results || []).map((r) => ({ ...r, media_type: r.media_type || "movie" }))
        );
        setPopular([
          ...(popMovRes.results || []).map((r) => ({ ...r, media_type: "movie" })),
          ...(popTvRes.results || []).map((r) => ({ ...r, media_type: "tv" })),
        ].sort((a, b) => b.popularity - a.popularity));
        setTopRated([
          ...(topMovRes.results || []).map((r) => ({ ...r, media_type: "movie" })),
          ...(topTvRes.results || []).map((r) => ({ ...r, media_type: "tv" })),
        ].sort((a, b) => b.vote_average - a.vote_average));
      } catch (e) {
        console.error("TMDB fetch failed:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetchSearchResults(query);
        // Filter out people, only keep movie/tv
        const filtered = (res.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
        setSearchResults(filtered);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const filterItems = (items) => {
    if (typeFilter === "all") return items;
    return items.filter((i) => i.media_type === typeFilter);
  };

  const featuredItem = trending[0];
  const featuredBg = featuredItem?.backdrop_path ? IMG(featuredItem.backdrop_path, "original") : null;
  const featuredTitle = featuredItem?.title || featuredItem?.name || "";
  const featuredRating = featuredItem?.vote_average?.toFixed(1);
  const featuredOverview = featuredItem?.overview || "";

  return (
    <div>
      {/* Hero Banner */}
      {featuredItem && (
        <div
          className="relative rounded-2xl overflow-hidden mb-10 h-72 md:h-96 cursor-pointer group"
          onClick={() => setSelectedShow(featuredItem)}
        >
          {featuredBg ? (
            <img src={featuredBg} alt={featuredTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-8">
            <span className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-2">🔥 Trending #1 This Week</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-3 max-w-xl leading-tight">{featuredTitle}</h2>
            <p className="text-gray-300 text-sm max-w-md line-clamp-2 mb-4">{featuredOverview}</p>
            <div className="flex items-center gap-4">
              {featuredRating && (
                <span className="flex items-center gap-1 text-amber-400 font-bold">⭐ {featuredRating}</span>
              )}
              <button className="px-5 py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-100 transition">
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
        {/* Type Filter */}
        <div className="flex gap-3">
          {["all", "movie", "tv"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                typeFilter === t
                  ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "border-white/20 text-gray-400 hover:border-white/40 hover:text-gray-200"
              }`}
            >
              {t === "all" ? "All" : t === "movie" ? "Movies" : "Series"}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search TMDB..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-white/5 border border-white/10 focus:border-purple-500 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:bg-white/10"
          />
          <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>
      </div>

      {/* Search Results Row */}
      {searchQuery.trim() && (
        <ScrollRow 
          title={`Search Results for "${searchQuery}"`} 
          emoji="🔎" 
          items={filterItems(searchResults)} 
          onCardClick={setSelectedShow} 
          loading={isSearching} 
        />
      )}

      {/* Scroll Rows (Only show if not searching or if user still wants to see them. Let's show them always below search) */}
      <Top10Row items={filterItems(trending)} onCardClick={setSelectedShow} loading={loading} />
      
      <ScrollRow title="Most Popular" emoji="👁" items={filterItems(popular)} onCardClick={setSelectedShow} loading={loading} />
      <ScrollRow title="Top Rated All Time" emoji="⭐" items={filterItems(topRated)} onCardClick={setSelectedShow} loading={loading} />

      {/* Show Detail Modal */}
      {selectedShow && (
        <ShowDetailModal show={selectedShow} onClose={() => setSelectedShow(null)} userId={userId} />
      )}
    </div>
  );
}
