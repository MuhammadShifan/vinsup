const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  duration: { type: String, required: true },
  description: { type: String },
  level: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'], 
    default: 'Beginner' 
  },
  batches: { type: Number, default: 0 },
  enrolledStudents: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Course', courseSchema);