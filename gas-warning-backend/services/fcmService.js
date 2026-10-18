const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');
const fs = require('fs');

let isInitialized = false;

function initFirebase() {
  if (isInitialized) return true;
  if (getApps().length > 0) {
    isInitialized = true;
    return true;
  }

  try {
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        // Có thể được mã hóa base64
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
      }
    } else {
      const keyPath = path.join(__dirname, '..', 'firebase-service-account.json');
      if (fs.existsSync(keyPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      }
    }

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount)
      });
      isInitialized = true;
      console.log('✅ Khởi tạo Google Firebase Cloud Messaging (FCM) thành công!');
      return true;
    } else {
      console.warn('⚠️ Chưa tìm thấy file firebase-service-account.json hoặc biến môi trường FIREBASE_SERVICE_ACCOUNT');
      return false;
    }
  } catch (err) {
    console.error('❌ Lỗi khởi tạo Firebase Admin SDK:', err.message);
    return false;
  }
}

// Khởi tạo ngay khi import
initFirebase();

/**
 * Gửi thông báo đẩy khẩn cấp FCM tới danh sách thiết bị
 * @param {Array<string>} tokens Danh sách FCM device token
 * @param {number} ppm Nồng độ gas đo được
 * @param {Object} options Tùy chọn tiêu đề, tên thiết bị, mã phòng
 */
async function sendGasAlertFCM(tokens, ppm, options = {}) {
  if (!initFirebase()) {
    console.warn('⚠️ Bỏ qua gửi FCM: Firebase chưa được khởi tạo');
    return;
  }

  if (!tokens || tokens.length === 0) {
    console.log('ℹ️ Chưa có thiết bị nào đăng ký token FCM để nhận thông báo đẩy');
    return;
  }

  // Loại bỏ token trùng lặp và token rỗng
  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  if (uniqueTokens.length === 0) return;

  const deviceLabel = options.deviceName || options.deviceId || 'Khu Vực Bếp';
  const title = options.title || `🚨 BÁO ĐỘNG ĐỎ: RÒ RỈ GAS [${deviceLabel}]!`;
  const body = options.body || `Nồng độ khí gas nguy hiểm: ${ppm} PPM tại ${deviceLabel}! Van gas đã tự động khóa. Hãy sơ tán và kiểm tra ngay!`;

  const message = {
    notification: {
      title: title,
      body: body
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'gas_emergency_channel',
        priority: 'max',
        defaultSound: true,
        defaultVibrateTimings: true,
        visibility: 'public',
        color: '#FF0000',
        clickAction: 'FCM_PLUGIN_ACTIVITY'
      }
    },
    data: {
      ppm: String(ppm),
      deviceId: String(options.deviceId || 'DEFAULT_DEV'),
      deviceName: String(deviceLabel),
      timestamp: String(Date.now()),
      type: 'GAS_LEAK_ALERT'
    },
    tokens: uniqueTokens
  };

  try {
    const messaging = getMessaging();
    const response = await messaging.sendEachForMulticast(message);
    console.log(`📡 Đã gửi thông báo đẩy FCM thành công tới ${response.successCount}/${uniqueTokens.length} thiết bị!`);
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.warn(`Lỗi gửi token [${uniqueTokens[idx]}]:`, resp.error?.message);
        }
      });
    }
    return response;
  } catch (err) {
    console.error('❌ Lỗi gửi thông báo FCM:', err.message);
  }
}

module.exports = {
  sendGasAlertFCM,
  initFirebase
};
