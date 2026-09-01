const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  moduleOrTopic: { type: String, required: true },
  assignmentType: { type: String, required: true },
  dueDate: { type: String, required: true },
  dueTime: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  attachment: { type: String }, // File path upload aana idhula save aagum
  instructions: { type: String },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Published' },
  createdBy: { type: String, required: true } // Trainer Email or ID
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);