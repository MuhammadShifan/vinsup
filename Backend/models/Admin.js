const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Muhammad Shifan' },
  phone: { type: String, default: '+91 98765 43210' },
  profilePhoto: { type: String, default: 'https://randomuser.me/api/portraits/men/1.jpg' },
  memberSince: { type: String, default: 'Jan 15, 2024' }
});

module.exports = mongoose.model('Admin', adminSchema);