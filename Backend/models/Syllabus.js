const mongoose = require('mongoose');

// Sub-schema for dynamic modules and topics
const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topics: [{ type: String }] // Array of strings for topics
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
  modules: [moduleSchema] // Array of module objects
}, { timestamps: true });

module.exports = mongoose.model('Syllabus', syllabusSchema);