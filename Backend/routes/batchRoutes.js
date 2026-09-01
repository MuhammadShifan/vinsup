// routes/batchRoutes.js
const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Notification = require('../models/Notification');
const Employee = require('../models/Employee');

// GET: Ellam batches um eduka
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Pudhu batch add panna & Notify ONLY the allocated Trainer
router.post('/add', async (req, res) => {
  try {
    const newBatch = new Batch(req.body);
    await newBatch.save();

    const assignedTrainer = newBatch.trainer || newBatch.trainerName;

    if (assignedTrainer) {
      try {
        const trainerVal = String(assignedTrainer).trim();
        let targetEmail = '';

        if (trainerVal.includes('@')) {
          targetEmail = trainerVal;
        } else if (trainerVal.match(/^[0-9a-fA-F]{24}$/)) {
          const emp = await Employee.findById(trainerVal);
          if (emp && emp.email) targetEmail = emp.email;
        } else {
          const emp = await Employee.findOne({ 
            $or: [
              { username: { $regex: new RegExp('^' + trainerVal + '$', 'i') } },
              { name: { $regex: new RegExp('^' + trainerVal + '$', 'i') } },
              { fullName: { $regex: new RegExp('^' + trainerVal + '$', 'i') } },
              { firstName: { $regex: new RegExp('^' + trainerVal + '$', 'i') } }
            ]
          });
          if (emp && emp.email) targetEmail = emp.email;
        }

        if (targetEmail) {
          const userNotification = new Notification({
            type: 'batch',
            title: 'New Batch Allocated',
            message: `You have been allocated to a new batch: "${newBatch.batchName || newBatch.name || newBatch.title || 'Batch'}".`,
            recipientEmail: targetEmail
          });
          await userNotification.save();
        }
      } catch (notifErr) {
        console.error("Error sending batch allocation notification:", notifErr);
      }
    }
    res.status(201).json({ success: true, message: "Batch added successfully!", data: newBatch });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT: Batch data va update panna (Generic Admin Update)
router.put('/update/:id', async (req, res) => {
  try {
    const updatedBatch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: "Batch updated!", data: updatedBatch });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 🔥 Progress & Status Update panna & Notify Admin 🔥
router.put('/:id', async (req, res) => {
  try {
    const { progress, status } = req.body;
    const batchId = req.params.id;

    if (progress !== undefined && (progress < 0 || progress > 100)) {
        return res.status(400).json({ success: false, message: "Invalid progress percentage!" });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
        return res.status(404).json({ success: false, message: "Batch not found!" });
    }

    // Prepare update object
    let updateFields = {};
    if (progress !== undefined) {
        updateFields.progress = Number(progress);
        const totalTop = Number(batch.totalTopics) || 36;
        updateFields.completedTopics = Math.round((Number(progress) / 100) * totalTop);
    }
    if (status !== undefined) {
        updateFields.status = status;
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
        batchId,
        { $set: updateFields },
        { new: true }
    );

    // Notify Admin
    try {
      let notifTitle = 'Batch Progress Updated';
      let notifMsg = `Batch "${updatedBatch.batchName || updatedBatch.name || 'Batch'}" progress updated to ${progress}%.`;
      
      if (status === 'Completed') {
          notifTitle = 'Batch Completed';
          notifMsg = `Batch "${updatedBatch.batchName || 'Batch'}" has been marked as Completed!`;
      }

      const adminNotification = new Notification({
        type: 'batch',
        title: notifTitle,
        message: notifMsg,
        recipientEmail: 'admin'
      });
      await adminNotification.save();
    } catch (notifErr) {
      console.error("Error sending admin progress notification:", notifErr);
    }

    res.json({ success: true, message: "Batch updated successfully!", data: updatedBatch });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE: Batch a thooka
router.delete('/delete/:id', async (req, res) => {
  try {
    await Batch.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Batch deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;