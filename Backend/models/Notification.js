const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    type: { type: String, required: true }, 
    title: { type: String, required: true }, 
    message: { type: String, required: true },
    recipientEmail: { type: String, default: 'admin' },
    isRead: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);