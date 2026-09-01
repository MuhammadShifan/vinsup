const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  batch: { type: String, required: true },
  module: { type: String, default: 'General' }, // 🔥 Added this field 🔥
  moduleName: { type: String, default: 'General' }, // 🔥 Added this field 🔥
  totalQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  description: { type: String },
  trainerEmail: { type: String },
  questions: [{
    question: String,
    marks: Number,
    options: [{
      letter: String,
      text: String
    }],
    correct: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);