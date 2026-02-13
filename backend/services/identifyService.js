const axios = require("axios");
const extractTitleFromCaption = require("../utils/extractTitle");

async function identifyShow(caption) {
  const title = extractTitleFromCaption(caption);

  if (!title) {
    throw new Error("Could not detect movie name");
  }

  console.log("Detected title:", title);

  const response = await axios.get("http://www.omdbapi.com/", {
    params: {
      t: title,
      apikey: process.env.OMDB_KEY
    }
  });

  if (response.data.Response === "False") {
    throw new Error("Show not found");
  }

  return response.data;
}

module.exports = identifyShow;
