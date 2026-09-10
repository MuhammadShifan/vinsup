const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');


router.post('/assignment/create', async (req, res) => {
  try {
    const newAssignment = new Assignment(req.body);
    const savedAssignment = await newAssignment.save();
    res.status(201).json({ success: true, message: 'Assignment created successfully!', data: savedAssignment });
  } catch (error) {
    console.error("Assignment Create Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/assignments/:trainerEmail', async (req, res) => {
  try {
    const assignments = await Assignment.find({ createdBy: req.params.trainerEmail })
      .populate('batchId', 'courseName batchName') 
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.post('/quiz/create', async (req, res) => {
  try {
    const newQuiz = new Quiz(req.body);
    const savedQuiz = await newQuiz.save();
    res.status(201).json({ success: true, message: 'Quiz created successfully!', data: savedQuiz });
  } catch (error) {
    console.error("Quiz Create Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/quizzes/:trainerEmail', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.params.trainerEmail })
      .populate('batchId', 'courseName batchName') 
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;