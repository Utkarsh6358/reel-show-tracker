const { google } = require("googleapis");

let auth;
let sheets;

// Initialize auth based on environment
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  // Production: Use environment variable
  console.log("✅ Using Google credentials from environment variable");
  
  try {
    // Parse the base64 string back to JSON
    const credentialsJson = Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString();
    const credentials = JSON.parse(credentialsJson);
    
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    console.log("✅ Google auth initialized successfully from env var");
  } catch (error) {
    console.error("❌ Error parsing GOOGLE_CREDENTIALS_JSON:", error.message);
    throw error;
  }
} else {
  // Development: Use file
  console.log("⚠️ Using Google credentials from file (development mode)");
  try {
    auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    console.log("✅ Google auth initialized successfully from file");
  } catch (error) {
    console.error("❌ Error loading credentials.json file:", error.message);
    throw error;
  }
}

sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.SHEET_ID;

if (!SPREADSHEET_ID) {
  console.error("❌ WARNING: SHEET_ID environment variable is not set!");
}

// ==========================
// PENDING REELS
// ==========================

exports.addPendingReel = async (reel) => {
  try {
    console.log(`Adding pending reel with ID: ${reel.id}`);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "PendingReels!A:D",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            reel.id,
            reel.reelLink,
            reel.caption || "",
            new Date().toISOString(),
          ],
        ],
      },
    });
    console.log("✅ Reel added successfully");
  } catch (error) {
    console.error("❌ Error adding pending reel:", error);
    throw error;
  }
};

exports.getPendingReels = async () => {
  try {
    console.log("Fetching pending reels...");
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "PendingReels!A:D",
    });

    const rows = res.data.values || [];
    console.log(`Found ${rows.length - 1} pending reels`);

    return rows.slice(1).map((row) => ({
      id: row[0],
      reelLink: row[1],
      caption: row[2] || "",
      timestamp: row[3] || null,
    }));
  } catch (error) {
    console.error("❌ Error fetching pending reels:", error);
    throw error;
  }
};

exports.deletePendingReel = async (id) => {
  try {
    console.log(`Deleting pending reel with ID: ${id}`);
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "PendingReels!A:D",
    });

    const rows = res.data.values || [];
    const rowIndex = rows.findIndex((row, index) => index > 0 && row[0] === id);

    if (rowIndex === -1) {
      console.log(`Reel with ID ${id} not found`);
      return false;
    }

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    
    const sheet = spreadsheet.data.sheets.find(s => 
      s.properties.title === "PendingReels"
    );
    
    if (!sheet) {
      throw new Error("PendingReels sheet not found");
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
    
    console.log(`✅ Reel ${id} deleted successfully`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting pending reel:", error);
    throw error;
  }
};

// ==========================
// CONFIRMED SHOWS
// ==========================

exports.addConfirmedShow = async (show) => {
  try {
    console.log(`Adding confirmed show: ${show.Title}`);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "ConfirmedShows!A:H",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            show.Title || "Unknown",
            show.Genre || "N/A",
            show.Plot || "No description",
            show.imdbRating || "N/A",
            show.Type || "movie",
            show.reelLink || "",
            new Date().toISOString(),
            show.Poster || ""
          ],
        ],
      },
    });
    console.log("✅ Show added successfully");
  } catch (error) {
    console.error("❌ Error adding confirmed show:", error);
    throw error;
  }
};

exports.getConfirmedShows = async () => {
  try {
    console.log("Fetching confirmed shows...");
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "ConfirmedShows!A:H",
    });

    const rows = res.data.values || [];
    console.log(`Found ${rows.length - 1} confirmed shows`);

    return rows.slice(1).map((row) => ({
      title: row[0] || "Unknown",
      genre: row[1] || "N/A",
      plot: row[2] || "No description",
      rating: row[3] || "N/A",
      type: row[4] || "movie",
      reelLink: row[5] || "",
      timestamp: row[6] || null,
      poster: row[7] || null
    }));
  } catch (error) {
    console.error("❌ Error fetching confirmed shows:", error);
    throw error;
  }
};