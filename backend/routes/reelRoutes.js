const express = require("express");
const router = express.Router();

const {
  addPendingReel,
  getPendingReels,
} = require("../services/googleSheetService");

// Submit Reel (from extension or manual input)
router.post("/submit", async (req, res) => {
  const { reelLink, caption, userId } = req.body;

  if (!reelLink) {
    return res.status(400).json({ error: "Reel link required" });
  }

  try {
    const id = Date.now().toString();

    await addPendingReel({
      id,
      reelLink,
      caption: caption || "",
      userId: userId || "",
    });

    res.json({ message: "Reel added to pending", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add reel" });
  }
});

// Get Pending Reels
router.get("/pending", async (req, res) => {
  const userId = req.query.userId;
  try {
    const reels = await getPendingReels(userId);
    res.json(reels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending reels" });
  }
});

module.exports = router;
