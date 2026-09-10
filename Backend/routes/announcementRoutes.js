const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');


router.post('/', async (req, res) => {
  try {
    const newAnnouncement = new Announcement(req.body);
    await newAnnouncement.save();
    res.status(201).json({ success: true, message: 'Announcement sent successfully', data: newAnnouncement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/trainer/:trainerId', async (req, res) => {
  try {
    const announcements = await Announcement.find({ trainerId: req.params.trainerId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;