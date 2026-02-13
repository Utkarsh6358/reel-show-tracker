function ShowCard({ show }) {
  // Handle missing poster
  const posterUrl = show.poster || show.Poster || 'https://via.placeholder.com/300x450?text=No+Poster';
  
  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition">
      <img
        src={posterUrl}
        alt={show.title || show.Title}
        className="rounded mb-3 w-full h-48 object-cover"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
        }}
      />

      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg line-clamp-2">
          {show.title || show.Title}
        </h3>
        <span className="bg-green-600 px-2 py-1 text-xs rounded whitespace-nowrap ml-2">
          Confirmed
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-2">
        {show.genre || show.Genre || 'Unknown Genre'}
      </p>
      
      <p className="text-sm text-gray-300 line-clamp-3">
        {show.plot || show.Plot || 'No description available'}
      </p>
      
      <p className="text-sm mt-2 text-yellow-400 font-semibold">
        ⭐ {show.rating || show.imdbRating || 'N/A'}
      </p>

      <div className="mt-3 pt-3 border-t border-zinc-800">
        <a 
          href={show.reelLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 truncate block"
        >
          {show.reelLink}
        </a>
      </div>
    </div>
  );
}

export default ShowCard;