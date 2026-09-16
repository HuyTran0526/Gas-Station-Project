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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gas_station';


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

// Trang chủ kiểm tra Server
app.get('/', (req, res) => {
  res.send('<h2>✅ Máy chủ SafeFlame Backend đang chạy trực tuyến!</h2><p>Hệ thống API đã sẵn sàng nhận tín hiệu.</p>');
});

// Hàm phụ trợ gửi email khẩn cấp cho tất cả các tài khoản chủ trọ & người thuê
async function sendWarningToAllUsers(ppm) {
  try {
    const users = await User.find({}, 'email');
    const emails = users.map(u => u.email).filter(Boolean);
    if (emails.length > 0) {
      console.log(`📡 Đang gửi email cảnh báo tới danh sách: ${emails.join(', ')}`);
      await sendWarningEmail(emails, ppm);
    } else {
      console.log('⚠️ Không tìm thấy email người dùng nào trong database để gửi cảnh báo.');
    }
  } catch (err) {
    console.error('❌ Lỗi khi truy vấn danh sách người dùng để gửi email:', err);
  }
}

// Hàm phụ trợ bắn thông báo đẩy Google FCM tới tất cả thiết bị đã cài app
async function sendFCMToAllUsers(ppm) {
  try {
    const [users, deviceTokens] = await Promise.all([
      User.find({}, 'fcmTokens'),
      DeviceToken.find({}, 'token')
    ]);
    const userTokens = users.flatMap(u => u.fcmTokens || []).filter(Boolean);
    const directTokens = deviceTokens.map(d => d.token).filter(Boolean);
    const allTokens = [...new Set([...userTokens, ...directTokens])];

    if (allTokens.length > 0) {
      console.log(`📡 Đang gửi FCM thông báo đẩy tới ${allTokens.length} token thiết bị...`);
      await sendGasAlertFCM(allTokens, ppm);
    } else {
      console.log('⚠️ Chưa có thiết bị nào đăng ký token FCM trong database.');
    }
  } catch (err) {
    console.error('❌ Lỗi khi truy vấn danh sách token FCM:', err);
  }
}

// @route GET /api/fcm/status
// @desc Kiểm tra tình trạng kết nối FCM và số thiết bị nhận tin
app.get('/api/fcm/status', async (req, res) => {
  try {
    const { initFirebase } = require('./services/fcmService');
    const isFirebaseReady = initFirebase();
    const [users, deviceTokens] = await Promise.all([
      User.find({}, 'email fcmTokens'),
      DeviceToken.find({}, 'token platform updatedAt')
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
      tokensSample: allTokens.slice(0, 3).map(t => t.substring(0, 15) + '...')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/fcm/test
// @desc Bắn 1 thông báo thử nghiệm tới tất cả thiết bị
app.post('/api/fcm/test', async (req, res) => {
  try {
    await sendFCMToAllUsers(999);
    res.json({ status: 'success', message: 'Đã phát lệnh test thông báo đẩy FCM' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





async function initializeDeviceState() {
  try {
    const count = await DeviceState.countDocuments();
    if (!count) {
      const defaultState = new DeviceState({
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




app.get('/api/status', auth, async (req, res) => {
  try {
    
    const state = await DeviceState.findOne();
    
    
    const recentLogs = await GasLog.find()
      .sort({ timestamp: -1 })
      .limit(5);

    const now = new Date();
    const isEspOnline = state && state.updatedAt ? (now - new Date(state.updatedAt)) < 15000 : false;

    res.status(200).json({
      ppm: state ? state.ppm : 350,
      isOpen: state ? state.isOpen : true,
      isOn: state ? state.isOn : false,
      isBuzzerMuted: state ? state.isBuzzerMuted : false,
      isDangerMode: state ? state.isDangerMode : false,
      isEspOnline: isEspOnline,
      recentLogs: recentLogs
    });
  } catch (err) {
    console.error('Lỗi GET /api/status:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});


app.post('/api/esp/update', async (req, res) => {
  try {
    const { adcValue, ppm } = req.body;
    let calculatedPpm;

    if (ppm !== undefined && ppm !== null) {
      calculatedPpm = Math.round(Number(ppm));
    } else if (adcValue !== undefined && adcValue !== null) {
      
      
      calculatedPpm = Math.round(350 + (Number(adcValue) / 4095) * (10000 - 350));
    } else {
      return res.status(400).json({ message: 'Thiếu trường dữ liệu adcValue hoặc ppm!' });
    }

    
    await GasLog.create({ ppm: calculatedPpm });

    
    let state = await DeviceState.findOne();
    if (!state) {
      state = new DeviceState();
    }

    // Xử lý Edge Trigger: Khi bắt đầu nguy hiểm
    if (calculatedPpm >= 600 && !state.isDangerMode) {
      state.isDangerMode = true;
      state.isOpen = false; 
      state.isOn = true;    
      state.isBuzzerMuted = false; // false = Còi KÊU
      console.log(`🚨 NGUY HIỂM: Gas vượt ngưỡng (${calculatedPpm} PPM). Đã kích hoạt báo động khẩn cấp!`);
      
      // Gửi email cảnh báo khẩn cấp đồng loạt (không chặn luồng API chính)
      sendWarningToAllUsers(calculatedPpm).catch(err => {
        console.error('Lỗi bất đồng bộ khi gửi email:', err);
      });

      // Bắn thông báo đẩy Google FCM tới tất cả điện thoại (kể cả khi tắt app)
      sendFCMToAllUsers(calculatedPpm).catch(err => {
        console.error('Lỗi bất đồng bộ khi gửi FCM:', err);
      });
    } 
    // Ép buộc thiết bị tắt hoàn toàn khi an toàn (Dưới 600) - Edge Trigger
    else if (calculatedPpm < 600 && state.isDangerMode) {
      state.isDangerMode = false;
      // state.isOpen = true; // KHÔNG TỰ ĐỘNG MỞ VAN, GIỮ NGUYÊN TRẠNG THÁI KHÓA
      state.isOn = false;
      state.isBuzzerMuted = true; // true = Còi TẮT
      console.log(`🟢 AN TOÀN: Gas < 600 PPM. Đã tự động tắt quạt và còi, giữ nguyên khóa van.`);
    }

    state.ppm = calculatedPpm;
    await state.save();

    
    res.status(200).json({
      status: 'success',
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


app.post('/api/control/valve', auth, async (req, res) => {
  try {
    const { isOpen } = req.body;

    if (isOpen === undefined) {
      return res.status(400).json({ message: 'Thiếu trường dữ liệu isOpen!' });
    }

    const state = await DeviceState.findOne();
    if (state) {
      state.isOpen = isOpen;
      await state.save();
    }

    res.status(200).json({
      status: 'success',
      isOpen: state ? state.isOpen : isOpen
    });
  } catch (err) {
    console.error('Lỗi điều khiển van gas:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});


app.post('/api/control/fan', auth, async (req, res) => {
  try {
    const { isOn } = req.body;

    if (isOn === undefined) {
      return res.status(400).json({ message: 'Thiếu trường dữ liệu isOn!' });
    }

    const state = await DeviceState.findOne();
    if (state) {
      state.isOn = isOn;
      await state.save();
    }

    res.status(200).json({
      status: 'success',
      isOn: state ? state.isOn : isOn
    });
  } catch (err) {
    console.error('Lỗi điều khiển quạt hút:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

app.post('/api/control/buzzer', auth, async (req, res) => {
  try {
    const { isMuted } = req.body;

    if (isMuted === undefined) {
      return res.status(400).json({ message: 'Thiếu trường dữ liệu isMuted!' });
    }

    const state = await DeviceState.findOne();
    if (state) {
      state.isBuzzerMuted = isMuted;
      await state.save();
    }

    res.status(200).json({
      status: 'success',
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
  return 'localhost';
}

// Lắng nghe cổng mạng trên Render, Cloud hoặc chạy local (trừ khi đang chạy serverless trên Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, '0.0.0.0', () => {
    const wifiIp = getLocalIp();
    console.log(`🚀 Máy chủ Backend IoT đang chạy:`);
    console.log(`   🏠 Máy tính (Local): http://localhost:${PORT}`);
    console.log(`   📶 Mạng Wi-Fi:       http://${wifiIp}:${PORT}`);
    console.log(`   📲 Đường dẫn API:    http://${wifiIp}:${PORT}/api`);
  });
}

module.exports = app;
