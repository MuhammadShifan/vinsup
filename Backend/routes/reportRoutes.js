const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// POST: Generate new report
router.post('/', async (req, res) => {
  try {
    const newReport = new Report(req.body);
    await newReport.save();
    res.status(201).json({ success: true, data: newReport });
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Fetch all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔥 PUDHUSA ADD PANNADHU: DELETE API
router.delete('/:id', async (req, res) => {
  try {
    const deletedReport = await Report.findByIdAndDelete(req.params.id);
    if (!deletedReport) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;