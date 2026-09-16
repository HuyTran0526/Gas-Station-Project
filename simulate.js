// Script giả lập cảm biến khí Gas ESP32 gửi dữ liệu về Server
// Chạy bằng lệnh: node simulate.js [chế_độ]
// Các chế độ:
//   node simulate.js           -> Tự động gửi dữ liệu ngẫu nhiên mỗi 2 giây (350 - 450 PPM)
//   node simulate.js danger    -> Giả lập rò rỉ khí gas nguy hiểm (850 PPM - kích hoạt còi, quạt, ngắt van)
//   node simulate.js safe      -> Giả lập môi trường an toàn bình thường (350 PPM)

const BACKEND_URL = process.env.BACKEND_URL || 'https://gas-station-project.onrender.com/api/esp/update';
const mode = process.argv[2] || 'auto';

async function sendData(ppm) {
  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ppm: Math.round(ppm) })
    });
    const data = await res.json();
    const time = new Date().toLocaleTimeString('vi-VN');
    console.log(`[${time}] 📡 Gửi PPM: ${ppm} | Trạng thái: ${data.isDangerMode ? '🚨 NGUY HIỂM' : '🟢 BÌNH THƯỜNG'} | Van: ${data.isOpen ? 'Mở' : 'Khóa'} | Quạt: ${data.isOn ? 'Bật' : 'Tắt'}`);
  } catch (err) {
    console.error('❌ Lỗi gửi dữ liệu giả lập:', err.message);
  }
}

if (mode === 'danger') {
  console.log('🚨 BẮT ĐẦU GIẢ LẬP TÌNH HUỐNG RÒ RỈ KHÍ GAS NGUY HIỂM (850 PPM)...');
  sendData(850);
} else if (mode === 'safe') {
  console.log('🟢 ĐẶT LẠI TRẠNG THÁI AN TOÀN (350 PPM)...');
  sendData(350);
} else {
  console.log('🔄 BẮT ĐẦU CHẠY GIẢ LẬP CẢM BIẾN TỰ ĐỘNG (Mỗi 2 giây gửi 1 lần)...');
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
