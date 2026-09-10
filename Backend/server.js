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
const Admin = require('./models/Admin'); 
const app = express();


app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;


app.get('/', (req, res) => {
  res.send("Vinsup Academy Backend is Running Successfully!");
});


const Report = require('./models/Report'); 
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


app.get('/api/reports', protect, async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).exec(); 
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/reports', protect, async (req, res) => {
  try {
    const newReport = new Report(req.body);
    await newReport.save();
    res.status(201).json(newReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
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

// 7. Server Bind
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});