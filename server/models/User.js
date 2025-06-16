const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// We'll skip the pre-save hook to avoid double hashing
// Password hashing will be handled directly in the routes

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // First try the standard bcrypt compare
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    console.error("Error comparing password:", error);
    return false;
  }
};

module.exports = mongoose.model("User", userSchema);
