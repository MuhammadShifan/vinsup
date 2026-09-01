const mongoose = require('mongoose');

// Employee-kaga data structure (Schema)
const employeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  empId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dob: { type: String },
  gender: { type: String },
  address: { type: String },
  profilePhoto: { type: String }, // Image URL or base64 string
  
  designation: { type: String, required: true },
  department: { type: String },
  experience: { type: Number },
  doj: { type: String },
  
  // Trainer aah irundha endha courses/batches edukuraanga nu store panna Arrays
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
  // Unga Employee schema kulla idha oru line-a add pannunga
  lastAttendanceDate: { type: String, default: "" },
}, { 
  timestamps: true // Idhu automatic-a 'createdAt' & 'updatedAt' time-a save pannidum
});

module.exports = mongoose.model('Employee', employeeSchema);