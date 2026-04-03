import { useEffect, useState } from "react";
import { fetchPending, fetchHistory } from "./services/api";
import { useAuth } from "./context/AuthContext";
import SubmitForm from "./components/SubmitForm";
import ShowList from "./components/ShowList";
import ShowCard from "./components/ShowCard";
import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import ShowDetailModal from "./components/ShowDetailModal";
import EditProfileModal from "./components/EditProfileModal";

function App() {
  const { user, logout, updateUser } = useAuth();
  const [view, setView] = useState("home");
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Watching");
  const [typeFilter, setTypeFilter] = useState("all"); // all | movie | tv
  const [selectedShow, setSelectedShow] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const STATUS_TABS = ["All", "Watching", "On-Hold", "Planning", "Completed", "Dropped"];

  const userId = user?.userId || "";

  const loadPending = async () => {
    const data = await fetchPending(userId);
    setPending(data);
  };

  const loadHistory = async () => {
    const data = await fetchHistory(userId);
    setHistory(data);
  };

  useEffect(() => {
    if (view === "pending") loadPending();
    if (view === "history") loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, userId]);

  const allGenres = Array.from(new Set(history.flatMap(show => {
    const genreStr = show.genre || show.Genre || "";
    if (genreStr === "N/A" || !genreStr) return [];
    return genreStr.split(",").map(g => g.trim());
  }))).sort();

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const filteredHistory = history.filter(show => {
    // Type Filter (movie / series / all)
    if (typeFilter !== "all") {
      const showType = show.type || show.Type || "";
      const isSeries = showType.toLowerCase() === "series";
      if (typeFilter === "movie" && isSeries) return false;
      if (typeFilter === "tv" && !isSeries) return false;
    }
    // Status Filter
    const showStatus = show.status || "Watching";
    if (statusFilter !== "All" && showStatus !== statusFilter) return false;
    // Genre Filter
    if (selectedGenres.length > 0) {
      const genreStr = show.genre || show.Genre || "";
      const showGenres = genreStr.split(",").map(g => g.trim());
      if (!selectedGenres.some(g => showGenres.includes(g))) return false;
    }
    return true;
  });

  if (!user) return <LoginPage />;

  const NAV_TABS = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "pending", label: "Pending", icon: "⏳" },
    { id: "history", label: "Saved Shows", icon: "🎬" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
          Reel Show Tracker
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase">
              {user.username.charAt(0)}
            </div>
            <span className="text-gray-200 font-medium text-sm hidden md:block">{user.username}</span>
          </div>
          <button
            onClick={() => setShowEditProfile(true)}
            title="Edit Profile"
            className="px-3 py-2 text-sm text-gray-400 hover:text-blue-400 border border-white/10 rounded-lg hover:border-blue-500/30 transition-all duration-200"
          >
            ✏️
          </button>
          <button
            onClick={logout}
            className="px-3 py-2 text-sm text-gray-400 hover:text-red-400 border border-white/10 rounded-lg hover:border-red-500/30 transition-all duration-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="flex gap-2 mb-8 bg-white/5 border border-white/10 rounded-2xl p-1.5">
        {NAV_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              view === tab.id
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </nav>

      {/* Home Tab */}
      {view === "home" && <HomePage userId={userId} />}

      {/* Pending Tab */}
      {view === "pending" && (
        <>
          <SubmitForm onSubmitSuccess={loadPending} userId={userId} />
          <ShowList shows={pending} refreshShows={loadPending} userId={userId} />
        </>
      )}

      {/* Saved Shows Tab */}
      {view === "history" && (
        <div className="flex flex-col gap-6">
          {/* Status & Type Filters row */}
          <div className="flex flex-col gap-4 border-b border-gray-800 pb-5">
            {/* Status tabs */}
            <div className="flex gap-1 overflow-x-auto">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-4 py-2 text-sm font-medium transition whitespace-nowrap rounded-lg ${
                    statusFilter === tab
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Type pills */}
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Type:</span>
              {[
                { id: "all", label: "All" },
                { id: "movie", label: "🎥 Movies" },
                { id: "tv", label: "📺 Series" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    typeFilter === t.id
                      ? "bg-blue-600/30 border-blue-500/50 text-blue-300"
                      : "border-white/15 text-gray-400 hover:border-white/30 hover:text-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Filter */}
          <div>
            <h3 className="text-gray-400 mb-3 text-xs font-semibold uppercase tracking-wider">Filter by Genre</h3>
            <div className="flex flex-wrap gap-2">
              {allGenres.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    selectedGenres.includes(genre)
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "bg-transparent border-gray-600 text-gray-300 hover:border-gray-400"
                  }`}
                >
                  {genre}
                </button>
              ))}
              {selectedGenres.length > 0 && (
                <button
                  onClick={() => setSelectedGenres([])}
                  className="px-3 py-1 rounded-full text-sm bg-gray-700 text-white hover:bg-gray-600 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredHistory.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-20">
                <p className="text-5xl mb-4">📭</p>
                <p className="font-semibold">No shows match your filters</p>
              </div>
            ) : (
              filteredHistory.map((show, index) => (
                <ShowCard
                  key={index}
                  show={show}
                  refreshShows={loadHistory}
                  userId={userId}
                  onCardClick={setSelectedShow}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Global Show Detail Modal */}
      {selectedShow && (
        <ShowDetailModal show={selectedShow} onClose={() => setSelectedShow(null)} userId={userId} />
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditProfile(false)}
          onUpdate={(updated) => { updateUser(updated); setShowEditProfile(false); }}
        />
      )}
    </div>
  );
}

export default App;
