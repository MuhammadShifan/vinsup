// models/Schedule.js
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  empEmail: { type: String, required: true }, // Endha user-oda event nu track panna
  title: { type: String, required: true },
  category: { type: String, required: true }, // Job Related or Personal Work
  type: { type: String, required: true },     // Class, Lab, Meeting, etc.
  startDate: { type: String, required: true },
  startTime: { type: String },
  endDate: { type: String, required: true },
  endTime: { type: String },
  location: { type: String },
  description: { type: String },
  isAllDay: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);