const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult'); // 🔥 Pudhusa add pannadhu

// 1. Get ALL Quizzes (For students to filter by batch)
router.get('/all', async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔥 Pudhusa add panna route: Trainer panel-kku specific quiz results edukka 🔥
router.get('/:id/results', async (req, res) => {
  try {
    const QuizResult = require('../models/QuizResult');
    const results = await QuizResult.find({ quizId: req.params.id });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔥 2. Get Quiz Results for a specific student 🔥
router.get('/results/:email', async (req, res) => {
  try {
    const results = await QuizResult.find({ studentEmail: req.params.email });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔥 3. Submit Quiz Answers 🔥
router.post('/submit', async (req, res) => {
  try {
    const { quizId, studentEmail, answers } = req.body;
    
    // Calculate Score
    const quiz = await Quiz.findById(quizId);
    let score = 0;
    
    quiz.questions.forEach((q, idx) => {
      // Assuming answers is an object like { 0: 'A', 1: 'C' }
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

// 4. Create a new Quiz (POST /api/quizzes/)
router.post('/', async (req, res) => {
  try {
    const newQuiz = new Quiz(req.body);
    await newQuiz.save();
    res.status(201).json({ success: true, message: 'Quiz created successfully', data: newQuiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Get Quizzes filtered by trainer email (GET /api/quizzes/:email)
router.get('/:email', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ trainerEmail: req.params.email }).sort({ createdAt: -1 });
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Update a Quiz (PUT /api/quizzes/:id)
router.put('/:id', async (req, res) => {
  try {
    const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Quiz updated', data: updatedQuiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Delete a Quiz (DELETE /api/quizzes/:id)
router.delete('/:id', async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;