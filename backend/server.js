require("dotenv").config();
const express = require("express");
const cors = require("cors");
const showRoutes = require("./routes/showRoutes");
const reelRoutes = require("./routes/reelRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// ✅ CORS CONFIGURATION
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin === 'http://localhost:3000') return true;
  if (origin === 'https://reel-show-tracker.onrender.com') return true;
  // Allow any Vercel deployment (preview + production)
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

app.use(cors({
  origin: function(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.log('❌ Blocked origin:', origin);
    return callback(new Error('CORS not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));

// Request logging with CORS info
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  console.log('User-Agent:', req.headers['user-agent']);
  
  // Ensure we don't set invalid headers if origin is undefined
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  }
  
  next();
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "Reel Tracker API Running 🚀",
    version: "1.0.0",
    endpoints: {
      "Submit Reel": "POST /api/reels/submit",
      "Get Pending Reels": "GET /api/reels/pending",
      "Confirm Show": "POST /api/shows/confirm/:id",
      "Reject Reel": "POST /api/shows/reject/:id",
      "Get History": "GET /api/shows/history",
      "Debug Google": "GET /debug/google",
      "Health": "GET /health"
    },
    note: "Your backend is working! Connect to it from your frontend."
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    message: "Backend is running smoothly"
  });
});

// DEBUG ENDPOINT - Google Sheets diagnostic
app.get("/debug/google", async (req, res) => {
  console.log("🔍 Debug endpoint called");
  
  try {
    const debug = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasGoogleCreds: !!process.env.GOOGLE_CREDENTIALS_JSON,
        hasSheetId: !!process.env.SHEET_ID,
        hasOmdbKey: !!process.env.OMDB_KEY,
        sheetId: process.env.SHEET_ID ? process.env.SHEET_ID.substring(0, 8) + '...' : null,
        credsLength: process.env.GOOGLE_CREDENTIALS_JSON ? process.env.GOOGLE_CREDENTIALS_JSON.length : 0,
        credsFirstChars: process.env.GOOGLE_CREDENTIALS_JSON ? process.env.GOOGLE_CREDENTIALS_JSON.substring(0, 20) + '...' : null
      },
      googleAuth: null,
      sheetsTest: null
    };

    // Test Google Auth if credentials exist
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      try {
        const { google } = require("googleapis");
        
        console.log("Parsing Google credentials...");
        // Parse credentials from base64
        const credentialsJson = Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString();
        const credentials = JSON.parse(credentialsJson);
        
        debug.googleAuth = {
          success: true,
          clientEmail: credentials.client_email,
          projectId: credentials.project_id,
          privateKeyLength: credentials.private_key ? credentials.private_key.length : 0
        };

        console.log("Initializing Google Auth...");
        // Test Sheets API
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        
        console.log("Testing sheet access...");
        // Try to access the sheet
        const test = await sheets.spreadsheets.get({
          spreadsheetId: process.env.SHEET_ID
        });

        debug.sheetsTest = {
          success: true,
          title: test.data.properties.title,
          sheets: test.data.sheets.map(s => s.properties.title),
          url: `https://docs.google.com/spreadsheets/d/${process.env.SHEET_ID}`
        };

        console.log("✅ Sheet access successful!");

      } catch (error) {
        console.error("❌ Google Auth Error:", error.message);
        debug.googleAuth = {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    } else {
      console.log("❌ No Google credentials found in env vars");
    }

    // Add CORS headers to debug response
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json(debug);
  } catch (error) {
    console.error("❌ Debug endpoint error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Test endpoint to check CORS
app.get("/test-cors", (req, res) => {
  res.json({
    status: 'ok',
    yourOrigin: req.headers.origin,
    isAllowed: isAllowedOrigin(req.headers.origin),
    headers: req.headers
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/reels", reelRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

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
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Debug endpoint: http://localhost:${PORT}/debug/google`);
  console.log(`✅ Test CORS: http://localhost:${PORT}/test-cors`);
});