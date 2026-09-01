const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Student = require('../models/Student');

// Image Upload-kku Multer Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Backend-la 'uploads' folder kandippa irukanum
  },
  filename: function (req, file, cb) {
    cb(null, 'student_' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 1. ADD STUDENT (POST)
router.post('/add', upload.single('profilePhoto'), async (req, res) => {
  try {
    const studentData = { ...req.body };
    
    // Photo upload aagirundha andha path-a save pannanum
    if (req.file) {
      studentData.profilePhoto = req.file.path;
    }

    const newStudent = new Student(studentData);
    await newStudent.save();
    
    res.status(201).json({ success: true, message: 'Student added successfully!', data: newStudent });
  } catch (error) {
    console.error("Add Student Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Student ID or Email already exists!' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// 🔥 2. GET ALL STUDENTS / FILTER BY TRAINER (GET) 🔥
router.get('/', async (req, res) => {
  try {
    const { trainer } = req.query; // Frontend-la irundhu trainer name varudha nu paakurom
    let query = {};
    
    // Trainer query parameter irundha, andha trainer students-a mattum filter pannu
    if (trainer) {
      query.trainer = trainer;
    }

    const students = await Student.find(query).sort({ createdAt: -1 }); 
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// 3. DELETE STUDENT (DELETE)
router.delete('/delete/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Student deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// 4. UPDATE STUDENT API (PUT)
router.put('/update/:id', upload.single('profilePhoto'), async (req, res) => {
  try {
    const dbId = req.params.id; // Database _id
    
    // Pazhaya student data-va thedurom
    let student = await Student.findById(dbId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Frontend-la irundhu vandha pudhu data-va update pandrom
    const updateFields = [
      'studentId', 'fullName', 'email', 'phone', 'dob', 'gender', 'address',
      'emergencyName', 'emergencyPhone', 'course', 'batch', 'trainer', 'doj',
      'previousEdu', 'skills', 'remarks'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        student[field] = req.body[field];
      }
    });

    // Pudhusa image edhavadhu upload pannirundha adhayum mathurom
    if (req.file) {
      student.profilePhoto = req.file.path; 
    }

    // DB-la save pandrom
    await student.save();

    res.status(200).json({ success: true, message: 'Student updated successfully!', data: student });
  } catch (error) {
    console.error("Error updating student:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Student ID or Email already exists!" });
    }
    
    res.status(500).json({ success: false, message: 'Server error while updating student.', error: error.message });
  }
});

// 🔥 5. UPDATE SYLLABUS PROGRESS API (PUT) 🔥
router.put('/update-syllabus/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params; // Idhu database ID illa, STU001 maari varra ID
    const { overallProgress, moduleProgress } = req.body;

    // Student ID vachu thedurom
    const student = await Student.findOne({ studentId: studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Progress data-va DB-la update pandrom
    student.syllabusProgress = overallProgress;
    if (moduleProgress) {
      student.moduleProgress = moduleProgress;
    }

    await student.save();
    res.status(200).json({ success: true, message: 'Syllabus progress updated successfully!', data: student });
  } catch (error) {
    console.error("Error updating syllabus:", error);
    res.status(500).json({ success: false, message: 'Server error while updating syllabus.', error: error.message });
  }
});

module.exports = router;