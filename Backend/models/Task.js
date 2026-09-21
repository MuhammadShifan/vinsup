const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String }, 
  priority: { type: String, default: 'Medium' },  
  status: { type: String, default: 'In Progress', index: true }, 
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  assignedTo: { type: String, index: true }, 
  role: { type: String },       
  category: { type: String }    
}, { timestamps: true }); 

module.exports = mongoose.model('Task', TaskSchema);