const mongoose = require('mongoose');

const GroupMessageSchema = new mongoose.Schema({
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    message: { type: String, default: "" },
    file: { 
        fileName: { type: String },
        fileType: { type: String },
        fileData: { type: String }
    },

    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupMessage', GroupMessageSchema);