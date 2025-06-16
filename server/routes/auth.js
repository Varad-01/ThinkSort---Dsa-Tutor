const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedPassword = password.trim();
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    const isMatch = await bcrypt.compare(trimmedPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    res.json({ token, email: user.email });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedPassword = password.trim();
    
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(trimmedPassword, salt);
    
    const user = new User({ 
      email, 
      password: hashedPassword 
    });
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    res.status(201).json({ token, email: user.email });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Health check route
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    jwtConfigured: !!process.env.JWT_SECRET,
    mongoConfigured: !!process.env.MONGO_URI,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
