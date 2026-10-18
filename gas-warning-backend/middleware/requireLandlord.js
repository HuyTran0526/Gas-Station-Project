// middleware/requireLandlord.js
// Middleware đảm bảo chỉ tài khoản có vai trò 'landlord' (Chủ trọ) mới được truy cập

module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
  }

  if (req.user.role !== 'landlord') {
    return res.status(403).json({
      status: 'forbidden',
      message: 'Từ chối truy cập: Chức năng quản trị này chỉ dành riêng cho Chủ Trọ!'
    });
  }

  next();
};
