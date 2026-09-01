const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Employee = require('../models/Employee');

const NotificationSchema = new mongoose.Schema({
    type: { type: String, required: true }, 
    title: { type: String, required: true }, 
    message: { type: String, required: true },
    recipientEmail: { type: String, default: 'admin' },
    isRead: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// Add Notification with Duplicate Prevention 🔥
router.post('/add', async (req, res) => {
    try {
        const { type, title, message, recipientEmail } = req.body;
        const formattedEmail = recipientEmail ? recipientEmail.toLowerCase().trim() : 'admin';

        // 🔥 PUDHU FIX: Check if an identical notification was sent in the last 10 seconds to prevent duplicates 🔥
        const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
        const existingDuplicate = await Notification.findOne({
            type,
            title,
            message,
            recipientEmail: formattedEmail,
            timestamp: { $gte: tenSecondsAgo }
        });

        if (existingDuplicate) {
            console.log("Duplicate notification ignored:", title);
            return res.status(200).json({ success: true, message: "Duplicate notification ignored." });
        }

        const newNotification = new Notification({
            type,
            title,
            message,
            recipientEmail: formattedEmail,
            isRead: false,
            timestamp: new Date()
        });
        await newNotification.save();
        res.status(201).json({ success: true, message: "Notification sent successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 1. Fetch Notifications for a specific user (or 'admin')
router.get('/user/:email', async (req, res) => {
    try {
        const email = req.params.email.toLowerCase().trim();
        const notifications = await Notification.find({ recipientEmail: email }).sort({ timestamp: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Mark Notification as Read, Resolve Ticket & Notify User
router.put('/mark-read/:id', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (notification) {
            notification.isRead = true;
            await notification.save();

            if (notification.type === 'helpdesk') {
                const msg = notification.message;
                const nameMatch = msg.match(/^(.+?)\s+raised a new/);

                if (nameMatch && nameMatch[1]) {
                    const empName = nameMatch[1].trim();
                    
                    const emp = await Employee.findOne({ 
                        $or: [
                            { name: new RegExp('^' + empName + '$', 'i') }, 
                            { fullName: new RegExp('^' + empName + '$', 'i') },
                            { firstName: new RegExp('^' + empName + '$', 'i') }
                        ] 
                    });

                    if (emp && emp.email) {
                        const userEmail = emp.email;

                        const resolvedTicket = await Ticket.findOneAndUpdate(
                            { employeeId: userEmail, status: { $ne: 'Resolved' } },
                            { status: 'Resolved' },
                            { new: true, sort: { _id: -1 } }
                        );

                        if (resolvedTicket) {
                            // Check duplicate for helpdesk as well inside code block if needed
                            const userNotification = new Notification({
                                type: 'helpdesk',
                                title: 'Ticket Resolved',
                                message: `Your ticket regarding "${resolvedTicket.subject}" has been resolved by Admin.`,
                                recipientEmail: userEmail
                            });
                            await userNotification.save();
                        }
                    }
                }
            }
        }

        res.json({ success: true, message: 'Notification marked as read, ticket resolved and user notified!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Delete Notification Route
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNotification = await Notification.findByIdAndDelete(id);
        
        if (!deletedNotification) {
            return res.status(404).json({ success: false, message: "Notification not found!" });
        }

        res.json({ success: true, message: "Notification deleted successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;