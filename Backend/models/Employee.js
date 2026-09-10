const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  empId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dob: { type: String },
  gender: { type: String },
  address: { type: String },
  profilePhoto: { type: String },
  designation: { type: String, required: true },
  department: { type: String },
  experience: { type: Number },
  doj: { type: String },
  courses: [{ type: String }],
  batches: [{ type: String }],
  username: { type: String },
  password: { type: String, required: true },
  role: { type: String, default: 'Employee' },
  todayCheckIn: { type: String, default: "-" },
  todayCheckOut: { type: String, default: "-" },
  todayStatus: { type: String, default: "Not Marked"},
  totalWorkingDays: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  attendancePercentage: { type: Number, default: 0 },
  lastAttendanceDate: { type: String, default: "" },
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Employee', employeeSchema);