// Script giả lập cảm biến khí Gas ESP32 gửi dữ liệu về Server (Hỗ trợ đa thiết bị / đa phòng)
// Cú pháp: node simulate.js [chế_độ] [mã_thiết_bị] [tên_phòng]
// Ví dụ:
//   node simulate.js danger DEV_101 "Phòng 101" -> Giả lập rò gas phòng 101 (850 PPM)
//   node simulate.js danger DEV_102 "Phòng 102" -> Giả lập rò gas phòng 102 (850 PPM)
//   node simulate.js safe DEV_101               -> Trả về an toàn cho phòng 101 (350 PPM)
//   node simulate.js auto DEV_101               -> Tự động gửi dữ liệu ngẫu nhiên mỗi 2 giây

const BACKEND_URL = process.env.BACKEND_URL || 'https://gas-station-project.onrender.com/api/esp/update';
const mode = process.argv[2] || 'auto';
const deviceId = (process.argv[3] || 'DEFAULT_DEV').trim().toUpperCase();
const deviceName = process.argv[4] || (deviceId === 'DEFAULT_DEV' ? 'Trạm Gas Chính' : `Phòng ${deviceId}`);

async function sendData(ppm) {
  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: deviceId,
        deviceName: deviceName,
        ppm: Math.round(ppm)
      })
    });
    const data = await res.json();
    const time = new Date().toLocaleTimeString('vi-VN');
    console.log(`[${time}] 📡 [${deviceId} - ${data.deviceName || deviceName}] PPM: ${ppm} | Trạng thái: ${data.isDangerMode ? '🚨 NGUY HIỂM' : '🟢 BÌNH THƯỜNG'} | Van: ${data.isOpen ? 'Mở' : 'Khóa'} | Quạt: ${data.isOn ? 'Bật' : 'Tắt'}`);
  } catch (err) {
    console.error(`❌ Lỗi gửi dữ liệu giả lập [${deviceId}]:`, err.message);
  }
}

if (mode === 'danger') {
  console.log(`🚨 BẮT ĐẦU GIẢ LẬP RÒ RỈ GAS NGUY HIỂM TẠI [${deviceId} - ${deviceName}] (850 PPM)...`);
  sendData(850);
} else if (mode === 'safe') {
  console.log(`🟢 ĐẶT LẠI TRẠNG THÁI AN TOÀN CHO [${deviceId} - ${deviceName}] (350 PPM)...`);
  sendData(350);
} else {
  console.log(`🔄 BẮT ĐẦU CHẠY GIẢ LẬP TỰ ĐỘNG CHO [${deviceId} - ${deviceName}] (Mỗi 2 giây gửi 1 lần)...`);
  console.log('💡 Nhấn Ctrl + C để dừng giả lập.\n');

  let currentPpm = 380;
  setInterval(() => {
    // Biến thiên nhẹ ngẫu nhiên +/- 15 PPM
    const delta = (Math.random() * 30) - 15;
    currentPpm = Math.max(300, Math.min(550, currentPpm + delta));
    sendData(currentPpm);
  }, 2000);

  // Gửi ngay điểm đầu tiên
  sendData(currentPpm);
}
