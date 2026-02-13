const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = process.env.SHEET_ID;

// ==========================
// PENDING REELS
// ==========================

exports.addPendingReel = async (reel) => {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "PendingReels!A:D",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          reel.id,
          reel.reelLink,
          reel.caption,
          new Date().toISOString(),
        ],
      ],
    },
  });
};

exports.getPendingReels = async () => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "PendingReels!A:D",
  });

  const rows = res.data.values || [];

  return rows.slice(1).map((row) => ({
    id: row[0],
    reelLink: row[1],
    caption: row[2],
  }));
};

exports.deletePendingReel = async (id) => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "PendingReels!A:D",
  });

  const rows = res.data.values || [];

  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0, // <-- PendingReels tab must be first sheet
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });
};

// ==========================
// CONFIRMED SHOWS
// ==========================

exports.addConfirmedShow = async (show) => {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "ConfirmedShows!A:G",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          show.Title,
          show.Genre,
          show.Plot,
          show.imdbRating,
          show.Type,
          show.reelLink,
          new Date().toISOString(),
        ],
      ],
    },
  });
};

exports.getConfirmedShows = async () => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "ConfirmedShows!A:G",
  });

  const rows = res.data.values || [];

  return rows.slice(1).map((row) => ({
    title: row[0],
    genre: row[1],
    plot: row[2],
    rating: row[3],
    type: row[4],
    reelLink: row[5],
  }));
};
