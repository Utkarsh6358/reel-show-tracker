const axios = require("axios");

exports.fetchShowDetails = async (title) => {
  try {
    const response = await axios.get(
      `https://www.omdbapi.com/?apikey=${process.env.OMDB_KEY}&t=${title}`
    );

    if (response.data.Response === "False") {
      return null;
    }

    return {
      Title: response.data.Title,
      Genre: response.data.Genre,
      Plot: response.data.Plot,
      imdbRating: response.data.imdbRating,
      Type: response.data.Type,
    };
  } catch (err) {
    console.error("OMDb fetch error:", err);
    return null;
  }
};
