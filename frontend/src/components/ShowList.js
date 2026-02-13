import { useState } from "react";
import { confirmShow, rejectShow } from "../services/api";

const OMDB_KEY = process.env.REACT_APP_OMDB_KEY;

function ShowList({ shows, refreshShows }) {
  const [selected, setSelected] = useState({});
  const [searchResults, setSearchResults] = useState({});
  const [searchTerms, setSearchTerms] = useState({});

  const searchOMDb = async (query, id) => {
    if (!query) return;
    
    setSearchTerms(prev => ({ ...prev, [id]: query }));

    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    if (data.Search) {
      setSearchResults(prev => ({
        ...prev,
        [id]: data.Search
      }));
    }
  };

  const handleConfirm = async (show) => {
    const movie = selected[show.id];
    if (!movie) return alert("Please search and select a movie first");
    
    try {
      await confirmShow(show.id, movie.Title, show.reelLink);  // ✅ Send title only
      refreshShows();
      // Clear selection after confirm
      setSelected(prev => {
        const newState = { ...prev };
        delete newState[show.id];
        return newState;
      });
      setSearchResults(prev => {
        const newState = { ...prev };
        delete newState[show.id];
        return newState;
      });
    } catch (error) {
      console.error("Confirm failed:", error);
      alert("Failed to confirm. Check console for details.");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectShow(id);
      refreshShows();
    } catch (error) {
      console.error("Reject failed:", error);
      alert("Failed to reject. Check console for details.");
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {shows.map(show => (
        <div
          key={show.id}
          className="bg-zinc-900 p-6 rounded-xl border border-zinc-800"
        >
          <div className="flex justify-between mb-3">
            <a 
              href={show.reelLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm truncate"
            >
              {show.reelLink}
            </a>
            <span className="bg-yellow-600 px-2 py-1 text-xs rounded">
              Pending
            </span>
          </div>

          {show.caption && (
            <p className="text-gray-300 mb-3 p-2 bg-black/30 rounded">
              📝 {show.caption}
            </p>
          )}

          <input
            type="text"
            placeholder="Search movie by title..."
            className="w-full p-2 rounded bg-black border border-gray-700 mb-3 text-white"
            value={searchTerms[show.id] || ""}
            onChange={(e) => searchOMDb(e.target.value, show.id)}
          />

          {searchResults[show.id] && (
            <>
              <p className="text-sm text-gray-400 mb-2">Select a movie:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {searchResults[show.id].map(movie => (
                  <div
                    key={movie.imdbID}
                    onClick={() =>
                      setSelected(prev => ({
                        ...prev,
                        [show.id]: movie
                      }))
                    }
                    className={`cursor-pointer p-2 rounded transition ${
                      selected[show.id]?.imdbID === movie.imdbID 
                        ? 'ring-2 ring-green-500 bg-green-500/10' 
                        : 'hover:bg-gray-800'
                    }`}
                  >
                    <img
                      src={movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'}
                      alt={movie.Title}
                      className="rounded w-full h-32 object-cover"
                    />
                    <p className="text-xs mt-1 text-center font-medium truncate">
                      {movie.Title}
                    </p>
                    <p className="text-xs text-center text-gray-400">
                      {movie.Year}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {selected[show.id] && (
            <div className="bg-green-500/20 border border-green-500 p-3 rounded mb-4">
              <p className="text-green-400 flex items-center gap-2">
                <span>✅ Selected:</span>
                <span className="font-bold">{selected[show.id].Title}</span>
                <span className="text-gray-400">({selected[show.id].Year})</span>
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => handleConfirm(show)}
              disabled={!selected[show.id]}
              className={`px-6 py-2 rounded font-medium transition ${
                selected[show.id]
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-700 cursor-not-allowed opacity-50'
              }`}
            >
              Confirm
            </button>

            <button
              onClick={() => handleReject(show.id)}
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-medium transition"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ShowList;