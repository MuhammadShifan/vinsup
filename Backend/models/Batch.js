const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchName: { type: String, required: true },
  batchType: { type: String, required: true }, // e.g. Morning Batch
  courseName: { type: String, required: true },
  trainerName: { type: String },
  studentsCount: { type: Number, default: 0 },
  startDate: { type: String },
  endDate: { type: String },
  progress: { type: Number, default: 0 }, // Admin idhaa form-la edukka maataaru, but default 0 aagum
  status: { type: String, default: "Ongoing" }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Batch', batchSchema);