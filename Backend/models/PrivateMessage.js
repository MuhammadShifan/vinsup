// models/PrivateMessage.js
const mongoose = require('mongoose');

const PrivateMessageSchema = new mongoose.Schema({
    senderEmail: { type: String, required: true },
    receiverEmail: { type: String, required: true },
    senderName: { type: String, required: true },
    
    // 🔥 CHANGE 1: message field optional aakkirukkom (required thookiyachu)
    message: { type: String, default: "" }, 
    
    // 🔥 CHANGE 2: Pudhusa file attachment-kku schema
    file: { 
        fileName: { type: String },
        fileType: { type: String },
        fileData: { type: String } // Base64 string save aagum
    },

    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('PrivateMessage', PrivateMessageSchema);