const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  audienceType: { type: String, required: true, enum: ['All Students', 'By Batch'] },
  targetBatch: { type: String },
  publishDate: { type: String, required: true },
  publishTime: { type: String, required: true },
  sentBy: { type: String, required: true },
  trainerId: { type: String, required: true },
  status: { type: String, default: 'Published' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);