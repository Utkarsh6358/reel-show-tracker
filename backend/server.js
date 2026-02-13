require("dotenv").config();
const express = require("express");
const cors = require("cors");
const showRoutes = require("./routes/showRoutes");
const reelRoutes = require("./routes/reelRoutes");

const app = express();

// ✅ Updated CORS for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://your-frontend-url.onrender.com', // Add after frontend deploy
  'https://your-backend-url.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  next();
});

app.get("/", (req, res) => {
  res.json({ 
    status: "Reel Tracker API Running 🚀",
    version: "1.0.0",
    endpoints: {
      submit: "POST /api/reels/submit",
      pending: "GET /api/reels/pending",
      confirm: "POST /api/shows/confirm/:id",
      reject: "POST /api/shows/reject/:id",
      history: "GET /api/shows/history"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
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
});