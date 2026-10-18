require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const DeviceState = require('./models/DeviceState');
const GasLog = require('./models/GasLog');
const User = require('./models/User');
const DeviceToken = require('./models/DeviceToken');
const auth = require('./middleware/auth');
const authRouter = require('./routes/auth');
const { sendWarningEmail } = require('./services/emailService');
const { sendGasAlertFCM } = require('./services/fcmService');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/safeflame';


app.use(cors()); 
app.use(express.json()); 

// Caching kết nối MongoDB cho môi trường Serverless (Vercel)
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  console.log('🔄 Đang khởi tạo kết nối MongoDB...');
  cachedDb = await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Thử tối đa 5 giây
    socketTimeoutMS: 45000,
  });
  console.log('✅ Kết nối cơ sở dữ liệu MongoDB thành công!');
  initializeDeviceState();
  initializeDefaultLandlord();
  return cachedDb;
}

// Middleware đảm bảo kết nối Database trước khi xử lý API request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('❌ Không thể kết nối Database:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ: Không thể kết nối cơ sở dữ liệu' });
  }
});

// Đăng ký auth router
app.use('/api/auth', authRouter);

// Đăng ký admin router (Dành riêng cho Chủ Trọ)
const adminRouter = require('./routes/admin');
app.use('/api/admin', auth, adminRouter);

// Trang chủ kiểm tra Server
app.get('/', (req, res) => {
  res.send('<h2>✅ Máy chủ SafeFlame Backend đang chạy trực tuyến!</h2><p>Hệ thống API đã sẵn sàng nhận tín hiệu.</p>');
});

// @route POST /api/analytics/track
// @desc Ghi nhận lượt truy cập từ link UTM Facebook / TikTok / Khác
const TrafficLog = require('./models/TrafficLog');
app.post('/api/analytics/track', async (req, res) => {
  try {
    const { source, path, referrer, device } = req.body;
    if (!source) {
      return res.status(400).json({ message: 'Source is required' });
    }

    const cleanSource = String(source).slice(0, 50).toLowerCase().trim();
    const cleanPath = String(path || '/').slice(0, 200);
    const cleanReferrer = String(referrer || '').slice(0, 300);
    const cleanDevice = device === 'mobile' ? 'mobile' : 'desktop';

    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const cleanIp = String(rawIp).split(',')[0].trim().slice(0, 50);

    const log = new TrafficLog({
      source: cleanSource,
      path: cleanPath,
      referrer: cleanReferrer,
      device: cleanDevice,
      ip: cleanIp
    });

    await log.save();
    res.status(200).json({ status: 'success', message: 'Tracked successfully' });
  } catch (err) {
    console.error('Lỗi track analytics:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cooldown map lưu mốc thời gian gửi email cảnh báo gần nhất theo từng thiết bị (tránh spam hòm thư & vượt quota Google)
const lastEmailAlertTimes = new Map(); // cleanDeviceId -> timestamp

// Hàm phụ trợ gửi email khẩn cấp theo từng thiết bị (Chỉ gửi tới người thuê phòng đó + chủ trọ)
async function sendWarningToDevice(deviceId, ppm, deviceLabel) {
  try {
    const cleanId = String(deviceId || 'DEFAULT_DEV').trim().toUpperCase();

    // Kiểm tra Cooldown: 3 phút (180.000ms) trừ khi khí gas ở mức thảm họa cực cao (>= 3000 PPM)
    const now = Date.now();
    const lastSent = lastEmailAlertTimes.get(cleanId) || 0;
    const cooldownMs = 3 * 60 * 1000; // 3 phút

    if (now - lastSent < cooldownMs && ppm < 3000) {
      const waitSeconds = Math.round((cooldownMs - (now - lastSent)) / 1000);
      console.log(`⏱️ [${cleanId}] Cooldown cảnh báo email: Đã gửi gần đây, tạm hoãn gửi lặp lại trong ${waitSeconds}s nữa (PPM: ${ppm}).`);
      return;
    }

    const users = await User.find({
      $or: [
        { assignedDeviceId: cleanId },
        { assignedDevices: cleanId },
        { role: 'landlord' }
      ]
    }, 'email');

    const emails = users.map(u => u.email).filter(Boolean);
    if (emails.length > 0) {
      console.log(`📡 [${cleanId}] Gửi email cảnh báo tới ${emails.length} tài khoản liên quan: ${emails.join(', ')}`);
      await sendWarningEmail(emails, ppm);
      lastEmailAlertTimes.set(cleanId, now);
    } else {
      console.log(`⚠️ Không tìm thấy email người dùng nào được gán với thiết bị [${cleanId}].`);
    }
  } catch (err) {
    console.error(`❌ Lỗi gửi email cho thiết bị [${deviceId}]:`, err);
  }
}

// Hàm phụ trợ bắn thông báo đẩy Google FCM theo từng thiết bị
async function sendFCMToDevice(deviceId, ppm, deviceLabel) {
  try {
    const cleanId = String(deviceId || 'DEFAULT_DEV').trim().toUpperCase();
    const label = deviceLabel || cleanId;

    // Tìm người dùng thuộc phòng này + chủ trọ
    const users = await User.find({
      $or: [
        { assignedDeviceId: cleanId },
        { assignedDevices: cleanId },
        { role: 'landlord' }
      ]
    }, 'fcmTokens role');

    // Tìm thêm deviceTokens đăng ký trực tiếp mã deviceId này
    const directDeviceTokens = await DeviceToken.find({ deviceId: cleanId }, 'token');
    const directTokensList = directDeviceTokens.map(d => d.token).filter(Boolean);

    const tenantTokens = [];
    const landlordTokens = [];

    users.forEach(u => {
      const tokens = (u.fcmTokens || []).filter(Boolean);
      if (u.role === 'landlord') {
        landlordTokens.push(...tokens);
      } else {
        tenantTokens.push(...tokens);
      }
    });

    directTokensList.forEach(t => {
      if (!tenantTokens.includes(t) && !landlordTokens.includes(t)) {
        tenantTokens.push(t);
      }
    });

    // 1. Gửi cho người thuê phòng
    if (tenantTokens.length > 0) {
      console.log(`📡 [${cleanId}] Đang gửi FCM tới ${tenantTokens.length} thiết bị người thuê phòng...`);
      await sendGasAlertFCM(tenantTokens, ppm, {
        deviceId: cleanId,
        deviceName: label,
        title: `🚨 BÁO ĐỘNG ĐỎ: RÒ RỈ GAS [${label.toUpperCase()}]!`,
        body: `Nồng độ khí gas nguy hiểm: ${ppm} PPM tại phòng của bạn! Van gas đã tự động khóa. Hãy sơ tán ngay!`
      });
    }

    // 2. Gửi cho chủ trọ quản lý (nếu có)
    if (landlordTokens.length > 0) {
      console.log(`📡 [${cleanId}] Đang gửi FCM tới ${landlordTokens.length} thiết bị Chủ trọ...`);
      await sendGasAlertFCM(landlordTokens, ppm, {
        deviceId: cleanId,
        deviceName: label,
        title: `🚨 [QUẢN LÝ] BÁO ĐỘNG RÒ RỈ GAS TẠI ${label.toUpperCase()}!`,
        body: `Phát hiện rò rỉ gas ${ppm} PPM tại [${label}]! Hệ thống đã tự khóa van và bật quạt hút.`
      });
    }

    if (tenantTokens.length === 0 && landlordTokens.length === 0) {
      console.log(`⚠️ Không tìm thấy token thiết bị nào được gán với mã [${cleanId}].`);
    }
  } catch (err) {
    console.error(`❌ Lỗi khi gửi FCM cho thiết bị [${deviceId}]:`, err);
  }
}

// @route GET /api/fcm/status
// @desc Kiểm tra tình trạng kết nối FCM và số thiết bị nhận tin
app.get('/api/fcm/status', async (req, res) => {
  try {
    const { initFirebase } = require('./services/fcmService');
    const isFirebaseReady = initFirebase();
    const [users, deviceTokens] = await Promise.all([
      User.find({}, 'email fcmTokens assignedDeviceId role'),
      DeviceToken.find({}, 'token deviceId platform updatedAt')
    ]);
    const userTokens = users.flatMap(u => u.fcmTokens || []).filter(Boolean);
    const directTokens = deviceTokens.map(d => d.token).filter(Boolean);
    const allTokens = [...new Set([...userTokens, ...directTokens])];

    res.json({
      firebaseReady: isFirebaseReady,
      serviceAccountConfigured: !!(process.env.FIREBASE_SERVICE_ACCOUNT || require('fs').existsSync(require('path').join(__dirname, 'firebase-service-account.json'))),
      totalUniqueTokens: allTokens.length,
      deviceTokensCount: deviceTokens.length,
      usersWithTokens: users.filter(u => u.fcmTokens && u.fcmTokens.length > 0).length,
      tokensSample: allTokens.slice(0, 3).map(t => t.substring(0, 15) + '...'),
      devicesDistribution: deviceTokens.map(d => ({ deviceId: d.deviceId, platform: d.platform }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/fcm/test
// @desc Bắn 1 thông báo thử nghiệm tới thiết bị chỉ định hoặc mặc định
app.post('/api/fcm/test', async (req, res) => {
  try {
    const targetDev = (req.body.deviceId || 'DEFAULT_DEV').trim().toUpperCase();
    await sendFCMToDevice(targetDev, 999, 'Phòng Test ' + targetDev);
    res.json({ status: 'success', message: `Đã phát lệnh test thông báo đẩy FCM tới thiết bị [${targetDev}]` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





async function initializeDeviceState() {
  try {
    const count = await DeviceState.countDocuments();
    if (!count) {
      const defaultState = new DeviceState({
        deviceId: 'DEFAULT_DEV',
        deviceName: 'Phòng Mặc Định (DEV_01)',
        location: 'Khu vực bếp',
        ppm: 350,
        isOpen: true, 
        isOn: false,
        isBuzzerMuted: true, // true = Tắt còi khi an toàn
        isDangerMode: false
      });
      await defaultState.save();
      console.log('🌱 Đã khởi tạo bản ghi DeviceState mặc định.');
    }
  } catch (err) {
    console.error('Lỗi khi khởi tạo DeviceState:', err);
  }
}

async function initializeDefaultLandlord() {
  try {
    const landlord = await User.findOne({ role: 'landlord' });
    if (!landlord) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('1', salt);

      const defaultLandlord = new User({
        fullName: 'Chủ Trọ Quản Lý SafeFlame',
        email: 'admin@safeflame.vn',
        password: hashedPassword,
        role: 'landlord',
        phone: '0901234567',
        assignedDeviceId: 'DEFAULT_DEV',
        roomName: 'Trạm Gas Tổng',
        assignedDevices: ['DEFAULT_DEV']
      });

      await defaultLandlord.save();
      console.log('👑 [HỆ THỐNG] Đã khởi tạo tài khoản Chủ Trọ mặc định:');
      console.log('   📧 Email:    admin@safeflame.vn');
      console.log('   🔑 Mật khẩu: 1');
    }
  } catch (err) {
    console.error('Lỗi khi khởi tạo tài khoản Chủ Trọ:', err);
  }
}

// @route GET /api/devices
// @desc Lấy danh sách tất cả các thiết bị / phòng trong hệ thống (Tenant chỉ xem phòng được gán)
app.get('/api/devices', auth, async (req, res) => {
  try {
    let query = { deviceId: { $exists: true, $nin: [null, ''] } };

    // Phân quyền cách ly dữ liệu: Người thuê chỉ nhìn thấy phòng được chủ trọ gán
    if (req.user && req.user.role === 'tenant') {
      const userDev = (req.user.assignedDeviceId || 'DEFAULT_DEV').trim().toUpperCase();
      query.deviceId = userDev;
    }

    const devices = await DeviceState.find(query).sort({ updatedAt: -1 });
    const now = new Date();
    const result = devices.map(d => ({
      id: d._id,
      deviceId: d.deviceId,
      deviceName: d.deviceName || d.deviceId,
      location: d.location || '',
      ppm: d.ppm,
      isOpen: d.isOpen,
      isOn: d.isOn,
      isBuzzerMuted: d.isBuzzerMuted,
      isDangerMode: d.isDangerMode,
      isOnline: d.updatedAt ? (now - new Date(d.updatedAt)) < 15000 : false,
      updatedAt: d.updatedAt
    }));
    res.status(200).json({ status: 'success', devices: result });
  } catch (err) {
    console.error('Lỗi GET /api/devices:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route GET /api/status
// @desc Lấy trạng thái cảm biến theo deviceId (mặc định lấy theo tài khoản hoặc DEFAULT_DEV)
app.get('/api/status', auth, async (req, res) => {
  try {
    let targetDeviceId = (req.query.deviceId || req.user?.assignedDeviceId || 'DEFAULT_DEV').trim().toUpperCase();

    // Nếu là Người Thuê (tenant), luôn đồng bộ thiết bị phòng mới nhất mà Chủ trọ đã gán trong database
    if (req.user && req.user.role === 'tenant') {
      targetDeviceId = (req.user.assignedDeviceId || 'DEFAULT_DEV').trim().toUpperCase();
    }

    let state = await DeviceState.findOne({ deviceId: targetDeviceId });
    if (!state) {
      // Tự động khởi tạo trạng thái an toàn nếu thiết bị mới kết nối
      state = new DeviceState({
        deviceId: targetDeviceId,
        deviceName: req.user?.roomName || ('Phòng ' + targetDeviceId),
        location: 'Khu vực bếp',
        ppm: 350,
        isOpen: true,
        isOn: false,
        isBuzzerMuted: true,
        isDangerMode: false
      });
      await state.save();
    }

    const recentLogs = await GasLog.find({ deviceId: targetDeviceId })
      .sort({ timestamp: -1 })
      .limit(6);

    const now = new Date();
    const isEspOnline = state && state.updatedAt ? (now - new Date(state.updatedAt)) < 15000 : false;

    res.status(200).json({
      deviceId: state.deviceId,
      deviceName: state.deviceName || state.deviceId,
      location: state.location || '',
      ppm: state.ppm,
      isOpen: state.isOpen,
      isOn: state.isOn,
      isBuzzerMuted: state.isBuzzerMuted,
      isDangerMode: state.isDangerMode,
      isEspOnline: isEspOnline,
      recentLogs: recentLogs,
      // Trả thêm thông tin phòng mới nhất của user để frontend tự động đồng bộ ngay lập tức
      userAssignedDeviceId: req.user?.assignedDeviceId || 'DEFAULT_DEV',
      userRoomName: req.user?.roomName || state.deviceName || 'Phòng Mặc Định'
    });
  } catch (err) {
    console.error('Lỗi GET /api/status:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route POST /api/esp/update
// @desc ESP32 phần cứng gửi nồng độ gas lên kèm deviceId
app.post('/api/esp/update', async (req, res) => {
  try {
    const { adcValue, ppm, deviceId, deviceName, location } = req.body;
    const targetDeviceId = (deviceId || 'DEFAULT_DEV').trim().toUpperCase();
    let calculatedPpm;

    if (ppm !== undefined && ppm !== null) {
      calculatedPpm = Math.round(Number(ppm));
    } else if (adcValue !== undefined && adcValue !== null) {
      calculatedPpm = Math.round(350 + (Number(adcValue) / 4095) * (10000 - 350));
    } else {
      return res.status(400).json({ message: 'Thiếu trường dữ liệu adcValue hoặc ppm!' });
    }

    // Ghi log lịch sử theo từng deviceId
    await GasLog.create({ deviceId: targetDeviceId, ppm: calculatedPpm });

    let state = await DeviceState.findOne({ deviceId: targetDeviceId });
    if (!state) {
      state = new DeviceState({
        deviceId: targetDeviceId,
        deviceName: deviceName || ('Phòng ' + targetDeviceId),
        location: location || 'Khu vực bếp'
      });
    } else {
      if (deviceName && state.deviceName !== deviceName) state.deviceName = deviceName;
      if (location && state.location !== location) state.location = location;
    }

    // Xử lý Edge Trigger kèm Dải Trễ (Hysteresis Band):
    // Kích hoạt nguy hiểm khi ppm >= 600
    // Chỉ giải phóng an toàn khi ppm < 500 (Dải trễ 100 PPM chống chập chờn relay/còi)
    if (calculatedPpm >= 600 && !state.isDangerMode) {
      state.isDangerMode = true;
      state.isOpen = false; // Tự động khóa van
      state.isOn = true;    // Tự động bật quạt
      state.isBuzzerMuted = false; // Còi kêu
      console.log(`🚨 [${targetDeviceId} - ${state.deviceName}] NGUY HIỂM: Gas ${calculatedPpm} PPM! Kích hoạt báo động.`);

      // Gửi email khẩn cấp cho người dùng phòng này + chủ trọ
      sendWarningToDevice(targetDeviceId, calculatedPpm, state.deviceName).catch(err => {
        console.error('Lỗi gửi email cảnh báo:', err);
      });

      // Bắn thông báo đẩy Google FCM tới đúng thiết bị người thuê phòng đó + chủ trọ
      sendFCMToDevice(targetDeviceId, calculatedPpm, state.deviceName).catch(err => {
        console.error('Lỗi gửi FCM cảnh báo:', err);
      });
    } 
    // Ép buộc thiết bị chỉ tắt cảnh báo khi gas đã hạ xuống mức an toàn sâu (< 500 PPM)
    else if (calculatedPpm < 500 && state.isDangerMode) {
      state.isDangerMode = false;
      state.isOn = false;
      state.isBuzzerMuted = true; // Còi tắt
      console.log(`🟢 [${targetDeviceId} - ${state.deviceName}] AN TOÀN: Gas < 500 PPM (đã qua dải trễ 100 PPM). Đã tắt quạt và còi, giữ nguyên khóa van.`);
    }

    state.ppm = calculatedPpm;
    await state.save();

    res.status(200).json({
      status: 'success',
      deviceId: state.deviceId,
      deviceName: state.deviceName,
      ppm: calculatedPpm,
      isOpen: state.isOpen,
      isOn: state.isOn,
      isBuzzerMuted: state.isBuzzerMuted,
      isDangerMode: state.isDangerMode
    });
  } catch (err) {
    console.error('Lỗi POST /api/esp/update:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route POST /api/control/valve
app.post('/api/control/valve', auth, async (req, res) => {
  try {
    const { isOpen, deviceId } = req.body;
    const targetDeviceId = (deviceId || req.user?.assignedDeviceId || 'DEFAULT_DEV').trim().toUpperCase();

    // Phân quyền: Người thuê chỉ được điều khiển phòng của mình
    if (req.user && req.user.role === 'tenant') {
      const userDev = (req.user.assignedDeviceId || '').trim().toUpperCase();
      if (targetDeviceId !== userDev) {
        return res.status(403).json({
          status: 'forbidden',
          message: `Từ chối truy cập: Bạn chỉ có quyền điều khiển thiết bị phòng của mình [${userDev || 'Chưa gán'}]!`
        });
      }
    }

    if (isOpen === undefined) {
      return res.status(400).json({ message: 'Thiếu trường dữ liệu isOpen!' });
    }

    let state = await DeviceState.findOne({ deviceId: targetDeviceId });

    // 🔒 KHÓA LIÊN ĐỘNG AN TOÀN (Safety Interlock):
    // Tuyệt đối không cho phép Mở Van khi nồng độ gas đang vượt ngưỡng nguy hiểm (>= 600 PPM) hoặc đang trong Danger Mode!
    if (isOpen && state && (state.ppm >= 600 || state.isDangerMode)) {
      console.warn(`⛔ [TỪ CHỐI MỞ VAN] Thiết bị [${targetDeviceId}] đang ở mức nguy hiểm (${state.ppm} PPM)!`);
      return res.status(400).json({
        status: 'error',
        message: `Cực kỳ nguy hiểm: Nồng độ khí gas (${state.ppm} PPM) đang vượt ngưỡng an toàn! Hệ thống khóa cứng van để phòng chống cháy nổ.`
      });
    }

    if (state) {
      state.isOpen = isOpen;
      await state.save();
    }

    res.status(200).json({
      status: 'success',
      deviceId: targetDeviceId,
      isOpen: state ? state.isOpen : isOpen
    });
  } catch (err) {
    console.error('Lỗi điều khiển van gas:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route POST /api/control/fan
app.post('/api/control/fan', auth, async (req, res) => {
  try {
    const { isOn, deviceId } = req.body;
    const targetDeviceId = (deviceId || req.user?.assignedDeviceId || 'DEFAULT_DEV').trim().toUpperCase();

    // Phân quyền: Người thuê chỉ được điều khiển phòng của mình
    if (req.user && req.user.role === 'tenant') {
      const userDev = (req.user.assignedDeviceId || '').trim().toUpperCase();
      if (targetDeviceId !== userDev) {
        return res.status(403).json({
          status: 'forbidden',
          message: `Từ chối truy cập: Bạn chỉ có quyền điều khiển thiết bị phòng của mình [${userDev || 'Chưa gán'}]!`
        });
      }
    }

    if (isOn === undefined) {
      return res.status(400).json({ message: 'Thiếu trường dữ liệu isOn!' });
    }

    let state = await DeviceState.findOne({ deviceId: targetDeviceId });

    // 🔒 KHÓA LIÊN ĐỘNG AN TOÀN (Safety Interlock):
    // Tuyệt đối không cho phép Tắt Quạt khi nồng độ gas đang ở mức nguy hiểm (>= 600 PPM) hoặc đang trong Danger Mode!
    if (!isOn && state && (state.ppm >= 600 || state.isDangerMode)) {
      console.warn(`⛔ [TỪ CHỐI TẮT QUẠT] Thiết bị [${targetDeviceId}] đang ở mức nguy hiểm (${state.ppm} PPM)!`);
      return res.status(400).json({
        status: 'error',
        message: `Không thể tắt quạt hút khi nồng độ gas (${state.ppm} PPM) đang ở mức nguy hiểm! Quạt phải chạy để thông gió cưỡng bức.`
      });
    }

    if (state) {
      state.isOn = isOn;
      await state.save();
    }

    res.status(200).json({
      status: 'success',
      deviceId: targetDeviceId,
      isOn: state ? state.isOn : isOn
    });
  } catch (err) {
    console.error('Lỗi điều khiển quạt hút:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// @route POST /api/control/buzzer
app.post('/api/control/buzzer', auth, async (req, res) => {
  try {
    const { isMuted, deviceId } = req.body;
    const targetDeviceId = (deviceId || req.user?.assignedDeviceId || 'DEFAULT_DEV').trim().toUpperCase();

    // Phân quyền: Người thuê chỉ được điều khiển phòng của mình
    if (req.user && req.user.role === 'tenant') {
      const userDev = (req.user.assignedDeviceId || '').trim().toUpperCase();
      if (targetDeviceId !== userDev) {
        return res.status(403).json({
          status: 'forbidden',
          message: `Từ chối truy cập: Bạn chỉ có quyền điều khiển thiết bị phòng của mình [${userDev || 'Chưa gán'}]!`
        });
      }
    }

    if (isMuted === undefined) {
      return res.status(400).json({ message: 'Thiếu trường dữ liệu isMuted!' });
    }

    let state = await DeviceState.findOne({ deviceId: targetDeviceId });
    if (state) {
      state.isBuzzerMuted = isMuted;
      await state.save();
    }

    res.status(200).json({
      status: 'success',
      deviceId: targetDeviceId,
      isBuzzerMuted: state ? state.isBuzzerMuted : isMuted
    });
  } catch (err) {
    console.error('Lỗi điều khiển còi báo động:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});


// Tự động phát hiện IP mạng Wi-Fi
const os = require('os');
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'safeflame.vn';
}

// Lắng nghe cổng mạng trên Render, Cloud hoặc chạy local (trừ khi đang chạy serverless trên Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, '0.0.0.0', () => {
    const wifiIp = getLocalIp();
    console.log(`🚀 Máy chủ Backend IoT SafeFlame đang chạy:`);
    console.log(`   🔥 Tên dự án (Domain): http://safeflame.vn:${PORT}`);
    console.log(`   🏠 Máy tính (Local):   http://localhost:${PORT}`);
    console.log(`   📶 Mạng Wi-Fi:         http://${wifiIp}:${PORT}`);
    console.log(`   📲 Đường dẫn API:      http://${wifiIp}:${PORT}/api`);
  });
}

module.exports = app;
