const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');


router.post('/mark', async (req, res) => {
  try {
    const { studentId, studentName, date, status, markedBy } = req.body;
    const targetDate = new Date(date).toISOString().split('T')[0];
    let existingAttendance = await Attendance.findOne({
      studentId,
      date: { $regex: new RegExp(`^${targetDate}`) }
    });

    let oldStatus = null;

    if (existingAttendance) {
      oldStatus = existingAttendance.status;
      existingAttendance.status = status;
      existingAttendance.studentName = studentName;
      existingAttendance.markedBy = markedBy;
      existingAttendance.date = date;
      await existingAttendance.save();
    } else {
      existingAttendance = new Attendance({
        studentId,
        studentName,
        date,
        status,
        markedBy
      });
      await existingAttendance.save();
    }


    const student = await Student.findOne({ studentId });
    if (student) {
      student.classesAttended = student.classesAttended || 0;
      student.totalClasses = student.totalClasses || 60; 

      if (!oldStatus && status === 'present') {
        student.classesAttended += 1;
      } else if (oldStatus === 'absent' && status === 'present') {
        student.classesAttended += 1;
      } else if (oldStatus === 'present' && status === 'absent') {
        student.classesAttended = Math.max(0, student.classesAttended - 1);
      }

      student.attendance = Math.round((student.classesAttended / student.totalClasses) * 100);
      await student.save();
    }

    res.status(200).json({ success: true, message: 'Attendance marked successfully', data: existingAttendance });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ success: false, message: 'Failed to mark attendance', error: error.message });
  }
});


router.get('/history/:studentId', async (req, res) => {
  try {
    // Latest date first varra maari sort panni edukurom
    const history = await Attendance.find({ studentId: req.params.studentId }).sort({ date: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch history', error: error.message });
  }
});

module.exports = router;