const express = require("express");
const router = express.Router();

const {
  addConfirmedShow,
  deletePendingReel,
  getConfirmedShows,
  deleteConfirmedShow,
  updateConfirmedShowStatus,
} = require("../services/googleSheetService");

const { fetchShowDetails } = require("../services/showDetailsService");

// Confirm Reel → Move from Pending to Confirmed
router.post("/confirm/:id", async (req, res) => {
  const { id } = req.params;
  const { title, reelLink, userId } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title required" });
  }

  try {
    const details = await fetchShowDetails(title);

    if (!details) {
      return res.status(404).json({ error: "Show not found" });
    }

    await addConfirmedShow({
      ...details,
      reelLink,
      userId,
    });

    await deletePendingReel(id);

    res.json({ message: "Confirmed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Confirmation failed" });
  }
});

// Reject Reel
router.post("/reject/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deletePendingReel(id);
    res.json({ message: "Reel rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Reject failed" });
  }
});

// Save Show Directly (from Home/TMDB, no reel link)
router.post("/save-direct", async (req, res) => {
  const { title, userId } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });

  try {
    // Check if already saved
    const existing = await getConfirmedShows(userId);
    const alreadySaved = existing.some(s => s.title?.toLowerCase() === title.toLowerCase());
    if (alreadySaved) return res.status(409).json({ error: "Already in your watchlist" });

    const details = await fetchShowDetails(title);
    if (!details) return res.status(404).json({ error: "Show not found" });

    await addConfirmedShow({ ...details, reelLink: "", userId });
    res.json({ message: "Added to watchlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save show" });
  }
});

// Get Confirmed Shows History
router.get("/history", async (req, res) => {
  const userId = req.query.userId;
  try {
    const shows = await getConfirmedShows(userId);
    res.json(shows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Update Status of Confirmed Show
router.post("/history/update-status", async (req, res) => {
  const { title, status, userId } = req.body;
  if (!title || !status) return res.status(400).json({ error: "Missing title or status" });

  try {
    const success = await updateConfirmedShowStatus(title, status, userId);
    if (success) {
      res.json({ message: "Status updated successfully" });
    } else {
      res.status(404).json({ error: "Show not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Remove Confirmed Show
router.post("/history/remove", async (req, res) => {
  const { title, userId } = req.body;
  if (!title) return res.status(400).json({ error: "Missing title" });

  try {
    const success = await deleteConfirmedShow(title, userId);
    if (success) {
      res.json({ message: "Show removed successfully" });
    } else {
      res.status(404).json({ error: "Show not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove show" });
  }
});

module.exports = router;
