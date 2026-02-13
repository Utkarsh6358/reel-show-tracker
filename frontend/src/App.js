import { useEffect, useState } from "react";
import { fetchPending, fetchHistory } from "./services/api";
import SubmitForm from "./components/SubmitForm";
import ShowList from "./components/ShowList";
import ShowCard from "./components/ShowCard";

function App() {
  const [view, setView] = useState("pending");
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);

  const loadPending = async () => {
    const data = await fetchPending();
    setPending(data);
  };

  const loadHistory = async () => {
    const data = await fetchHistory();
    setHistory(data);
  };

  useEffect(() => {
    if (view === "pending") loadPending();
    if (view === "history") loadHistory();
  }, [view]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Reel Show Tracker
      </h1>

      <div className="flex gap-4 justify-center mb-6">
        <button
          onClick={() => setView("pending")}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Pending
        </button>

        <button
          onClick={() => setView("history")}
          className="bg-purple-600 px-4 py-2 rounded"
        >
          Saved Shows
        </button>
      </div>

      {view === "pending" && (
        <>
          <SubmitForm onSubmitSuccess={loadPending} />
          <ShowList shows={pending} refreshShows={loadPending} />
        </>
      )}

      {view === "history" && (
        <div className="grid md:grid-cols-3 gap-6">
          {history.map((show, index) => (
            <ShowCard key={index} show={show} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
