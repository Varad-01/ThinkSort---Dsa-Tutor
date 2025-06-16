const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error; // Throw the error instead of exiting the process
  }
};

// Function to clean AI responses by removing asterisks
function cleanAIResponse(text) {
  // Remove single and double asterisks while preserving the text
  return text.replace(/\*+([^*]+)\*+/g, '$1').replace(/\*/g, '');
}

module.exports = connectDB;
