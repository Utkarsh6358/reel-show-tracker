function extractTitleFromCaption(caption) {
  if (!caption) return null;

  // Pattern: Movie Name (YEAR)
  const match = caption.match(/([A-Za-z0-9\s:'-]+)\s\(\d{4}\)/);

  if (match) {
    return match[1].trim();
  }

  // Fallback: try first sentence before "is"
  const fallback = caption.split(" is ")[0];

  if (fallback.length < 60) {
    return fallback.trim();
  }

  return null;
}

module.exports = extractTitleFromCaption;
