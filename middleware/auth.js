const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'safeflame_secret_key_12345';

module.exports = async (req, res, next) => {
  try {
    
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'Không tìm thấy token xác thực. Truy cập bị từ chối!' });
    }

    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Định dạng token không đúng. Truy cập bị từ chối!' });
    }

    
    const decoded = jwt.verify(token, JWT_SECRET);

    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Không tìm thấy người dùng sở hữu token này.' });
    }

    
    req.user = user;
    next();
  } catch (err) {
    console.error('Lỗi xác thực JWT Middleware:', err.message);
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
  }
};
