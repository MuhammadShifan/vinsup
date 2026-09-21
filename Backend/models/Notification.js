const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    type: { type: String, required: true }, 
    title: { type: String, required: true }, 
    message: { type: String, required: true },
    recipientEmail: { type: String, default: 'admin', index: true },
    isRead: { type: Boolean, default: false, index: true },
    timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);