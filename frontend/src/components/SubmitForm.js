import { useState } from "react";
import { addReel } from "../services/api";

export default function SubmitForm({ onSubmitSuccess }) {  // Note: prop is onSubmitSuccess
  const [link, setLink] = useState("");
  const [caption, setCaption] = useState("");  // Add caption field
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!link) {
      setError("Please paste a reel link");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await addReel(link, caption);
      setLink("");
      setCaption("");
      onSubmitSuccess();  // Refresh the pending list
    } catch (err) {
      setError("Failed to add reel. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="url"
          placeholder="Paste Instagram Reel or YouTube Shorts link..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="flex-1 p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Adding..." : "Add Reel"}
        </button>
      </div>
      
      <div>
        <textarea
          placeholder="Optional: Add caption to help identify the show..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
        />
      </div>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </form>
  );
}