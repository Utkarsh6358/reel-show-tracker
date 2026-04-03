import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { updateShowStatus, removeShow } from "../services/api";

function ShowCard({ show, refreshShows, userId, onCardClick }) {
  const [dynamicPoster, setDynamicPoster] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  
  const title = show.title || show.Title;
  const statusMenuOptions = ["Watching", "On-Hold", "Planning", "Completed", "Dropped"];
  const currentStatus = show.status || "Watching";

  // Handle missing poster
  const initialPosterUrl = show.poster || show.Poster;
  const posterUrl = dynamicPoster || initialPosterUrl;
  const hasPoster = posterUrl && posterUrl !== "N/A";

  useEffect(() => {
    // If we have no poster from the database, attempt to fetch it dynamically
    if (!initialPosterUrl || initialPosterUrl === "N/A") {
      const fetchPoster = async () => {
        try {
          const OMDB_KEY = process.env.REACT_APP_OMDB_KEY;
          const query = title;
          if (!query || !OMDB_KEY) return;
          
          const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data.Poster && data.Poster !== "N/A") {
            setDynamicPoster(data.Poster);
          }
        } catch (error) {
          console.error("Failed to fetch dynamic poster", error);
        }
      };
      
      fetchPoster();
    }
  }, [initialPosterUrl, title]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateShowStatus(title, newStatus, userId);
      setMenuOpen(false);
      if (refreshShows) refreshShows();
    } catch (e) {
      console.error('Failed to update status', e);
      alert('Failed to update status');
    }
  };

  const handleRemove = async () => {
    if(!window.confirm(`Are you sure you want to remove ${title}?`)) return;
    try {
      await removeShow(title, userId);
      setMenuOpen(false);
      if (refreshShows) refreshShows();
    } catch (e) {
      console.error('Failed to remove show', e);
      alert('Failed to remove show');
    }
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick({
        title: show.title || show.Title,
        overview: show.plot || show.Plot,
        poster_path: null,
        vote_average: parseFloat(show.rating || show.imdbRating) || null,
        release_date: null,
        first_air_date: null,
        backdrop_path: null,
        // Pass raw poster and plot for OMDb fallback
        poster: show.poster || show.Poster,
        plot: show.plot || show.Plot,
        rating: show.rating || show.imdbRating,
        genre: show.genre || show.Genre,
      });
    }
  };

  return (
    <div className="bg-[#181C25]/80 backdrop-blur-sm rounded-xl flex overflow-visible hover:bg-[#1C212B] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 shadow-lg border border-white/5 relative h-48 w-full group">
      
      {/* LEFT: Poster - clickable */}
      <div
        className="flex-none w-[130px] bg-black/50 rounded-l-xl overflow-hidden relative border-r border-white/5 cursor-pointer"
        onClick={handleCardClick}
      >
        {hasPoster ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://placehold.co/300x450/27272a/71717a?text=No+Poster';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-zinc-500 p-2 text-center uppercase tracking-wider font-semibold">
            No Poster
          </div>
        )}
      </div>

      {/* RIGHT: Details */}
      <div className="p-4 flex flex-col justify-between w-full h-full text-left overflow-hidden">
        <div className="flex justify-between items-start gap-3">
           <div className="flex-1 min-w-0 cursor-pointer" onClick={handleCardClick}>
             <h3 className="text-gray-50 font-bold text-[16px] leading-tight line-clamp-2 pr-1" title={title}>
               {title}
             </h3>
             <p className="text-[12px] text-gray-400 mt-1 line-clamp-1 font-medium italic">
                {show.genre || show.Genre || 'Unknown Genre'}
             </p>
           </div>
           
           {/* Dropdown Menu Container */}
           <div className="relative">
             <button
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 setMenuPos({
                   top: rect.bottom + 6,
                   right: window.innerWidth - rect.right,
                 });
                 setMenuOpen(!menuOpen);
               }}
               className="text-[11px] px-2 py-1 bg-[#23B151] hover:bg-[#1E9946] text-white rounded font-medium transition flex items-center gap-1 shadow-sm whitespace-nowrap"
             >
               {currentStatus} <span className="opacity-70 text-[8px] mt-px">▼</span>
             </button>
             
             {/* Portal dropdown — renders on document.body to escape transforms */}
             {menuOpen && ReactDOM.createPortal(
               <>
                 <div className="fixed inset-0 z-[200] cursor-default" onClick={() => setMenuOpen(false)} />
                 <div
                   className="fixed bg-[#161921] border border-[#2B3139] rounded-xl shadow-2xl py-1 w-44 flex flex-col text-sm text-gray-300 z-[201]"
                   style={{ top: menuPos.top, right: menuPos.right }}
                 >
                   {statusMenuOptions.map((statusOption) => (
                     <button
                       key={statusOption}
                       onClick={() => handleStatusChange(statusOption)}
                       className={`text-left px-4 py-2.5 text-[12px] hover:bg-[#1E222A] hover:text-white transition flex items-center ${currentStatus === statusOption ? 'text-white' : ''}`}
                     >
                       {currentStatus === statusOption && <span className="text-[#23B151] mr-2">✓</span>}
                       <span className={currentStatus !== statusOption ? "ml-4" : ""}>{statusOption}</span>
                     </button>
                   ))}
                   <div className="border-t border-[#2B3139] my-1" />
                   <button
                     onClick={handleRemove}
                     className="text-left px-4 py-2.5 text-[12px] hover:bg-red-500/10 text-red-400 hover:text-red-300 transition flex items-center gap-2"
                   >
                     <span>🗑</span> Remove Show
                   </button>
                 </div>
               </>,
               document.body
             )}
           </div>
        </div>

        <p className="text-[12px] text-gray-300 line-clamp-3 mt-3 leading-relaxed opacity-80">
           {show.plot || show.Plot || 'No description available'}
        </p>

        {/* Info */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
          <p className="text-amber-400 font-bold text-[12px] flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            {show.rating || show.imdbRating || 'N/A'}
          </p>
          <a href={show.reelLink} target="_blank" rel="noopener noreferrer" className="text-[#3DB4F2] hover:text-white transition font-medium text-[12px]">
            View Reel →
          </a>
        </div>
      </div>
    </div>
  );
}

export default ShowCard;