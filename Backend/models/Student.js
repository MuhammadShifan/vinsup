const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // 1. Personal Information
  studentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  emergencyName: { type: String },
  emergencyPhone: { type: String },
  profilePhoto: { type: String }, // Upload aagura image path

  // 2. Academic Information
  course: { type: String, required: true },
  batch: { type: String, required: true },
  trainer: { type: String },
  doj: { type: Date, required: true },
  status: { type: String, default: 'Active' },

  // 3. Additional Information
  previousEdu: { type: String },
  skills: { type: String },
  remarks: { type: String },

  // Default Stats for Dashboard UI (Pudhu student-kku 0 irukkum)
  attendance: { type: Number, default: 0 },
  classesAttended: { type: Number, default: 0 },
  totalClasses: { type: Number, default: 60 },
  syllabusProgress: { type: Number, default: 0 },
  completedConcepts: { type: Number, default: 0 },
  totalConcepts: { type: Number, default: 100 },
  projectsCompleted: { type: Number, default: 0 },
  totalProjects: { type: Number, default: 6 },
  overallProgress: { type: Number, default: 0 },

  // 🔥 PUDHUSA ADD PANNA FIELDS (For My Students Page Tracking) 🔥
  
  // Ovvoru module-layum evalo % mudichirukanga nu track panna
  moduleProgress: [
    {
      moduleName: { type: String },
      progress: { type: Number, default: 0 }
    }
  ],

  // Assign pandra pudhu projects-a track panna
  assignedProjects: [
    {
      title: { type: String },
      type: { type: String, enum: ['Individual', 'Group'] },
      assignedDate: { type: String },
      dueDate: { type: String },
      status: { type: String, default: 'Assigned' } // Assigned, In Progress, Completed
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);