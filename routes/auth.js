const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
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
    const { fullName, email, password, role } = req.body;

    // Validate dữ liệu đầu vào cơ bản
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc!' });
    }

    if (!['landlord', 'tenant'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò tài khoản không hợp lệ!' });
    }

    // Kiểm tra trùng email
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Địa chỉ email này đã được sử dụng!' });
    }

    // Tạo user mới
    user = new User({
      fullName,
      email,
      password,
      role
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
        phone: user.phone || ''
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
        phone: user.phone || ''
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
      user: req.user
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

module.exports = router;
