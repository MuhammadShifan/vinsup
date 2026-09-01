const express = require('express');
const router = express.Router();

const Employee = require('../models/Employee');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Student = require('../models/Student'); 
const Attendance = require('../models/Attendance'); 

router.get('/summary', async (req, res) => {
  try {
    const totalEmployees = typeof Employee.countDocuments === 'function' 
      ? await Employee.countDocuments().exec() 
      : (await Employee.find({}).exec()).length;

    const totalStudents = typeof Student.countDocuments === 'function' 
      ? await Student.countDocuments().exec() 
      : (await Student.find({}).exec()).length;

    const totalCourses = typeof Course.countDocuments === 'function' 
      ? await Course.countDocuments().exec() 
      : (await Course.find({}).exec()).length;

    const totalBatches = typeof Batch.countDocuments === 'function' 
      ? await Batch.countDocuments().exec() 
      : (await Batch.find({}).exec()).length;

    let checkedInToday = 0;
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Multiple date formats check panrom (Safety-kaga)
      const dateStr1 = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const dateStr2 = new Date().toLocaleDateString('en-US'); // MM/DD/YYYY
      const dateStr3 = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); 

      const todayRecords = await Attendance.find({
        $or: [
          { createdAt: { $gte: startOfDay, $lte: endOfDay } },
          { date: dateStr1 },
          { date: dateStr2 },
          { date: dateStr3 }
        ]
      }).exec();

      // Oruvelai oru employee multiple times checkin pannirundha, unique count edukka Set use panrom
      const uniqueEmployees = new Set(todayRecords.map(record => String(record.employeeId || record.empId || record._id)));
      checkedInToday = uniqueEmployees.size > 0 ? uniqueEmployees.size : todayRecords.length;
    } catch (e) {
      console.log("Attendance fetch warning:", e.message);
    }

    const batchProgress = await Batch.find({ status: { $in: ['Ongoing', 'In Progress'] } })
      .select('batchName courseName progress status')
      .sort({ createdAt: -1 })
      .exec();

    const upcomingDeadlines = await Batch.find({ status: { $in: ['Ongoing', 'In Progress'] } })
      .select('batchName endDate')
      .sort({ endDate: 1 }) 
      .exec();

    const recentEmployees = await Employee.find({}).sort({ createdAt: -1 }).exec();
    const recentBatches = await Batch.find({}).sort({ createdAt: -1 }).exec();

    let recentActivity = [];
    
    if (Array.isArray(recentEmployees)) {
      recentEmployees.forEach(emp => {
        recentActivity.push({
          id: emp._id,
          message: `New trainer ${emp.fullName || emp.name || 'added'} joined the team.`,
          date: emp.createdAt || new Date()
        });
      });
    }

    if (Array.isArray(recentBatches)) {
      recentBatches.forEach(batch => {
        recentActivity.push({
          id: batch._id,
          message: `New batch '${batch.batchName}' was created.`,
          date: batch.createdAt || new Date()
        });
      });
    }

    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      stats: { 
        totalEmployees, 
        totalStudents, 
        totalCourses, 
        totalBatches, 
        checkedInToday 
      },
      batchProgress,
      upcomingDeadlines,
      recentActivity 
    });

  } catch (err) {
    console.error("Dashboard API Error:", err);
    res.status(500).json({ message: "Server error while fetching dashboard data." });
  }
});

module.exports = router;