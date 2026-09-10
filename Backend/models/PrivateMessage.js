const mongoose = require('mongoose');

const PrivateMessageSchema = new mongoose.Schema({
    senderEmail: { type: String, required: true },
    receiverEmail: { type: String, required: true },
    senderName: { type: String, required: true },
    message: { type: String, default: "" }, 
    file: { 
        fileName: { type: String },
        fileType: { type: String },
        fileData: { type: String } 
    },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('PrivateMessage', PrivateMessageSchema);