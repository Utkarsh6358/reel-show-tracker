console.log("Reel Show Tracker content script loaded");

function extractCaption() {
  const meta = document.querySelector('meta[name="description"]');

  if (!meta) {
    console.log("Meta description not found.");
    return;
  }

  const fullText = meta.getAttribute("content");

  if (!fullText) {
    console.log("Meta content empty.");
    return;
  }

  // Remove username + date part before first colon
  const caption = fullText.split(':').slice(1).join(':').trim();

  if (!caption) {
    console.log("Caption not extracted properly.");
    return;
  }

  console.log("Caption detected:", caption);

  const reelLink = window.location.href;

  fetch("http://localhost:5000/api/shows/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      reelLink,
      caption
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Saved to backend ✅", data);
  })
  .catch(err => {
    console.error("Error sending to backend:", err);
  });
}

// Run after page load
window.addEventListener("load", () => {
  setTimeout(extractCaption, 2000);
});
