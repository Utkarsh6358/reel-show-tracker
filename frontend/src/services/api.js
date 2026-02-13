// Use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const BASE_URL = `${API_URL}/api`;

export const addReel = async (reelLink, caption = "") => {
  const res = await fetch(`${BASE_URL}/reels/submit`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ reelLink, caption }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add reel');
  }
  
  return res.json();
};

export const fetchPending = async () => {
  const res = await fetch(`${BASE_URL}/reels/pending`);
  if (!res.ok) throw new Error('Failed to fetch pending reels');
  return res.json();
};

export const fetchHistory = async () => {
  const res = await fetch(`${BASE_URL}/shows/history`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
};

export const confirmShow = async (id, title, reelLink) => {
  const res = await fetch(`${BASE_URL}/shows/confirm/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, reelLink })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to confirm show');
  }
  
  return res.json();
};

export const rejectShow = async (id) => {
  const res = await fetch(`${BASE_URL}/shows/reject/${id}`, {
    method: "POST"
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to reject show');
  }
  
  return res.json();
};