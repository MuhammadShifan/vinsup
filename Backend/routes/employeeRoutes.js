const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Employee = require('../models/Employee');

// 📸 Upload Directory Core Resolution
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Strategy Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});
const upload = multer({ storage: storage });

// GET: All Employees with Allocated Courses Count
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find({}).sort({ createdAt: -1 }).exec();
    
    // Enriching employees with allocatedCoursesCount dynamically
    const enrichedEmployees = employees.map(emp => {
      const empObj = emp.toObject();
      return {
        ...empObj,
        allocatedCoursesCount: Array.isArray(emp.courses) ? emp.courses.length : 0
      };
    });

    res.status(200).json({ success: true, data: enrichedEmployees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Single Employee By ID with Allocated Courses Count
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).exec();
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    const empObj = employee.toObject();
    const enrichedEmployee = {
      ...empObj,
      allocatedCoursesCount: Array.isArray(employee.courses) ? employee.courses.length : 0
    };

    res.status(200).json({ success: true, data: enrichedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Add New Employee - Standard Direct Pipeline
router.post('/add', upload.single('profilePhoto'), async (req, res) => {
  try {
    const employeeData = req.body;

    // Safe Structural Object Parsing
    if (employeeData.courses && typeof employeeData.courses === 'string') {
      try { employeeData.courses = JSON.parse(employeeData.courses); } catch(e) { employeeData.courses = []; }
    }
    if (employeeData.batches && typeof employeeData.batches === 'string') {
      try { employeeData.batches = JSON.parse(employeeData.batches); } catch(e) { employeeData.batches = []; }
    }

    if (req.file) {
      employeeData.profilePhoto = `https://vinsup-4vt5.onrender.com/uploads/${req.file.filename}`;
    }

    const newEmployee = new Employee(employeeData);
    await newEmployee.save();
    res.status(201).json({ success: true, message: "Employee added successfully!", data: newEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT: Update Employee Properties 
router.put('/update/:id', upload.single('profilePhoto'), async (req, res) => {
  try {
    const employeeData = req.body;

    if (employeeData.courses && typeof employeeData.courses === 'string') {
      try { employeeData.courses = JSON.parse(employeeData.courses); } catch(e) { employeeData.courses = []; }
    }
    if (employeeData.batches && typeof employeeData.batches === 'string') {
      try { employeeData.batches = JSON.parse(employeeData.batches); } catch(e) { employeeData.batches = []; }
    }

    if (req.file) {
      employeeData.profilePhoto = `https://vinsup-4vt5.onrender.com/uploads/${req.file.filename}`;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, employeeData, { new: true }).exec();
    res.status(200).json({ success: true, message: "Employee updated!", data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT: Core Attendance Update Pipeline
router.put('/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { todayCheckIn, todayCheckOut, todayStatus } = req.body;

    const emp = await Employee.findById(employeeId).exec();
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });

    let newTotal = emp.totalWorkingDays || 0;
    let newPresent = emp.presentDays || 0;

    const isFirstCheckInToday = todayCheckIn && (!emp.todayCheckIn || emp.todayCheckIn === "-" || emp.todayCheckIn === "Not Marked");

    if (isFirstCheckInToday) {
      newTotal += 1; 
      if (todayStatus === 'Present' || todayStatus === 'Late') {
        newPresent += 1;
      }
    }

    const newPercentage = newTotal > 0 ? Math.round((newPresent / newTotal) * 100) : 0;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { 
        $set: { 
          ...(todayCheckIn && { todayCheckIn }), 
          ...(todayCheckOut && { todayCheckOut }), 
          ...(todayStatus && { todayStatus }),
          totalWorkingDays: newTotal,
          presentDays: newPresent,
          attendancePercentage: newPercentage
        } 
      },
      { new: true }
    ).exec();

    res.status(200).json({ success: true, message: "Attendance updated!", data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE
router.delete('/delete/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id).exec();
    res.status(200).json({ success: true, message: "Employee deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;