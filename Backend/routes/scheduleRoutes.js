const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');


router.post('/add', async (req, res) => {
  try {
    const newEvent = new Schedule(req.body);
    await newEvent.save();
    res.status(201).json({ success: true, message: 'Event added successfully', data: newEvent });
  } catch (error) {
    console.error("Error saving event:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/:email', async (req, res) => {
  try {
    const events = await Schedule.find({ empEmail: req.params.email }).sort({ startDate: 1, startTime: 1 });
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const deletedEvent = await Schedule.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ success: false, message: 'Event not found' });
    
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;