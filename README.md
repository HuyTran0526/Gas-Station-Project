# Gas Station Management Project

## ⚠️ LƯU Ý QUAN TRỌNG DÀNH CHO IT MỚI (IMPORTANT NOTES)

Project này trước đây sử dụng các dịch vụ (Database, API Keys...) của cá nhân, do đó bạn **BẮT BUỘC** phải tự tạo các dịch vụ mới và thiết lập lại vào file `.env`. **Vui lòng không dùng lại cấu hình cũ**:

1. **Cơ sở dữ liệu (Database):** 
   - Thay vì dùng database (Vercel/MongoDB) cũ, bạn hãy tự tạo một Cluster MongoDB mới (ví dụ trên MongoDB Atlas hoặc chạy MongoDB local). 
   - Lấy Connection String mới và thay vào biến `MONGODB_URI` trong file `.env`.
2. **Hệ thống gửi Email:**
   - Cần dùng một email mới của bạn (hoặc công ty), tạo **App Password (Mật khẩu ứng dụng)** và điền vào `EMAIL_USER` và `EMAIL_PASS`.
3. **Đăng nhập bằng Google (Google OAuth):**
   - Bạn cần vào [Google Cloud Console](https://console.cloud.google.com/), tạo project mới, thiết lập OAuth consent screen và tạo Credentials để lấy `Client ID` mới, sau đó điền vào `GOOGLE_CLIENT_ID`.
4. **Bảo mật:**
   - Thay đổi `JWT_SECRET` bằng một chuỗi ngẫu nhiên mới để bảo mật hệ thống.

---

## 🚀 Hướng Dẫn Cài Đặt (Setup Instructions)

### Yêu cầu trước khi cài đặt:
- Node.js (phiên bản 16 trở lên)
- MongoDB

### 1. Cấu hình môi trường (Environment Setup)
Ở thư mục gốc (root directory) của project, hãy tạo một file mới tên là `.env` (hoặc copy nội dung từ file `.env.example`) và điền các thông tin của riêng bạn vào.

### 2. Khởi chạy Backend (Node.js)
Mở một terminal (Command Prompt/PowerShell) và chạy các lệnh sau:
```bash
cd gas-warning-backend
npm install
npm start
```
*(Backend sẽ chạy ở `http://safeflame.local:5000`)*

### 3. Khởi chạy Frontend (React)
Mở một terminal mới khác và chạy các lệnh sau:
```bash
cd gas-warning-dashboard
npm install
npm run dev
```
*(Frontend Dashboard sẽ chạy ở `http://safeflame.local` hoặc `http://safeflame` - không cần gõ :5173)*

### 4. Code Phần Cứng (ESP32)
Mã nguồn cho mạch ESP32 đã được lưu trong thư mục `esp32-code/esp32_gas_detector.ino`.
**LƯU Ý QUAN TRỌNG VỀ ESP32:** Khi bạn deploy (triển khai) Backend lên một server mới (ví dụ Vercel/Render mới của bạn), bạn bắt buộc phải:
1. Mở file `esp32_gas_detector.ino` bằng phần mềm Arduino IDE.
2. Sửa lại thông tin mạng WiFi (`ssid` và `password`) phù hợp với nơi lắp đặt thiết bị.
3. Sửa lại 2 biến `serverNamePost` và `serverNameGet` thành **đường dẫn API Backend MỚI của bạn**. Thay thế domain cũ bằng domain mới.
4. Upload (Nạp) lại đoạn code này vào mạch ESP32.
