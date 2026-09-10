const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topics: [{ type: String }] 
});

const syllabusSchema = new mongoose.Schema({
  courseName: { 
    type: String, 
    required: true 
  },
  duration: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  modules: [moduleSchema]
}, { timestamps: true });

module.exports = mongoose.model('Syllabus', syllabusSchema);