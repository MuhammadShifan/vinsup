const express = require('express');
const router = express.Router();
const Syllabus = require('../models/Syllabus');


router.post('/add', async (req, res) => {
  try {
    const { courseName, duration, description, modules } = req.body;
    
    const newSyllabus = new Syllabus({
      courseName,
      duration,
      description,
      modules
    });

    await newSyllabus.save();
    res.status(201).json({ success: true, message: "Syllabus created successfully!" });
  } catch (error) {
    console.error("Add Syllabus Error:", error);
    res.status(500).json({ success: false, message: "Failed to create syllabus." });
  }
});


router.get('/', async (req, res) => {
  try {
    // Latest first ah sort panni anupurom
    const syllabusList = await Syllabus.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: syllabusList });
  } catch (error) {
    console.error("Fetch Syllabus Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch syllabus data." });
  }
});


router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, duration, description, modules } = req.body;

    const updatedSyllabus = await Syllabus.findByIdAndUpdate(
      id,
      { courseName, duration, description, modules },
      { new: true } // Return updated document
    );

    if (!updatedSyllabus) {
      return res.status(404).json({ success: false, message: "Syllabus not found!" });
    }

    res.status(200).json({ success: true, message: "Syllabus updated successfully!" });
  } catch (error) {
    console.error("Update Syllabus Error:", error);
    res.status(500).json({ success: false, message: "Failed to update syllabus." });
  }
});


router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSyllabus = await Syllabus.findByIdAndDelete(id);
    
    if (!deletedSyllabus) {
      return res.status(404).json({ success: false, message: "Syllabus not found!" });
    }

    res.status(200).json({ success: true, message: "Syllabus deleted successfully!" });
  } catch (error) {
    console.error("Delete Syllabus Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete syllabus." });
  }
});

module.exports = router;