const express = require("express");
const router = express.Router();

const {
  addConfirmedShow,
  deletePendingReel,
  getConfirmedShows,
} = require("../services/googleSheetService");

const { fetchShowDetails } = require("../services/showDetailsService");

// Confirm Reel → Move from Pending to Confirmed
router.post("/confirm/:id", async (req, res) => {
  const { id } = req.params;
  const { title, reelLink } = req.body;

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

// Get Confirmed Shows History
router.get("/history", async (req, res) => {
  try {
    const shows = await getConfirmedShows();
    res.json(shows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;
