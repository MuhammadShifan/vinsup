const express = require('express');
const router = express.Router();
const BatchMessage = require('../models/BatchMessage');


router.get('/:batch', async (req, res) => {
  try {
    const messages = await BatchMessage.find({ batch: req.params.batch }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.post('/send', async (req, res) => {
  try {
    const { batch, senderName, senderEmail, senderRole, senderAvatar, text, attachments } = req.body;
    if (!batch || (!text && (!attachments || attachments.length === 0))) {
      return res.status(400).json({ success: false, message: 'Batch and content (text or file) are required' });
    }

    const newMessage = new BatchMessage({
      batch: String(batch).trim(), 
      senderName, 
      senderEmail, 
      senderRole, 
      senderAvatar, 
      text, 
      attachments
    });

    await newMessage.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`batch_${String(batch).trim()}`).emit('receive_batch_message', newMessage);
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;