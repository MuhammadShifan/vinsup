const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportName: { type: String, required: true },
  reportType: { type: String, required: true },
  empId: { type: String, required: true },
  empName: { type: String },
  empEmail: { type: String },
  summary: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);