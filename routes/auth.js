const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const DeviceToken = require('../models/DeviceToken');
const auth = require('../middleware/auth');
const { sendResetPasswordOtpEmail } = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'safeflame_secret_key_12345';

// @route   POST /api/auth/register
// @desc    Đăng ký tài khoản mới (Chủ trọ hoặc Người thuê)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role, deviceId, roomName } = req.body;

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Địa chỉ email không hợp lệ!' });
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự!' });
    }

    // Kiểm tra email đã tồn tại
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email này đã được sử dụng!' });
    }

    const cleanDeviceId = deviceId ? String(deviceId).trim() : 'DEFAULT_DEV';
    const cleanRoomName = roomName ? String(roomName).trim() : 'Phòng ' + cleanDeviceId;

    // Tạo người dùng mới
    user = new User({
      fullName,
      email,
      password,
      role: role || 'tenant',
      assignedDeviceId: cleanDeviceId,
      roomName: cleanRoomName,
      assignedDevices: [cleanDeviceId]
    });

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Tạo token JWT
    const payload = { userId: user._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      status: 'success',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        assignedDeviceId: user.assignedDeviceId,
        roomName: user.roomName,
        assignedDevices: user.assignedDevices
      }
    });

  } catch (err) {
    console.error('Lỗi khi Đăng ký:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route   POST /api/auth/login
// @desc    Đăng nhập tài khoản
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate dữ liệu đầu vào cơ bản
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền email và mật khẩu!' });
    }

    // Kiểm tra tài khoản tồn tại
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác!' });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác!' });
    }

    // Tạo token JWT
    const payload = { userId: user._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        assignedDeviceId: user.assignedDeviceId || 'DEFAULT_DEV',
        roomName: user.roomName || 'Phòng của tôi',
        assignedDevices: user.assignedDevices || [user.assignedDeviceId || 'DEFAULT_DEV']
      }
    });

  } catch (err) {
    console.error('Lỗi khi Đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route   GET /api/auth/me
// @desc    Lấy thông tin tài khoản hiện tại từ token JWT
// @access  Private (Cần Token)
router.get('/me', auth, async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone || '',
        assignedDeviceId: req.user.assignedDeviceId || 'DEFAULT_DEV',
        roomName: req.user.roomName || 'Phòng của tôi',
        assignedDevices: req.user.assignedDevices || [req.user.assignedDeviceId || 'DEFAULT_DEV']
      }
    });
  } catch (err) {
    console.error('Lỗi lấy thông tin tài khoản:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route   POST /api/auth/google
// @desc    Đăng nhập hoặc Đăng ký nhanh bằng Google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Thiếu Google ID Token!' });
    }

    let payload;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ message: 'Cấu hình máy chủ thiếu GOOGLE_CLIENT_ID!' });
    }
    
    try {
      // Xác thực ID Token thực tế qua Google API
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error('Lỗi xác thực Google ID Token:', err);
      return res.status(400).json({ message: 'Xác thực tài khoản Google không thành công hoặc Token đã hết hạn!' });
    }

    const { email, name } = payload;
    if (!email) {
      return res.status(400).json({ message: 'Token không chứa thông tin email hợp lệ!' });
    }

    // Tìm xem tài khoản đã tồn tại chưa
    let user = await User.findOne({ email });

    if (!user) {
      // Tạo tài khoản mới mặc định là tenant
      user = new User({
        fullName: name || 'Google User',
        email,
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
        role: 'tenant'
      });
      await user.save();
    }

    // Tạo token JWT
    const jwtPayload = { userId: user._id };
    const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone || ''
      }
    });

  } catch (err) {
    console.error('Lỗi đăng nhập Google:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Yêu cầu gửi OTP đặt lại mật khẩu qua email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email!' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản liên kết với địa chỉ email này!' });
    }

    // Tạo mã OTP 6 chữ số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP và thời gian hết hạn (10 phút) vào DB
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Gửi email
    await sendResetPasswordOtpEmail(user.email, otp);

    res.status(200).json({ message: 'Mã xác minh OTP đã được gửi đến email của bạn.' });
  } catch (err) {
    console.error('Lỗi yêu cầu OTP đổi mật khẩu:', err);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Xác minh mã OTP và đặt lại mật khẩu mới
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ các thông tin: Email, OTP và Mật khẩu mới!' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự!' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordOtp: otp,
      resetPasswordOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Mã OTP không chính xác hoặc đã hết hạn!' });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Xóa OTP
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới!' });
  } catch (err) {
    console.error('Lỗi đặt lại mật khẩu qua OTP:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Cập nhật Họ tên và Số điện thoại hồ sơ người dùng
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    
    if (!fullName) {
      return res.status(400).json({ message: 'Họ tên không được để trống!' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại!' });
    }

    user.fullName = fullName.trim();
    user.phone = (phone || '').trim();
    await user.save();

    res.status(200).json({
      message: 'Cập nhật thông tin tài khoản thành công.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone || ''
      }
    });
  } catch (err) {
    console.error('Lỗi cập nhật hồ sơ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Đổi mật khẩu trực tiếp (yêu cầu điền mật khẩu cũ)
// @access  Private
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới!' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự!' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại!' });
    }

    // So sánh mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
  } catch (err) {
    console.error('Lỗi đổi mật khẩu trực tiếp:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route   POST /api/auth/fcm-token
// @desc    Lưu Token thiết bị nhận thông báo đẩy Firebase FCM (Hỗ trợ cả người dùng đã đăng nhập và chưa đăng nhập)
// @access  Public / Optional Auth
router.post('/fcm-token', async (req, res) => {
  try {
    const { fcmToken, platform, deviceId } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ message: 'Thiếu trường fcmToken!' });
    }

    let userId = null;
    let targetDeviceId = deviceId ? String(deviceId).trim() : null;

    const authHeader = req.header('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.user?.id || decoded.id || decoded.userId;
      } catch (e) {
        // Token không hợp lệ thì vẫn lưu token thiết bị dưới dạng ẩn danh
      }
    }

    // Nếu chưa có targetDeviceId nhưng có userId, lấy assignedDeviceId của user
    if (!targetDeviceId && userId) {
      const u = await User.findById(userId, 'assignedDeviceId');
      if (u && u.assignedDeviceId) {
        targetDeviceId = u.assignedDeviceId;
      }
    }
    if (!targetDeviceId) {
      targetDeviceId = 'DEFAULT_DEV';
    }

    // 1. Lưu vào bảng DeviceToken độc lập
    await DeviceToken.findOneAndUpdate(
      { token: fcmToken },
      {
        token: fcmToken,
        userId: userId,
        deviceId: targetDeviceId,
        platform: platform || 'android',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 2. Nếu có userId, gán vào User model
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { fcmTokens: fcmToken }
      });
      console.log(`📱 Đã đăng ký FCM Token cho tài khoản ${userId} (Thiết bị: ${targetDeviceId})`);
    } else {
      console.log(`📱 Đã đăng ký FCM Token thiết bị ẩn danh: ${fcmToken.substring(0, 15)}... (Thiết bị: ${targetDeviceId})`);
    }

    res.status(200).json({ status: 'success', message: 'Đã lưu FCM Token thành công!', deviceId: targetDeviceId });
  } catch (err) {
    console.error('Lỗi lưu FCM Token:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route   PUT /api/auth/assign-device
// @desc    Liên kết hoặc thay đổi mã thiết bị phòng (Device ID) cho người dùng
// @access  Private
router.put('/assign-device', auth, async (req, res) => {
  try {
    const { deviceId, roomName } = req.body;
    if (!deviceId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã thiết bị (deviceId)!' });
    }

    const cleanDeviceId = String(deviceId).trim().toUpperCase();
    const cleanRoomName = roomName ? String(roomName).trim() : ('Phòng ' + cleanDeviceId);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản!' });
    }

    user.assignedDeviceId = cleanDeviceId;
    user.roomName = cleanRoomName;

    if (!user.assignedDevices) user.assignedDevices = [];
    if (!user.assignedDevices.includes(cleanDeviceId)) {
      user.assignedDevices.push(cleanDeviceId);
    }

    await user.save();

    // Cập nhật lại deviceId trong bảng DeviceToken của tài khoản này
    await DeviceToken.updateMany(
      { userId: user._id },
      { deviceId: cleanDeviceId }
    );

    console.log(`🔗 Tài khoản ${user.email} đã chuyển sang thiết bị: ${cleanDeviceId} (${cleanRoomName})`);

    res.status(200).json({
      status: 'success',
      message: `Đã liên kết thành công với thiết bị [${cleanDeviceId}]!`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        assignedDeviceId: user.assignedDeviceId,
        roomName: user.roomName,
        assignedDevices: user.assignedDevices
      }
    });
  } catch (err) {
    console.error('Lỗi liên kết thiết bị:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

module.exports = router;
