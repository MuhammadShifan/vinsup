const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Student = require('../models/Student');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, 'student_' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


router.post('/add', upload.single('profilePhoto'), async (req, res) => {
  try {
    const studentData = { ...req.body };
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


router.get('/', async (req, res) => {
  try {
    const { trainer } = req.query; 
    let query = {};
    if (trainer) {
      query.trainer = trainer;
    }

    const students = await Student.find(query).sort({ createdAt: -1 }); 
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});


router.delete('/delete/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Student deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});


router.put('/update/:id', upload.single('profilePhoto'), async (req, res) => {
  try {
    const dbId = req.params.id; 
    let student = await Student.findById(dbId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
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


    if (req.file) {
      student.profilePhoto = req.file.path; 
    }


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


router.put('/update-syllabus/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params; 
    const { overallProgress, moduleProgress } = req.body;
    const student = await Student.findOne({ studentId: studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
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