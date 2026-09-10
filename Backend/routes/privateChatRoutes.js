const express = require('express');
const router = express.Router();
const PrivateMessage = require('../models/PrivateMessage');


router.get('/:userEmail', async (req, res) => {
    try {
        const userEmail = req.params.userEmail.toLowerCase().trim();
        const adminEmail = 'admin@vinsup.com'; 

        const messages = await PrivateMessage.find({
            $or: [
                { senderEmail: userEmail, receiverEmail: adminEmail },
                { senderEmail: adminEmail, receiverEmail: userEmail }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/unread/:userEmail', async (req, res) => {
    try {
        let userEmail = req.params.userEmail.toLowerCase().trim();
        if (userEmail === 'admin') userEmail = 'admin@vinsup.com';

        const unreadCount = await PrivateMessage.countDocuments({
            receiverEmail: userEmail,
            isRead: false
        });

        res.json({ success: true, unreadCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/unread-senders/:receiverEmail', async (req, res) => {
    try {
        let receiverEmail = req.params.receiverEmail.toLowerCase().trim();
        if (receiverEmail === 'admin') receiverEmail = 'admin@vinsup.com';

        const unreadCounts = await PrivateMessage.aggregate([
            { $match: { receiverEmail: receiverEmail, isRead: false } },
            { $group: { _id: "$senderEmail", count: { $sum: 1 } } }
        ]);

        const countsMap = {};
        unreadCounts.forEach(item => {
            countsMap[item._id] = item.count; 
        });

        res.json({ success: true, counts: countsMap });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/mark-read', async (req, res) => {
    try {
        let { receiverEmail, senderEmail } = req.body;
        if (receiverEmail === 'admin') receiverEmail = 'admin@vinsup.com';
        if (senderEmail === 'admin') senderEmail = 'admin@vinsup.com';

        await PrivateMessage.updateMany(
            { senderEmail: senderEmail, receiverEmail: receiverEmail, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true, message: "Messages marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post('/send', async (req, res) => {
    try {
        const receiverVal = req.body.receiverEmail || 'admin@vinsup.com';
        const senderNameVal = req.body.senderName || 'Someone';
        if (!req.body.message && !req.body.file) {
            return res.status(400).json({ success: false, error: "Message or file is required" });
        }

        const newMessage = new PrivateMessage({
            senderEmail: req.body.senderEmail,
            receiverEmail: receiverVal, 
            senderName: senderNameVal,
            message: req.body.message || "", 
            file: req.body.file || null,    
            isRead: false
        });
        await newMessage.save();
        res.json({ success: true, message: newMessage });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/edit/:id', async (req, res) => {
    try {
        const updatedMsg = await PrivateMessage.findByIdAndUpdate(
            req.params.id,
            { message: req.body.message },
            { new: true }
        );
        res.json({ success: true, data: updatedMsg });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/delete/:id', async (req, res) => {
    try {
        await PrivateMessage.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;