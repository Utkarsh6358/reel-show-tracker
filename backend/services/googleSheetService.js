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
// USERS
// ==========================

exports.findUser = async (username) => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Users!A:D",
    });
    const rows = res.data.values || [];
    const row = rows.find((r, i) => i > 0 && r[1] === username);
    if (!row) return null;
    return { userId: row[0], username: row[1], password: row[2], createdAt: row[3] };
  } catch (error) {
    console.error("❌ Error finding user:", error);
    throw error;
  }
};

exports.createUser = async (username, password) => {
  try {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Users!A:D",
      valueInputOption: "RAW",
      requestBody: {
        values: [[userId, username, password, new Date().toISOString()]],
      },
    });
    console.log(`✅ User created: ${username}`);
    return { userId, username };
  } catch (error) {
    console.error("❌ Error creating user:", error);
    throw error;
  }
};

exports.updateUser = async (userId, { username, password }) => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Users!A:D",
    });
    const rows = res.data.values || [];
    const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === userId);
    if (rowIndex === -1) throw new Error("User not found");

    const existing = rows[rowIndex];
    const newUsername = username || existing[1];
    const newPassword = password || existing[2];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Users!A${rowIndex + 1}:D${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [[userId, newUsername, newPassword, existing[3]]] },
    });
    console.log(`✅ User updated: ${newUsername}`);
    return { userId, username: newUsername };
  } catch (error) {
    console.error("❌ Error updating user:", error);
    throw error;
  }
};

// ==========================
// PENDING REELS
// ==========================

exports.addPendingReel = async (reel) => {
  try {
    console.log(`Adding pending reel with ID: ${reel.id}`);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "PendingReels!A:E",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          reel.id,
          reel.reelLink,
          reel.caption || "",
          new Date().toISOString(),
          reel.userId || "",
        ]],
      },
    });
    console.log("✅ Reel added successfully");
  } catch (error) {
    console.error("❌ Error adding pending reel:", error);
    throw error;
  }
};

exports.getPendingReels = async (userId) => {
  try {
    console.log("Fetching pending reels...");
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "PendingReels!A:E",
    });

    const rows = res.data.values || [];
    const filtered = rows.slice(1).filter(row => !userId || row[4] === userId);
    console.log(`Found ${filtered.length} pending reels for user ${userId}`);

    return filtered.map((row) => ({
      id: row[0],
      reelLink: row[1],
      caption: row[2] || "",
      timestamp: row[3] || null,
      userId: row[4] || "",
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
      range: "ConfirmedShows!A:J",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          show.Title || "Unknown",
          show.Genre || "N/A",
          show.Plot || "No description",
          show.imdbRating || "N/A",
          show.Type || "movie",
          show.reelLink || "",
          new Date().toISOString(),
          show.Poster || "",
          "Watching",
          show.userId || ""
        ]],
      },
    });
    console.log("✅ Show added successfully");
  } catch (error) {
    console.error("❌ Error adding confirmed show:", error);
    throw error;
  }
};

exports.getConfirmedShows = async (userId) => {
  try {
    console.log("Fetching confirmed shows...");
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "ConfirmedShows!A:J",
    });

    const rows = res.data.values || [];
    const filtered = rows.slice(1).filter(row => !userId || row[9] === userId);
    console.log(`Found ${filtered.length} confirmed shows for user ${userId}`);

    return filtered.map((row) => ({
      title: row[0] || "Unknown",
      genre: row[1] || "N/A",
      plot: row[2] || "No description",
      rating: row[3] || "N/A",
      type: row[4] || "movie",
      reelLink: row[5] || "",
      timestamp: row[6] || null,
      poster: row[7] || null,
      status: row[8] || "Watching",
      userId: row[9] || ""
    }));
  } catch (error) {
    console.error("❌ Error fetching confirmed shows:", error);
    throw error;
  }
};

exports.deleteConfirmedShow = async (title, userId) => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "ConfirmedShows!A:J",
    });
    const rows = res.data.values || [];
    const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === title && (!userId || row[9] === userId));

    if (rowIndex === -1) return false;

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === "ConfirmedShows");

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
    return true;
  } catch (error) {
    console.error("❌ Error deleting confirmed show:", error);
    throw error;
  }
};

exports.updateConfirmedShowStatus = async (title, status, userId) => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "ConfirmedShows!A:J",
    });
    const rows = res.data.values || [];
    const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === title && (!userId || row[9] === userId));

    if (rowIndex === -1) return false;

    const realRowIndex = rowIndex + 1; // 1-indexed for A1 notation
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `ConfirmedShows!I${realRowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[status]],
      },
    });
    return true;
  } catch (error) {
    console.error("❌ Error updating status:", error);
    throw error;
  }
};