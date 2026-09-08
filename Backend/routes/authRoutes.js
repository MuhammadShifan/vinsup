const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // 🔥 JWT Import pannirukku 🔥
const Employee = require('../models/Employee');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

// ==========================================
// 🔥 UNIFIED LOGIN ROUTE WITH JWT TOKEN 🔥
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const cleanPassword = password ? password.trim() : '';

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ success: false, message: "Please provide both email and password!" });
    }

    // 1. Check if Admin
    const admin = await Admin.findOne({ email: cleanEmail });
    if (admin) {
      if (admin.password === cleanPassword) {
        // 🔥 Generate JWT for Admin
        const token = jwt.sign({ id: admin._id, role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '30d' });

        return res.status(200).json({
          success: true,
          token, // <--- Sent token
          user: {
            name: admin.name || admin.fullName || 'Admin',
            email: admin.email,
            role: 'Admin',
            profilePhoto: admin.profilePhoto || ''
          }
        });
      } else {
        return res.status(400).json({ success: false, message: "Invalid Password for Admin!" });
      }
    }

    // 2. Check if Employee / Teacher
    const employee = await Employee.findOne({ email: cleanEmail });
    if (employee) {
      const empDobFormatted = employee.dob ? new Date(employee.dob).toISOString().split('T')[0].replace(/-/g, '') : '';
      if (employee.password === cleanPassword || empDobFormatted === cleanPassword) {
        // 🔥 Generate JWT for Employee
        const token = jwt.sign({ id: employee._id, role: employee.role || 'Employee' }, process.env.JWT_SECRET, { expiresIn: '30d' });

        return res.status(200).json({
          success: true,
          token, // <--- Sent token
          user: {
            name: employee.name || employee.fullName || employee.employeeName || 'Employee',
            email: employee.email,
            role: employee.role || 'Employee'
          }
        });
      } else {
        return res.status(400).json({ success: false, message: "Invalid Password for Employee!" });
      }
    }

    // 3. Check if Student (DOB Login Logic)
    const student = await Student.findOne({ email: cleanEmail });
    if (student) {
      let studentDobMatch = false;
      if (student.dob) {
        const dobStr = new Date(student.dob).toISOString().split('T')[0]; // YYYY-MM-DD
        const [year, month, day] = dobStr.split('-');
        const formats = [
          `${day}${month}${year}`, // DDMMYYYY
          `${year}${month}${day}`, // YYYYMMDD
          `${day}-${month}-${year}`,
          dobStr
        ];
        if (formats.includes(cleanPassword) || student.password === cleanPassword) {
          studentDobMatch = true;
        }
      }

      if (studentDobMatch || student.password === cleanPassword) {
        // 🔥 Generate JWT for Student
        const token = jwt.sign({ id: student._id, role: 'Student' }, process.env.JWT_SECRET, { expiresIn: '30d' });

        return res.status(200).json({
          success: true,
          token, // <--- Sent token
          user: {
            name: student.name || student.fullName || 'Student',
            email: student.email,
            role: 'Student'
          }
        });
      } else {
        return res.status(400).json({ success: false, message: "Invalid Password for Student!" });
      }
    }

    return res.status(404).json({ success: false, message: "User not found with this email!" });

  } catch (err) {
    console.error("Login route error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;