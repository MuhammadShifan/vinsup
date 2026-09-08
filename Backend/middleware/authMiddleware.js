const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Header-la 'Authorization: Bearer <token>' irukka nu check panrom
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Token-a mattum thaniya pirichu edukrom
      token = req.headers.authorization.split(' ')[1];

      // Token sariyana secret key vachu thaan create aagirukka nu verify panrom
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Request-la user details-a attach panrom (Next routes-la use pannikka)
      req.user = decoded; 
      
      // Token correct-a irundha, adhutha velaiya paarka (route-kku poga) allow panrom
      next(); 
    } catch (error) {
      console.error("Token Error:", error);
      return res.status(401).json({ success: false, message: "Not authorized, token failed!" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided!" });
  }
};

module.exports = { protect };