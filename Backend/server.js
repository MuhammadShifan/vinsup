require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const http = require('http');
const { Server } = require('socket.io');
const groupChatRoutes = require('./routes/groupChatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const studentRoutes = require('./routes/studentRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const batchChatRoutes = require('./routes/batchChatRoutes');
const Admin = require('./models/Admin');
const PrivateMessage = require('./models/PrivateMessage');
const BatchMessage = require('./models/BatchMessage');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  maxHttpBufferSize: 1e8 // 100 MB buffer for file payloads
});

app.set('io', io);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;


app.get('/', (req, res) => {
  res.send("Vinsup Academy Backend is Running Successfully!");
});


const Employee = require('./models/Employee');


const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const courseRoutes = require('./routes/courseRoutes');
const batchRoutes = require('./routes/batchRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const taskRoutes = require('./routes/taskRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const reportRoutes = require('./routes/reportRoutes');
const privateChatRoutes = require('./routes/privateChatRoutes');
const { protect } = require('./middleware/authMiddleware');


app.use('/api/auth', authRoutes);
app.use('/api/employees', protect, employeeRoutes);
app.use('/api/courses', protect, courseRoutes);
app.use('/api/batches', protect, batchRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/syllabus', protect, syllabusRoutes);
app.use('/api/tasks', protect, taskRoutes);
app.use('/api/tickets', protect, ticketRoutes);
app.use('/api/leaves', protect, leaveRoutes);
app.use('/api/schedule', protect, scheduleRoutes);
app.use('/api/reports', protect, reportRoutes);
app.use('/api/groupchat', protect, groupChatRoutes);
app.use('/api/privatechat', protect, privateChatRoutes);
app.use('/api/notifications', protect, notificationRoutes);
app.use('/api/students', protect, studentRoutes);
app.use('/api/attendance', protect, require('./routes/attendanceRoutes'));
app.use('/api/assessments', protect, assessmentRoutes);
app.use('/api/quizzes', protect, quizRoutes);
app.use('/api/announcements', protect, announcementRoutes);
app.use('/api/batchchat', protect, batchChatRoutes);


app.get('/api/admin/profile', protect, async (req, res) => {
  try {
    let admin = await Admin.findOne({ email: 'muhammasshifan@gmail.com' });
    if (!admin) {
      admin = await Admin.create({
        email: 'muhammasshifan@gmail.com',
        password: 'muhammadshifan2006',
        name: 'Muhammad Shifan',
        phone: '+91 98765 43210',
        profilePhoto: 'https://randomuser.me/api/portraits/men/1.jpg',
        memberSince: 'Jan 15, 2024'
      });
    }
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


app.put('/api/admin/update', protect, async (req, res) => {
  try {
    const { name, profilePhoto } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (profilePhoto) updateData.profilePhoto = profilePhoto;

    const updatedAdmin = await Admin.findOneAndUpdate(
      { email: 'muhammasshifan@gmail.com' },
      { $set: updateData },
      { new: true, upsert: true }
    );
    res.json({ success: true, admin: updatedAdmin, message: "Profile updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


app.put('/api/admin/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    let admin = await Admin.findOne({ email: 'muhammasshifan@gmail.com' });

    if (!admin) {
      admin = await Admin.create({
        email: 'muhammasshifan@gmail.com',
        password: 'muhammadshifan2006',
        name: 'Muhammad Shifan'
      });
    }

    if (admin.password !== currentPassword) {
      return res.status(400).json({ success: false, message: "Incorrect current password!" });
    }

    admin.password = newPassword;
    await admin.save();
    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});





cron.schedule('59 23 * * *', async () => {
  console.log('Running Daily Attendance Reset Job...');
  try {
    const employees = await Employee.find({}).exec();
    const today = new Date().getDay();
    const isWeekend = (today === 0 || today === 6);

    for (let emp of employees) {
      let newTotal = emp.totalWorkingDays || 0;
      let newPresent = emp.presentDays || 0;

      if (!emp.todayCheckIn || emp.todayCheckIn === "-" || emp.todayStatus === "Pending") {
        if (!isWeekend) {
          newTotal += 1;
        }
      }

      const newPercentage = newTotal > 0 ? Math.round((newPresent / newTotal) * 100) : 0;

      await Employee.findByIdAndUpdate(emp._id, {
        $set: {
          todayCheckIn: "-",
          todayCheckOut: "-",
          todayStatus: "Pending",
          totalWorkingDays: newTotal,
          attendancePercentage: newPercentage
        }
      }).exec();
    }
    console.log('Daily Attendance Reset & Calculation Completed!');
  } catch (error) {
    console.error('Cron Job Error:', error);
  }
});


cron.schedule('59 23 * * 0', async () => {
  console.log('Running Weekly Hours Reset Job (Sunday Night)...');
  try {
    await Employee.updateMany({}, { $set: { weeklyWorkedHours: 0 } }).exec();
    console.log('Weekly hours reset successfully for all employees!');
  } catch (err) {
    console.error('Error resetting weekly hours:', err);
  }
});


if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log("MongoDB Connected Successfully");
      const adminExists = await Admin.findOne({ email: 'muhammasshifan@gmail.com' });
      if (!adminExists) {
        await Admin.create({
          email: 'muhammasshifan@gmail.com',
          password: 'muhammadshifan2006',
          name: 'Muhammad Shifan',
          phone: '+91 98765 43210',
          profilePhoto: 'https://randomuser.me/api/portraits/men/1.jpg',
          memberSince: 'Jan 15, 2024'
        });
        console.log("Default Admin Seeded into DB successfully!");
      }
    })
    .catch((error) => console.error("MongoDB Connection Error:", error));
} else {
  console.error("MONGO_URI is missing in Environment Variables!");
}

// 7. Socket.io Event Handling
io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  // Join personal user room (for 1-on-1 chats)
  socket.on('join_user', (rawEmail) => {
    if (!rawEmail) return;
    let email = String(rawEmail).toLowerCase().trim();
    if (email === 'admin') email = 'admin@vinsup.com';
    socket.join(email);
    console.log(`👤 Socket ${socket.id} joined user room: ${email}`);
  });

  // Join & Leave Batch Rooms
  socket.on('join_batch', (rawBatch) => {
    if (!rawBatch) return;
    const batchRoom = `batch_${String(rawBatch).trim()}`;
    socket.join(batchRoom);
    console.log(`👥 Socket ${socket.id} joined batch room: ${batchRoom}`);
  });

  socket.on('leave_batch', (rawBatch) => {
    if (!rawBatch) return;
    const batchRoom = `batch_${String(rawBatch).trim()}`;
    socket.leave(batchRoom);
    console.log(`🚪 Socket ${socket.id} left batch room: ${batchRoom}`);
  });

  // Send Private Message
  socket.on('send_private_message', async (data, callback) => {
    try {
      let senderEmail = String(data.senderEmail || '').toLowerCase().trim();
      let receiverEmail = String(data.receiverEmail || 'admin@vinsup.com').toLowerCase().trim();
      if (senderEmail === 'admin') senderEmail = 'admin@vinsup.com';
      if (receiverEmail === 'admin') receiverEmail = 'admin@vinsup.com';

      const newMessage = new PrivateMessage({
        senderEmail,
        receiverEmail,
        senderName: data.senderName || 'User',
        message: data.message || '',
        file: data.file || null,
        timestamp: new Date(),
        isRead: false
      });
      await newMessage.save();

      // Emit to receiver & sender rooms
      io.to(receiverEmail).emit('receive_private_message', newMessage);
      io.to(senderEmail).emit('receive_private_message', newMessage);

      // Send unread count update to receiver
      const unreadCount = await PrivateMessage.countDocuments({
        receiverEmail,
        isRead: false
      });
      io.to(receiverEmail).emit('unread_count_update', {
        receiverEmail,
        unreadCount,
        senderEmail
      });

      if (typeof callback === 'function') {
        callback({ success: true, data: newMessage });
      }
    } catch (err) {
      console.error('Socket send_private_message error:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // Edit Private Message
  socket.on('edit_private_message', async ({ id, message, senderEmail, receiverEmail }) => {
    try {
      const updatedMsg = await PrivateMessage.findByIdAndUpdate(
        id,
        { message },
        { new: true }
      );
      if (updatedMsg) {
        let sEmail = String(senderEmail || updatedMsg.senderEmail).toLowerCase().trim();
        let rEmail = String(receiverEmail || updatedMsg.receiverEmail).toLowerCase().trim();
        io.to(sEmail).emit('private_message_edited', updatedMsg);
        io.to(rEmail).emit('private_message_edited', updatedMsg);
      }
    } catch (err) {
      console.error('Socket edit_private_message error:', err);
    }
  });

  // Delete Private Message
  socket.on('delete_private_message', async ({ id, senderEmail, receiverEmail }) => {
    try {
      await PrivateMessage.findByIdAndDelete(id);
      let sEmail = String(senderEmail || '').toLowerCase().trim();
      let rEmail = String(receiverEmail || '').toLowerCase().trim();
      if (sEmail) io.to(sEmail).emit('private_message_deleted', { id });
      if (rEmail) io.to(rEmail).emit('private_message_deleted', { id });
    } catch (err) {
      console.error('Socket delete_private_message error:', err);
    }
  });

  // Mark Private Messages Read
  socket.on('mark_private_read', async ({ receiverEmail, senderEmail }) => {
    try {
      let rEmail = String(receiverEmail || '').toLowerCase().trim();
      let sEmail = String(senderEmail || '').toLowerCase().trim();
      if (rEmail === 'admin') rEmail = 'admin@vinsup.com';
      if (sEmail === 'admin') sEmail = 'admin@vinsup.com';

      await PrivateMessage.updateMany(
        { senderEmail: sEmail, receiverEmail: rEmail, isRead: false },
        { $set: { isRead: true } }
      );

      const unreadCount = await PrivateMessage.countDocuments({
        receiverEmail: rEmail,
        isRead: false
      });
      io.to(rEmail).emit('unread_count_update', {
        receiverEmail: rEmail,
        unreadCount,
        senderEmail: sEmail
      });

      io.to(sEmail).emit('private_messages_read', {
        readerEmail: rEmail,
        senderEmail: sEmail
      });
    } catch (err) {
      console.error('Socket mark_private_read error:', err);
    }
  });

  // Send Batch Message
  socket.on('send_batch_message', async (data, callback) => {
    try {
      const { batch, senderName, senderEmail, senderRole, senderAvatar, text, attachments } = data;
      if (!batch || (!text && (!attachments || attachments.length === 0))) {
        if (typeof callback === 'function') callback({ success: false, message: 'Invalid payload' });
        return;
      }

      const newBatchMsg = new BatchMessage({
        batch: String(batch).trim(),
        senderName: senderName || 'User',
        senderEmail: String(senderEmail || '').toLowerCase().trim(),
        senderRole: senderRole || 'Student',
        senderAvatar: senderAvatar || '',
        text: text || '',
        attachments: attachments || [],
        timestamp: new Date()
      });
      await newBatchMsg.save();

      const batchRoom = `batch_${String(batch).trim()}`;
      io.to(batchRoom).emit('receive_batch_message', newBatchMsg);

      if (typeof callback === 'function') {
        callback({ success: true, data: newBatchMsg });
      }
    } catch (err) {
      console.error('Socket send_batch_message error:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// 8. Server Bind
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running with Socket.io on port ${PORT}`);
});
