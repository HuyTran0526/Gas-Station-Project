// Script giả lập cảm biến khí Gas ESP32 gửi dữ liệu về Server Cloud
// Cú pháp: node simulate.js [chế_độ] [mã_thiết_bị] [tên_phòng]
//
// Ví dụ:
//   node simulate.js danger             -> Kích hoạt nguy hiểm cho TẤT CẢ các phòng (DEV_101, DEV_102, DEFAULT_DEV)
//   node simulate.js danger DEV_101     -> Kích hoạt nguy hiểm RIÊNG cho Phòng 101
//   node simulate.js safe               -> Đặt lại an toàn cho TẤT CẢ các phòng
//   node simulate.js safe DEV_101       -> Đặt lại an toàn RIÊNG cho Phòng 101
//   node simulate.js auto               -> Tự động gửi dữ liệu cảm biến ngẫu nhiên

const BACKEND_URL = process.env.BACKEND_URL || 'https://gas-station-project.onrender.com/api/esp/update';
const mode = (process.argv[2] || 'auto').toLowerCase();
const devArg = process.argv[3] ? process.argv[3].trim().toUpperCase() : null;
const nameArg = process.argv[4] ? process.argv[4].trim() : null;

// Danh sách các phòng mặc định khi không chỉ định phòng
const DEFAULT_ROOMS = [
  { id: 'DEV_101', name: 'Phòng 101' },
  { id: 'DEV_102', name: 'Phòng 102' },
  { id: 'DEFAULT_DEV', name: 'Trạm Gas Chính' }
];

async function sendData(devId, devName, ppm) {
  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: devId,
        deviceName: devName,
        ppm: Math.round(ppm)
      })
    });
    const data = await res.json();
    const time = new Date().toLocaleTimeString('vi-VN');
    console.log(`[${time}] 📡 [${devId} - ${data.deviceName || devName}] PPM: ${ppm} | ${data.isDangerMode ? '🚨 NGUY HIỂM' : '🟢 AN TOÀN'} | Van: ${data.isOpen ? 'Mở' : 'Khóa'} | Quạt: ${data.isOn ? 'Bật' : 'Tắt'}`);
    return data;
  } catch (err) {
    console.error(`❌ Lỗi gửi dữ liệu [${devId}]:`, err.message);
  }
}

async function run() {
  const targetRooms = devArg && devArg !== 'ALL'
    ? [{ id: devArg, name: nameArg || (devArg === 'DEFAULT_DEV' ? 'Trạm Gas Chính' : `Phòng ${devArg}`) }]
    : DEFAULT_ROOMS;

  if (mode === 'danger') {
    console.log(`🚨 ĐANG KÍCH HOẠT NGUY HIỂM (850 PPM) TỚI: ${targetRooms.map(r => r.name + ' [' + r.id + ']').join(', ')}...`);
    for (const r of targetRooms) {
      await sendData(r.id, r.name, 850);
    }
    console.log('\n✅ Đã gửi tín hiệu nguy hiểm thành công! Kiểm tra còi hú và chuông trên App/Dashboard.');
  } else if (mode === 'safe') {
    console.log(`🟢 ĐANG ĐẶT LẠI TRẠNG THÁI AN TOÀN (350 PPM) TỚI: ${targetRooms.map(r => r.name + ' [' + r.id + ']').join(', ')}...`);
    for (const r of targetRooms) {
      await sendData(r.id, r.name, 350);
    }
    console.log('\n✅ Đã đặt lại trạng thái an toàn thành công! Còi báo động đã tắt.');
  } else {
    console.log(`🔄 BẮT ĐẦU CHẠY GIẢ LẬP TỰ ĐỘNG (Gửi định kỳ mỗi 2 giây)...`);
    console.log(`📡 Phòng đang giám sát: ${targetRooms.map(r => r.name + ' [' + r.id + ']').join(', ')}`);
    console.log('💡 Nhấn phím Ctrl + C để dừng giả lập bất cứ lúc nào.\n');

    let currentPpm = 380;
    const tick = async () => {
      const delta = (Math.random() * 30) - 15;
      currentPpm = Math.max(300, Math.min(550, currentPpm + delta));
      for (const r of targetRooms) {
        await sendData(r.id, r.name, currentPpm);
      }
    };

    await tick();
    setInterval(tick, 2000);
  }
}

run();
