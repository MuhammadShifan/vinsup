// routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Notification = require('../models/Notification');
const Employee = require('../models/Employee'); // 🔥 Employee Name edukka import pandrom

// ==========================================
// USER APIs
// ==========================================

// User applying for leave & Notify Admin 🔥
router.post('/apply', async (req, res) => {
  try {
    const newLeave = new LeaveRequest(req.body);
    await newLeave.save();

    // Employee-oda name-a thedi edukrom
    let empName = newLeave.empEmail || 'Staff';
    try {
      const emp = await Employee.findOne({ email: newLeave.empEmail });
      if (emp && (emp.name || emp.fullName || emp.firstName)) {
        empName = emp.name || emp.fullName || emp.firstName;
      }
    } catch (e) {}

    // 1. Create Notification for Admin with Employee Name
    try {
      const adminNotification = new Notification({
        type: 'leave',
        title: 'New Leave Request',
        message: `${empName} applied for leave (${newLeave.leaveType || 'General'}).`,
        recipientEmail: 'admin'
      });
      await adminNotification.save();
      console.log("Admin leave notification saved!");
    } catch (notifErr) {
      console.error("Error creating admin leave notification:", notifErr);
    }

    res.status(201).json({ success: true, message: "Leave request submitted successfully", data: newLeave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get leave history for a specific employee
router.get('/user/:email', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ empEmail: req.params.email }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// ADMIN APIs 
// ==========================================

// Admin: Get ALL leave requests
router.get('/', async (req, res) => {
  try {
    console.log("Fetching all leaves from database..."); 
    const allLeaves = await LeaveRequest.find().sort({ createdAt: -1 });
    console.log("Leaves found in DB:", allLeaves.length);
    res.status(200).json({ success: true, data: allLeaves });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update leave status & Notify User 🔥
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body; 
    const updatedLeave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    // 2. Create Notification for User when Approved/Rejected
    if (updatedLeave && updatedLeave.empEmail) {
      try {
        const userNotification = new Notification({
          type: 'leave',
          title: `Leave Request ${status}`,
          message: `Your leave request has been ${status.toLowerCase()} by Admin.`,
          recipientEmail: updatedLeave.empEmail
        });
        await userNotification.save();
        console.log("User leave notification saved!");
      } catch (notifErr) {
        console.error("Error creating user leave notification:", notifErr);
      }
    }

    res.status(200).json({ success: true, message: `Leave ${status} successfully`, data: updatedLeave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;