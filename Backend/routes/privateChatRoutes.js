const express = require('express');
const router = express.Router();
const PrivateMessage = require('../models/PrivateMessage');


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


router.put('/mark-read', async (req, res) => {
    try {
        let { receiverEmail, senderEmail } = req.body;
        if (receiverEmail === 'admin') receiverEmail = 'admin@vinsup.com';
        if (senderEmail === 'admin') senderEmail = 'admin@vinsup.com';

        await PrivateMessage.updateMany(
            { senderEmail: senderEmail, receiverEmail: receiverEmail, isRead: false },
            { $set: { isRead: true } }
        );

        const io = req.app.get('io');
        if (io) {
            const unreadCount = await PrivateMessage.countDocuments({
                receiverEmail: receiverEmail,
                isRead: false
            });
            io.to(receiverEmail).emit('unread_count_update', {
                receiverEmail: receiverEmail,
                unreadCount,
                senderEmail: senderEmail
            });
            io.to(senderEmail).emit('private_messages_read', {
                readerEmail: receiverEmail,
                senderEmail: senderEmail
            });
        }

        res.json({ success: true, message: "Messages marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post('/send', async (req, res) => {
    try {
        let receiverVal = req.body.receiverEmail || 'admin@vinsup.com';
        let senderEmailVal = req.body.senderEmail || '';
        if (receiverVal === 'admin') receiverVal = 'admin@vinsup.com';
        if (senderEmailVal === 'admin') senderEmailVal = 'admin@vinsup.com';
        const senderNameVal = req.body.senderName || 'Someone';

        if (!req.body.message && !req.body.file) {
            return res.status(400).json({ success: false, error: "Message or file is required" });
        }

        const newMessage = new PrivateMessage({
            senderEmail: senderEmailVal.toLowerCase().trim(),
            receiverEmail: receiverVal.toLowerCase().trim(), 
            senderName: senderNameVal,
            message: req.body.message || "", 
            file: req.body.file || null,    
            isRead: false
        });
        await newMessage.save();

        const io = req.app.get('io');
        if (io) {
            io.to(newMessage.receiverEmail).emit('receive_private_message', newMessage);
            io.to(newMessage.senderEmail).emit('receive_private_message', newMessage);

            const unreadCount = await PrivateMessage.countDocuments({
                receiverEmail: newMessage.receiverEmail,
                isRead: false
            });
            io.to(newMessage.receiverEmail).emit('unread_count_update', {
                receiverEmail: newMessage.receiverEmail,
                unreadCount,
                senderEmail: newMessage.senderEmail
            });
        }

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

        const io = req.app.get('io');
        if (io && updatedMsg) {
            io.to(updatedMsg.senderEmail).emit('private_message_edited', updatedMsg);
            io.to(updatedMsg.receiverEmail).emit('private_message_edited', updatedMsg);
        }

        res.json({ success: true, data: updatedMsg });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/delete/:id', async (req, res) => {
    try {
        const deleted = await PrivateMessage.findByIdAndDelete(req.params.id);
        const io = req.app.get('io');
        if (io && deleted) {
            io.to(deleted.senderEmail).emit('private_message_deleted', { id: req.params.id });
            io.to(deleted.receiverEmail).emit('private_message_deleted', { id: req.params.id });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;