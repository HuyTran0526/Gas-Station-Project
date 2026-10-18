const express = require('express');
const bcrypt = require('bcryptjs');
const DeviceState = require('../models/DeviceState');
const User = require('../models/User');
const DeviceToken = require('../models/DeviceToken');
const GasLog = require('../models/GasLog');
const requireLandlord = require('../middleware/requireLandlord');

const router = express.Router();

// Tất cả các route bên dưới bắt buộc phải qua requireLandlord
router.use(requireLandlord);

// ==========================================
// 1. TỔNG QUAN HỆ THỐNG (OVERVIEW STATS)
// ==========================================

// @route   GET /api/admin/overview
// @desc    Lấy thống kê tổng quan và danh sách phòng kèm người thuê
// @access  Landlord Only
router.get('/overview', async (req, res) => {
  try {
    const devices = await DeviceState.find({ deviceId: { $exists: true, $nin: [null, ''] } }).sort({ updatedAt: -1 });
    const tenants = await User.find({ role: 'tenant' }).select('-password').sort({ createdAt: -1 });

    const now = new Date();
    let onlineCount = 0;
    let dangerCount = 0;

    // Map người thuê vào từng thiết bị
    const devicesWithTenants = devices.map(d => {
      const isOnline = d.updatedAt ? (now - new Date(d.updatedAt)) < 15000 : false;
      if (isOnline) onlineCount++;
      if (d.isDangerMode || d.ppm >= 600) dangerCount++;

      const assignedTenants = tenants.filter(t => 
        t.assignedDeviceId === d.deviceId || 
        (t.assignedDevices && t.assignedDevices.includes(d.deviceId))
      );

      return {
        id: d._id,
        deviceId: d.deviceId,
        deviceName: d.deviceName || d.deviceId,
        location: d.location || '',
        ppm: d.ppm,
        isOpen: d.isOpen,
        isOn: d.isOn,
        isBuzzerMuted: d.isBuzzerMuted,
        isDangerMode: d.isDangerMode,
        isOnline,
        updatedAt: d.updatedAt,
        tenants: assignedTenants.map(t => ({
          id: t._id,
          fullName: t.fullName,
          email: t.email,
          phone: t.phone
        }))
      };
    });

    res.status(200).json({
      status: 'success',
      stats: {
        totalRooms: devices.length,
        onlineRooms: onlineCount,
        dangerRooms: dangerCount,
        totalTenants: tenants.length
      },
      devices: devicesWithTenants,
      tenants
    });
  } catch (err) {
    console.error('Lỗi GET /api/admin/overview:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ: ' + err.message });
  }
});

// @route   GET /api/admin/analytics
// @desc    Lấy thống kê lượt truy cập từ Facebook, TikTok, Direct
// @access  Landlord Only
const TrafficLog = require('../models/TrafficLog');
router.get('/analytics', async (req, res) => {
  try {
    const totalClicks = await TrafficLog.countDocuments();
    const facebookClicks = await TrafficLog.countDocuments({ source: 'facebook' });
    const tiktokClicks = await TrafficLog.countDocuments({ source: 'tiktok' });
    const directClicks = await TrafficLog.countDocuments({ source: { $nin: ['facebook', 'tiktok'] } });

    // 20 lượt click gần nhất
    const recentLogs = await TrafficLog.find().sort({ createdAt: -1 }).limit(20);

    // Thống kê theo loại thiết bị
    const mobileClicks = await TrafficLog.countDocuments({ device: 'mobile' });
    const desktopClicks = await TrafficLog.countDocuments({ device: 'desktop' });

    res.status(200).json({
      status: 'success',
      totalClicks,
      facebookClicks,
      tiktokClicks,
      directClicks,
      mobileClicks,
      desktopClicks,
      recentLogs
    });
  } catch (err) {
    console.error('Lỗi GET /api/admin/analytics:', err);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// ==========================================
// 2. QUẢN LÝ PHÒNG & THIẾT BỊ (CRUD DEVICES)
// ==========================================

// @route   GET /api/admin/devices
// @desc    Lấy danh sách tất cả các phòng / thiết bị
// @access  Landlord Only
router.get('/devices', async (req, res) => {
  try {
    const devices = await DeviceState.find({ deviceId: { $exists: true, $nin: [null, ''] } }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', devices });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// @route   POST /api/admin/devices
// @desc    Thêm một phòng / thiết bị mới vào hệ thống
// @access  Landlord Only
router.post('/devices', async (req, res) => {
  try {
    const { deviceId, deviceName, location } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã thiết bị (Device ID)!' });
    }

    const cleanDeviceId = String(deviceId).trim().toUpperCase();
    const cleanDeviceName = deviceName ? String(deviceName).trim() : `Phòng ${cleanDeviceId}`;
    const cleanLocation = location ? String(location).trim() : 'Khu vực bếp';

    // Kiểm tra trùng lặp
    const existing = await DeviceState.findOne({ deviceId: cleanDeviceId });
    if (existing) {
      return res.status(400).json({ message: `Mã thiết bị [${cleanDeviceId}] đã tồn tại trong hệ thống!` });
    }

    const newDevice = new DeviceState({
      deviceId: cleanDeviceId,
      deviceName: cleanDeviceName,
      location: cleanLocation,
      ppm: 350,
      isOpen: true,
      isOn: false,
      isBuzzerMuted: true,
      isDangerMode: false
    });

    await newDevice.save();

    console.log(`🏢 Chủ trọ [${req.user.email}] đã thêm phòng mới: [${cleanDeviceId}] - ${cleanDeviceName}`);

    res.status(201).json({
      status: 'success',
      message: `Đã thêm phòng [${cleanDeviceName}] thành công!`,
      device: newDevice
    });
  } catch (err) {
    console.error('Lỗi POST /api/admin/devices:', err);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// @route   PUT /api/admin/devices/:deviceId
// @desc    Cập nhật tên phòng, vị trí
// @access  Landlord Only
router.put('/devices/:deviceId', async (req, res) => {
  try {
    const targetId = req.params.deviceId.trim().toUpperCase();
    const { deviceName, location } = req.body;

    const device = await DeviceState.findOne({ deviceId: targetId });
    if (!device) {
      return res.status(404).json({ message: `Không tìm thấy thiết bị [${targetId}]!` });
    }

    if (deviceName) device.deviceName = String(deviceName).trim();
    if (location) device.location = String(location).trim();

    await device.save();

    // Cập nhật lại roomName cho những người thuê đang gán vào phòng này
    if (deviceName) {
      await User.updateMany(
        { assignedDeviceId: targetId },
        { roomName: device.deviceName }
      );
    }

    res.status(200).json({
      status: 'success',
      message: `Đã cập nhật thông tin phòng [${device.deviceName}] thành công!`,
      device
    });
  } catch (err) {
    console.error('Lỗi PUT /api/admin/devices/:deviceId:', err);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// @route   DELETE /api/admin/devices/:deviceId
// @desc    Xóa phòng / thiết bị khỏi hệ thống
// @access  Landlord Only
router.delete('/devices/:deviceId', async (req, res) => {
  try {
    const targetId = req.params.deviceId.trim().toUpperCase();

    if (targetId === 'DEFAULT_DEV') {
      return res.status(400).json({ message: 'Không thể xóa Trạm mặc định (DEFAULT_DEV) của hệ thống!' });
    }

    const device = await DeviceState.findOneAndDelete({ deviceId: targetId });
    if (!device) {
      return res.status(404).json({ message: `Không tìm thấy thiết bị [${targetId}]!` });
    }

    // Đưa những người thuê phòng này về trạng thái Chưa gán hoặc DEFAULT_DEV
    await User.updateMany(
      { assignedDeviceId: targetId },
      { 
        assignedDeviceId: 'DEFAULT_DEV',
        roomName: 'Chưa gán phòng (Mặc định)',
        $pull: { assignedDevices: targetId }
      }
    );

    // Xóa logs liên quan
    await GasLog.deleteMany({ deviceId: targetId });
    await DeviceToken.deleteMany({ deviceId: targetId });

    console.log(`🗑️ Chủ trọ [${req.user.email}] đã xóa phòng [${targetId}]`);

    res.status(200).json({
      status: 'success',
      message: `Đã xóa thiết bị phòng [${targetId}] thành công!`
    });
  } catch (err) {
    console.error('Lỗi DELETE /api/admin/devices/:deviceId:', err);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// ==========================================
// 3. QUẢN LÝ NGƯỜI THUÊ (CRUD TENANTS)
// ==========================================

// @route   GET /api/admin/tenants
// @desc    Lấy danh sách tất cả người thuê trọ
// @access  Landlord Only
router.get('/tenants', async (req, res) => {
  try {
    const tenants = await User.find({ role: 'tenant' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', tenants });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// @route   POST /api/admin/tenants
// @desc    Tạo tài khoản người thuê mới trực tiếp từ trang Admin
// @access  Landlord Only
router.post('/tenants', async (req, res) => {
  try {
    const { fullName, email, password, phone, deviceId } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp Họ tên, Email và Mật khẩu!' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email này đã tồn tại trong hệ thống!' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự!' });
    }

    let cleanDeviceId = 'DEFAULT_DEV';
    let cleanRoomName = 'Chưa gán phòng';

    if (deviceId) {
      cleanDeviceId = String(deviceId).trim().toUpperCase();
      const devDoc = await DeviceState.findOne({ deviceId: cleanDeviceId });
      cleanRoomName = devDoc ? devDoc.deviceName : `Phòng ${cleanDeviceId}`;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newTenant = new User({
      fullName: fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'tenant',
      phone: (phone || '').trim(),
      assignedDeviceId: cleanDeviceId,
      roomName: cleanRoomName,
      assignedDevices: [cleanDeviceId]
    });

    await newTenant.save();

    console.log(`👤 Chủ trọ [${req.user.email}] đã tạo tài khoản người thuê: ${cleanEmail} -> ${cleanRoomName}`);

    res.status(201).json({
      status: 'success',
      message: `Đã tạo tài khoản cho người thuê [${fullName}] thành công!`,
      tenant: {
        id: newTenant._id,
        fullName: newTenant.fullName,
        email: newTenant.email,
        phone: newTenant.phone,
        role: newTenant.role,
        assignedDeviceId: newTenant.assignedDeviceId,
        roomName: newTenant.roomName
      }
    });
  } catch (err) {
    console.error('Lỗi POST /api/admin/tenants:', err);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// @route   PUT /api/admin/tenants/:id
// @desc    Chỉnh sửa thông tin khách thuê (Họ tên, Email, SĐT, Mật khẩu mới, Phòng)
// @access  Landlord Only
router.put('/tenants/:id', async (req, res) => {
  try {
    const { fullName, email, phone, password, deviceId } = req.body;
    const tenant = await User.findOne({ _id: req.params.id, role: 'tenant' });
    if (!tenant) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản người thuê này!' });
    }

    if (fullName) tenant.fullName = String(fullName).trim();

    if (email) {
      const cleanEmail = String(email).toLowerCase().trim();
      if (cleanEmail !== tenant.email) {
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
          return res.status(400).json({ message: `Email [${cleanEmail}] đã được sử dụng bởi tài khoản khác!` });
        }
        tenant.email = cleanEmail;
      }
    }

    if (phone !== undefined) {
      tenant.phone = String(phone).trim();
    }

    // Nếu chủ trọ đặt lại mật khẩu mới cho khách
    if (password && String(password).trim().length > 0) {
      const cleanPass = String(password).trim();
      if (cleanPass.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
      }
      const salt = await bcrypt.genSalt(10);
      tenant.password = await bcrypt.hash(cleanPass, salt);
    }

    // Nếu đổi phòng
    if (deviceId) {
      const cleanDeviceId = String(deviceId).trim().toUpperCase();
      if (cleanDeviceId !== tenant.assignedDeviceId) {
        const devDoc = await DeviceState.findOne({ deviceId: cleanDeviceId });
        const cleanRoomName = devDoc ? devDoc.deviceName : `Phòng ${cleanDeviceId}`;
        tenant.assignedDeviceId = cleanDeviceId;
        tenant.roomName = cleanRoomName;
        if (!tenant.assignedDevices) tenant.assignedDevices = [];
        if (!tenant.assignedDevices.includes(cleanDeviceId)) {
          tenant.assignedDevices.push(cleanDeviceId);
        }
        await DeviceToken.updateMany(
          { userId: tenant._id },
          { deviceId: cleanDeviceId }
        );
      }
    }

    await tenant.save();

    console.log(`✏️ Chủ trọ đã cập nhật thông tin người thuê [${tenant.fullName}] (${tenant.email})`);

    res.status(200).json({
      status: 'success',
      message: `Đã cập nhật thông tin người thuê [${tenant.fullName}] thành công!`,
      tenant: {
        id: tenant._id,
        fullName: tenant.fullName,
        email: tenant.email,
        phone: tenant.phone,
        role: tenant.role,
        assignedDeviceId: tenant.assignedDeviceId,
        roomName: tenant.roomName
      }
    });
  } catch (err) {
    console.error('Lỗi PUT /api/admin/tenants/:id:', err);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// @route   PUT /api/admin/tenants/:id/assign
// @desc    Gán hoặc đổi phòng cho người thuê
// @access  Landlord Only
router.put('/tenants/:id/assign', async (req, res) => {
  try {
    const { deviceId, roomName } = req.body;
    if (!deviceId) {
      return res.status(400).json({ message: 'Vui lòng chọn thiết bị phòng để gán!' });
    }

    const cleanDeviceId = String(deviceId).trim().toUpperCase();
    const tenant = await User.findOne({ _id: req.params.id, role: 'tenant' });
    if (!tenant) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản người thuê này!' });
    }

    // Lấy tên phòng từ DeviceState nếu không truyền
    let cleanRoomName = roomName;
    if (!cleanRoomName) {
      const devDoc = await DeviceState.findOne({ deviceId: cleanDeviceId });
      cleanRoomName = devDoc ? devDoc.deviceName : `Phòng ${cleanDeviceId}`;
    }

    tenant.assignedDeviceId = cleanDeviceId;
    tenant.roomName = cleanRoomName;
    if (!tenant.assignedDevices) tenant.assignedDevices = [];
    if (!tenant.assignedDevices.includes(cleanDeviceId)) {
      tenant.assignedDevices.push(cleanDeviceId);
    }
    await tenant.save();

    // Cập nhật lại deviceId trong DeviceToken
    await DeviceToken.updateMany(
      { userId: tenant._id },
      { deviceId: cleanDeviceId }
    );

    console.log(`🔗 Đã gán người thuê [${tenant.fullName}] vào phòng [${cleanDeviceId}] (${cleanRoomName})`);

    res.status(200).json({
      status: 'success',
      message: `Đã gán người thuê [${tenant.fullName}] vào [${cleanRoomName}] thành công!`,
      tenant: {
        id: tenant._id,
        fullName: tenant.fullName,
        email: tenant.email,
        phone: tenant.phone,
        assignedDeviceId: tenant.assignedDeviceId,
        roomName: tenant.roomName
      }
    });
  } catch (err) {
    console.error('Lỗi PUT /api/admin/tenants/:id/assign:', err);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// @route   PUT /api/admin/tenants/:id/revoke
// @desc    Thu hồi quyền phòng (khi khách trả phòng)
// @access  Landlord Only
router.put('/tenants/:id/revoke', async (req, res) => {
  try {
    const tenant = await User.findOne({ _id: req.params.id, role: 'tenant' });
    if (!tenant) {
      return res.status(404).json({ message: 'Không tìm thấy người thuê!' });
    }

    tenant.assignedDeviceId = 'DEFAULT_DEV';
    tenant.roomName = 'Chưa gán phòng (Đã trả phòng)';
    tenant.assignedDevices = ['DEFAULT_DEV'];
    await tenant.save();

    console.log(`❌ Đã thu hồi phòng của người thuê: ${tenant.fullName}`);

    res.status(200).json({
      status: 'success',
      message: `Đã thu hồi phòng của người thuê [${tenant.fullName}]. Trạng thái: Chưa gán phòng.`,
      tenant: {
        id: tenant._id,
        fullName: tenant.fullName,
        email: tenant.email,
        assignedDeviceId: tenant.assignedDeviceId,
        roomName: tenant.roomName
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

// @route   DELETE /api/admin/tenants/:id
// @desc    Xóa tài khoản người thuê trọ
// @access  Landlord Only
router.delete('/tenants/:id', async (req, res) => {
  try {
    const tenant = await User.findOneAndDelete({ _id: req.params.id, role: 'tenant' });
    if (!tenant) {
      return res.status(404).json({ message: 'Không tìm thấy người thuê để xóa!' });
    }

    // Dọn dẹp deviceToken của user này
    await DeviceToken.deleteMany({ userId: tenant._id });

    console.log(`🗑️ Đã xóa tài khoản người thuê: ${tenant.email}`);

    res.status(200).json({
      status: 'success',
      message: `Đã xóa tài khoản người thuê [${tenant.fullName}] thành công!`
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message });
  }
});

module.exports = router;
