const { saveToSheet } = require("./googleSheetService");
const identifyShow = require("./identifyService");

let reels = [];
let currentId = 1;

// Submit reel (pending)
function submitReel(reelLink) {
  const newReel = {
    id: currentId++,
    reelLink,
    status: "pending"
  };

  reels.push(newReel);
  return newReel;
}

// Get pending reels
function getPendingReels() {
  return reels.filter(r => r.status === "pending");
}

// Confirm reel
async function confirmReel(reelId, caption, manualTitle) {
  const reel = reels.find(r => r.id === reelId);

  if (!reel) {
    throw new Error("Reel not found");
  }

  const movie = await identifyShow(caption, manualTitle);

  movie.reelLink = reel.reelLink;

  await saveToSheet(movie);

  reel.status = "confirmed";

  return movie;
}

module.exports = {
  submitReel,
  getPendingReels,
  confirmReel
};
