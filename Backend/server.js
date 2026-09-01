const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const groupChatRoutes = require('./routes/groupChatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const studentRoutes = require('./routes/studentRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const batchChatRoutes = require('./routes/batchChatRoutes');
const Admin = require('./models/Admin'); // 🔥 Admin Model import pannirukken 🔥

const app = express();

// 1. Middleware Order
app.use(cors());

// 🔥 FILE ATTACHMENT-KKU PAYLOAD SIZE LIMIT 50MB INCREASE PANNIRUKEN 🔥
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. Environment variables
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

// Root Health Check Route
app.get('/', (req, res) => {
  res.send("Vinsup Academy Backend is Running Successfully!");
});

// 3. Models import
const Report = require('./models/Report'); 
const Employee = require('./models/Employee'); 

// 4. Routes import
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

// 5. API URLs set
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes); 
app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/leaves', leaveRoutes); 
app.use('/api/schedule', scheduleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/groupchat', groupChatRoutes);
app.use('/api/privatechat', privateChatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/assessments', assessmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/batchchat', batchChatRoutes);

// ==========================================
// 🔥 ADMIN SETTINGS & PROFILE API ROUTES 🔥
// ==========================================

// Get Admin Profile
app.get('/api/admin/profile', async (req, res) => {
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

// Update Admin Name / Photo
app.put('/api/admin/update', async (req, res) => {
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

// Update Admin Password
app.put('/api/admin/change-password', async (req, res) => {
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

// REPORTS API ROUTES
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).exec(); 
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const newReport = new Report(req.body);
    await newReport.save();
    res.status(201).json(newReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Cron job 1: Daily Attendance
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

// Cron job 2: Weekly Hours Reset
cron.schedule('59 23 * * 0', async () => {
  console.log('Running Weekly Hours Reset Job (Sunday Night)...');
  try {
    await Employee.updateMany({}, { $set: { weeklyWorkedHours: 0 } }).exec();
    console.log('Weekly hours reset successfully for all employees!');
  } catch (err) {
    console.error('Error resetting weekly hours:', err);
  }
});

// 6. MongoDB Connection & Default Admin Auto-Seed
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log("MongoDB Connected Successfully");
      
      // Seed default admin if not exists
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

// 7. Server Bind
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});