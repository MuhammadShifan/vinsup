const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'vinsupjwtkey2026', {
    expiresIn: '30d', 
  });
};

module.exports = generateToken;