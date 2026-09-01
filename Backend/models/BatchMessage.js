const mongoose = require('mongoose');

const batchMessageSchema = new mongoose.Schema({
  batch: { type: String, required: true }, 
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  senderRole: { type: String, enum: ['Trainer', 'Student', 'Admin'], required: true },
  senderAvatar: { type: String, default: "" }, 
  text: { type: String, default: "" },
  
  // 🔥 NEW: Multiple Files support pandra Array 🔥
  attachments: [{
    fileData: { type: String }, 
    fileName: { type: String }, 
    fileType: { type: String }
  }],

  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BatchMessage', batchMessageSchema);