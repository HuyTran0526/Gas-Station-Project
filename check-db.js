require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gas_station')
  .then(async () => {
    console.log('✅ Kết nối MongoDB thành công!\n');

    // Đếm tổng số users
    const total = await User.countDocuments();
    console.log(`📊 Tổng số users trong database: ${total}`);

    // Lấy tất cả users với email
    const users = await User.find({}, 'name email createdAt');
    
    if (users.length === 0) {
      console.log('\n❌ DATABASE RỖNG - Không có user nào!');
      console.log('→ Đây là lý do email không được gửi.');
    } else {
      console.log('\n📋 Danh sách users:');
      users.forEach((u, i) => {
        console.log(`  ${i+1}. Tên: ${u.name || '(trống)'} | Email: ${u.email || '(THIẾU EMAIL!)'}`);
      });

      // Kiểm tra user nào thiếu email
      const noEmail = users.filter(u => !u.email);
      if (noEmail.length > 0) {
        console.log(`\n⚠️ ${noEmail.length} user(s) bị thiếu trường email!`);
      } else {
        console.log('\n✅ Tất cả users đều có email hợp lệ.');
        const emails = users.map(u => u.email).filter(Boolean);
        console.log('→ Email sẽ được gửi tới:', emails.join(', '));
      }
    }

    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  });
