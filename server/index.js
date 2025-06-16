require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");
const rateLimiter = require("./middleware/rateLimit");

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET environment variable is not set!");
  console.error("Please set JWT_SECRET in your .env file");
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI environment variable is not set!");
  console.error("Please set MONGO_URI in your .env file");
  process.exit(1);
}

console.log("Environment variables loaded successfully");

const app = express();

// Configure CORS for production
const corsOptions = {
  origin: ['https://think-sort-dsa-tutor.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(rateLimiter);

// Connect to MongoDB
connectDB()
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  console.error("Error stack:", err.stack);
  console.error("Request path:", req.path);
  console.error("Request body:", req.body);
  
  res
    .status(500)
    .json({ error: "Internal server error, please try again later" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
