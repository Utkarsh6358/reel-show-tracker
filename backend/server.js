require("dotenv").config();
const express = require("express");
const cors = require("cors");
const showRoutes = require("./routes/showRoutes");
const reelRoutes = require("./routes/reelRoutes");

const app = express();

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