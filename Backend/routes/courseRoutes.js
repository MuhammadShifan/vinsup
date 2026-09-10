const express = require('express');
const router = express.Router();
const Course = require('../models/Course');


router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.post('/add', async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    await newCourse.save();
    res.status(201).json({ success: true, message: "Course added!", data: newCourse });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


router.put('/update/:id', async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: "Course updated!", data: updatedCourse });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


router.delete('/delete/:id', async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Course deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;