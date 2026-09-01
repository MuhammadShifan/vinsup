const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const Employee = require('../models/Employee'); // 🔥 Employee Name edukka import pandrom

// Get tickets ONLY for a specific employee
router.get('/:employeeId', async (req, res) => {
    try {
        const tickets = await Ticket.find({ employeeId: req.params.employeeId });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add ticket for a specific employee & Notify Admin
router.post('/add', async (req, res) => {
    try {
        const { employeeId, subject, category, priority } = req.body;
        
        // 1. Create the Ticket
        const newTicket = new Ticket(req.body);
        await newTicket.save();

        // Employee-oda name-a thedi edukrom (employeeId-la email irukalam illa ID irukalam)
        let empName = employeeId;
        try {
            const emp = await Employee.findOne({ 
                $or: [{ email: employeeId }, { _id: employeeId.match(/^[0-9a-fA-F]{24}$/) ? employeeId : null }] 
            });
            if (emp && (emp.name || emp.fullName || emp.firstName)) {
                empName = emp.name || emp.fullName || emp.firstName;
            }
        } catch (e) {}

        // 2. Create Notification for Admin with Employee Name 🔥
        try {
            const adminNotification = new Notification({
                type: 'helpdesk',
                title: 'New Helpdesk Ticket',
                message: `${empName} raised a new ${priority} ticket regarding "${subject}".`,
                recipientEmail: 'admin' 
            });
            await adminNotification.save();
            console.log("Admin notification saved successfully!");
        } catch (notifErr) {
            console.error("Error creating notification for Admin:", notifErr);
        }

        res.json({ message: "Ticket raised successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Ticket by ID
router.delete('/:id', async (req, res) => {
    try {
        await Ticket.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Ticket deleted successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// 1. Get ALL tickets for Admin Panel (Latest first)
router.get('/', async (req, res) => {
    try {
        const tickets = await Ticket.find().sort({ _id: -1 }); 
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Update Ticket Status (Admin changes from Open -> Resolved) & Notify User
router.put('/:id', async (req, res) => {
    try {
        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );

        // Notify User when ticket status changes 🔥
        if (updatedTicket) {
            try {
                const userNotification = new Notification({
                    type: 'helpdesk',
                    title: 'Ticket Status Updated',
                    message: `Your ticket regarding "${updatedTicket.subject}" is now ${updatedTicket.status}.`,
                    recipientEmail: updatedTicket.employeeId 
                });
                await userNotification.save();
                console.log("User notification saved successfully!");
            } catch (notifErr) {
                console.error("Error creating user notification:", notifErr);
            }
        }

        res.json({ message: "Ticket status updated!", ticket: updatedTicket });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;