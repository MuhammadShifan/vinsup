const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  subject: String,
  category: String,
  priority: String,
  description: String,
  date: String,
  status: { type: String, default: 'In Progress' },
  employeeId: { type: String, required: true } // 🔥 ObjectId-la irundhu String-ku mathiyachu 🔥
});

module.exports = mongoose.model('Ticket', TicketSchema);