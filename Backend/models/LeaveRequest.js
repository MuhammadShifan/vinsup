const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  empId: { type: String, required: true },
  empName: { type: String, required: true },
  empEmail: { type: String, required: true },
  leaveType: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  totalDays: { type: Number, required: true },
  session: { type: String, default: 'Full Day' },
  reason: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  appliedOn: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);