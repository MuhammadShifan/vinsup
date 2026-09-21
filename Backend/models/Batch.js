const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchName: { type: String, required: true, index: true },
  batchType: { type: String, required: true },
  courseName: { type: String, required: true, index: true },
  trainerName: { type: String, index: true },
  studentsCount: { type: Number, default: 0 },
  startDate: { type: String },
  endDate: { type: String },
  progress: { type: Number, default: 0 },
  status: { type: String, default: "Ongoing", index: true }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Batch', batchSchema);