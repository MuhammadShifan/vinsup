const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Notification = require('../models/Notification'); 
const Employee = require('../models/Employee'); 


router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }); 
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/employee/:employeeId', async (req, res) => {
  try {
    const tasks = await Task.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const newTask = new Task(req.body); 
    await newTask.save();

    const assignedToVal = newTask.assignedTo || newTask.employeeId || newTask.email;
    
    if (assignedToVal) {
      try {
        const assigneeVal = String(assignedToVal).trim();
        const recipients = [assigneeVal]; 

        let emp = null;
        if (assigneeVal.match(/^[0-9a-fA-F]{24}$/)) {
          emp = await Employee.findById(assigneeVal);
        } else if (assigneeVal.includes('@')) {
          emp = await Employee.findOne({ email: assigneeVal });
        } else {
          emp = await Employee.findOne({ 
            $or: [
              { name: { $regex: new RegExp('^' + assigneeVal + '$', 'i') } },
              { fullName: { $regex: new RegExp('^' + assigneeVal + '$', 'i') } },
              { firstName: { $regex: new RegExp('^' + assigneeVal + '$', 'i') } },
              { username: { $regex: new RegExp('^' + assigneeVal + '$', 'i') } }
            ]
          });
        }

        if (emp) {
          if (emp.email && !recipients.includes(emp.email)) recipients.push(emp.email);
          if (emp.username && !recipients.includes(emp.username)) recipients.push(emp.username);
          if (emp.name && !recipients.includes(emp.name)) recipients.push(emp.name);
        }

        for (const recipient of recipients) {
          const userNotification = new Notification({
            type: 'task',
            title: 'New Task Allocated',
            message: `You have been assigned a new task: "${newTask.title || newTask.taskName || 'Task'}".`,
            recipientEmail: recipient
          });
          await userNotification.save();
        }
      } catch (notifErr) {
        console.error("Error sending task notification:", notifErr);
      }
    }

    res.json({ message: "Task added successfully!", task: newTask });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true }
    );
    res.json({ message: "Task updated successfully!", task: updatedTask });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;