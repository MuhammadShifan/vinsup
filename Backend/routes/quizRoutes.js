const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult'); // 🔥 Pudhusa add pannadhu


router.get('/all', async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/:id/results', async (req, res) => {
  try {
    const QuizResult = require('../models/QuizResult');
    const results = await QuizResult.find({ quizId: req.params.id });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/results/:email', async (req, res) => {
  try {
    const results = await QuizResult.find({ studentEmail: req.params.email });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.post('/submit', async (req, res) => {
  try {
    const { quizId, studentEmail, answers } = req.body;
    const quiz = await Quiz.findById(quizId);
    let score = 0;
    quiz.questions.forEach((q, idx) => {

      if (answers[idx] === q.correct) {
        score += (q.marks || 1);
      }
    });

    const newResult = new QuizResult({
      quizId,
      studentEmail,
      score,
      totalMarks: quiz.totalMarks,
      answers
    });

    await newResult.save();
    res.status(201).json({ success: true, score, totalMarks: quiz.totalMarks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const newQuiz = new Quiz(req.body);
    await newQuiz.save();
    res.status(201).json({ success: true, message: 'Quiz created successfully', data: newQuiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/:email', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ trainerEmail: req.params.email }).sort({ createdAt: -1 });
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Quiz updated', data: updatedQuiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;