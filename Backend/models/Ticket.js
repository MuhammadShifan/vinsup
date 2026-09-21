const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  subject: String,
  category: String,
  priority: String,
  description: String,
  date: String,
  status: { type: String, default: 'In Progress', index: true },
  employeeId: { type: String, required: true, index: true } 
});

module.exports = mongoose.model('Ticket', TicketSchema);