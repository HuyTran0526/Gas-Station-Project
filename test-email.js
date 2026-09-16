require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('=== THÔNG TIN CẤU HÌNH EMAIL ===');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '(đã có, độ dài: ' + process.env.EMAIL_PASS.length + ')' : '(TRỐNG!)');
console.log('================================\n');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4, // Ép IPv4
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('📡 Đang kiểm tra kết nối SMTP...');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ KẾT NỐI SMTP THẤT BẠI!');
    console.error('   Mã lỗi:', error.code);
    console.error('   Thông báo:', error.message);
    if (error.code === 'EAUTH') {
      console.error('\n💡 GỢI Ý: Lỗi xác thực Gmail. App Password có thể đã hết hạn hoặc sai.');
      console.error('   → Vào https://myaccount.google.com/apppasswords để tạo App Password mới.');
    }
    if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
      console.error('\n💡 GỢI Ý: Lỗi kết nối mạng. Thử đổi port hoặc kiểm tra tường lửa.');
    }
    process.exit(1);
  }

  console.log('✅ Kết nối SMTP thành công! Đang gửi email test...\n');

  const mailOptions = {
    from: `"SAFE FLAME Test" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Gửi cho chính mình để test
    subject: '🧪 [TEST] Kiểm tra gửi email SAFE FLAME',
    html: `
      <div style="font-family: sans-serif; padding: 20px; background: #f8fafc;">
        <h2 style="color: #ef4444;">🚨 Email Test SAFE FLAME</h2>
        <p>Nếu bạn đọc được email này thì hệ thống email đang hoạt động bình thường! ✅</p>
        <p><strong>Thời gian gửi:</strong> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('❌ GỬI EMAIL THẤT BẠI!');
      console.error('   Mã lỗi:', err.code);
      console.error('   Thông báo:', err.message);
      if (err.responseCode === 535) {
        console.error('\n💡 GỢI Ý: Sai App Password. Vào myaccount.google.com/apppasswords để tạo lại.');
      }
      if (err.responseCode === 534) {
        console.error('\n💡 GỢI Ý: Gmail yêu cầu đăng nhập qua trình duyệt. Hãy bật 2FA và dùng App Password.');
      }
      process.exit(1);
    }
    console.log('✅ EMAIL ĐÃ GỬI THÀNH CÔNG!');
    console.log('   Message ID:', info.messageId);
    console.log('   Hãy kiểm tra hộp thư của:', process.env.EMAIL_USER);
    console.log('\n🎉 Hệ thống email hoạt động bình thường!');
  });
});
