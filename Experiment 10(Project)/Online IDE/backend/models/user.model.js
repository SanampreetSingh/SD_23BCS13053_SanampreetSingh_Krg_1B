const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
  },
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true, // Explicitly ensuring this is indexed for high-speed lookups
  },
  // You might want to store the profile picture for the IDE UI
  picture: {
    type: String,
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema);