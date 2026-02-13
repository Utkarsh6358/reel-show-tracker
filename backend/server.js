require("dotenv").config();
const express = require("express");
const cors = require("cors");
const showRoutes = require("./routes/showRoutes");
const reelRoutes = require("./routes/reelRoutes");

const app = express();



// Add this before your routes
app.get("/debug/google", async (req, res) => {
  try {
    const debug = {
      envVars: {
        hasGoogleCreds: !!process.env.GOOGLE_CREDENTIALS_JSON,
        hasSheetId: !!process.env.SHEET_ID,
        sheetId: process.env.SHEET_ID ? process.env.SHEET_ID.substring(0, 5) + '...' : null,
        credsLength: process.env.GOOGLE_CREDENTIALS_JSON ? process.env.GOOGLE_CREDENTIALS_JSON.length : 0,
        nodeEnv: process.env.NODE_ENV
      },
      googleAuth: null,
      sheetsTest: null
    };

    // Test Google Auth
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      try {
        const { google } = require("googleapis");
        
        // Parse credentials
        const credentialsJson = Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString();
        const credentials = JSON.parse(credentialsJson);
        
        debug.googleAuth = {
          success: true,
          clientEmail: credentials.client_email,
          projectId: credentials.project_id
        };

        // Test Sheets API
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        
        // Try to access the sheet
        const test = await sheets.spreadsheets.get({
          spreadsheetId: process.env.SHEET_ID
        });

        debug.sheetsTest = {
          success: true,
          title: test.data.properties.title,
          sheets: test.data.sheets.map(s => s.properties.title)
        };

      } catch (error) {
        debug.googleAuth = {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }

    res.json(debug);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Updated CORS for production
app.use(cors({
  origin: ['http://localhost:3000', 'https://reel-tracker-frontend.onrender.com'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Fix the endpoints display
app.get("/", (req, res) => {
  res.json({ 
    status: "Reel Tracker API Running 🚀",
    version: "1.0.0",
    endpoints: {
      "Submit Reel": "POST /api/reels/submit",
      "Get Pending Reels": "GET /api/reels/pending",
      "Confirm Show": "POST /api/shows/confirm/:id",
      "Reject Reel": "POST /api/shows/reject/:id",
      "Get History": "GET /api/shows/history"
    },
    note: "Your backend is working! Connect to it from your frontend."
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    message: "Backend is running smoothly"
  });
});

app.use("/api/shows", showRoutes);
app.use("/api/reels", reelRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});