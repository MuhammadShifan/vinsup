const express = require('express');
const router = express.Router();
const GroupMessage = require('../models/GroupMessage');


router.get('/', async (req, res) => {
    try {
        const messages = await GroupMessage.find().sort({ timestamp: 1 }).limit(50);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post('/send', async (req, res) => {
    try {
        if (!req.body.message && !req.body.file) {
            return res.status(400).json({ success: false, error: "Message or file is required" });
        }

        const newMessage = new GroupMessage({
            senderName: req.body.senderName,
            senderEmail: req.body.senderEmail,
            message: req.body.message || "",
            file: req.body.file || null
        });
        await newMessage.save();
        res.json({ success: true, message: "Message sent to group!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/edit/:id', async (req, res) => {
    try {
        const updatedMsg = await GroupMessage.findByIdAndUpdate(
            req.params.id,
            { message: req.body.message },
            { new: true }
        );
        res.json({ success: true, message: "Message updated!", data: updatedMsg });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/delete/:id', async (req, res) => {
    try {
        await GroupMessage.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Message deleted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;