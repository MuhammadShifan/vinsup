const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  studentEmail: { type: String, required: true },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  answers: { type: Object }, // Store what student selected
  status: { type: String, default: 'Completed' },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizResult', quizResultSchema);