const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const BASE_URL = `${API_URL}/api`;

export const saveShowDirect = async (title, userId = "") => {
  const res = await fetch(`${BASE_URL}/shows/save-direct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, userId })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to save show'); }
  return res.json();
};

export const addReel = async (reelLink, caption = "", userId = "") => {
  const res = await fetch(`${BASE_URL}/reels/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ reelLink, caption, userId }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to add reel'); }
  return res.json();
};

export const fetchPending = async (userId = "") => {
  const res = await fetch(`${BASE_URL}/reels/pending?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch pending reels');
  return res.json();
};

export const fetchHistory = async (userId = "") => {
  const res = await fetch(`${BASE_URL}/shows/history?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
};

export const confirmShow = async (id, title, reelLink, userId = "") => {
  const res = await fetch(`${BASE_URL}/shows/confirm/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, reelLink, userId })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to confirm show'); }
  return res.json();
};

export const rejectShow = async (id) => {
  const res = await fetch(`${BASE_URL}/shows/reject/${id}`, { method: "POST" });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to reject show'); }
  return res.json();
};

export const updateShowStatus = async (title, status, userId = "") => {
  const res = await fetch(`${BASE_URL}/shows/history/update-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, status, userId })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to update status'); }
  return res.json();
};

export const removeShow = async (title, userId = "") => {
  const res = await fetch(`${BASE_URL}/shows/history/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, userId })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to remove show'); }
  return res.json();
};