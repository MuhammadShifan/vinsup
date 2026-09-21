const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { 
    type: String, 
    required: true,
    index: true
  },
  studentName: { 
    type: String, 
    required: true 
  },
  date: { 
    type: String, 
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'leave'], 
    required: true,
    index: true
  },
  markedBy: { 
    type: String, 
    default: 'Trainer' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);