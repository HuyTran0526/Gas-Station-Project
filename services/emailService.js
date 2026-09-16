// URL Ứng dụng Web Google Apps Script để gửi email (bypass Vercel SMTP Block)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1-yX0zwZVyjkIux50YEqnOEq8RQEBukYBmj7OvSoS9zHO0o9DkR17IvbAvPSHXDan/exec';

/**
 * Hàm phụ trợ gửi thư qua Google Apps Script bằng HTTP POST (fetch)
 */
async function sendEmailViaGoogle(to, subject, html) {
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html })
  });

  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch(e) {
    throw new Error('Google Script trả về không phải JSON: ' + text);
  }

  if (result.status !== 'success') {
    throw new Error('Lỗi từ Google Script: ' + (result.message || JSON.stringify(result)));
  }
  return result;
}

/**
 * Gửi email cảnh báo rò rỉ gas
 * @param {Array<string>|string} recipientEmails Danh sách email nhận cảnh báo
 * @param {number} ppmValue Nồng độ khí gas đo được (PPM)
 */
async function sendWarningEmail(recipientEmails, ppmValue) {
  if (!recipientEmails || (Array.isArray(recipientEmails) && recipientEmails.length === 0)) {
    console.log('⚠️ Không có email người nhận nào được cung cấp để gửi cảnh báo.');
    return;
  }

  const emails = Array.isArray(recipientEmails) ? recipientEmails.join(', ') : recipientEmails;
  const timeString = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const isLelDanger = ppmValue >= 10000;

  const mailOptions = {
    from: `"Hệ thống Cảnh báo Gas SAFE FLAME" <${process.env.EMAIL_USER || 'no-reply@safeflame.com'}>`,
    to: emails,
    subject: `🚨 [SAFE FLAME] CẢNH BÁO NGUY HIỂM: PHÁT HIỆN RÒ RỈ GAS (${ppmValue} PPM)`,
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7fb; margin: 0; padding: 0; }
          .email-wrapper { padding: 40px 20px; text-align: center; }
          .email-card { background: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 20px; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.15); overflow: hidden; text-align: left; }
          .email-header { background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%); padding: 35px 30px; text-align: center; }
          .email-header-lel { background: linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%); }
          .email-header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
          .email-logo-box { background: rgba(255, 255, 255, 0.2); width: 60px; height: 60px; line-height: 60px; border-radius: 16px; margin: 0 auto 15px; font-size: 28px; display: inline-block; }
          .email-body { padding: 40px 35px; color: #334155; line-height: 1.7; font-size: 16px; }
          .status-badge { display: inline-block; background-color: #fee2e2; color: #b91c1c; font-weight: bold; padding: 8px 16px; border-radius: 30px; font-size: 14px; border: 1px solid #fca5a5; margin-bottom: 25px; }
          .status-badge-lel { background-color: #fef2f2; color: #7f1d1d; border-color: #ef4444; }
          .data-table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 25px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
          .data-table th, .data-table td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #f1f5f9; }
          .data-table tr:last-child td { border-bottom: none; }
          .data-table th { background-color: #f8fafc; font-weight: 600; color: #64748b; width: 45%; font-size: 14px; }
          .data-table td { font-weight: 700; color: #0f172a; font-size: 16px; }
          .data-value-danger { color: #ef4444; font-family: monospace; font-size: 20px !important; }
          .automation-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 25px; border-radius: 16px; margin: 30px 0; }
          .automation-box h3 { margin: 0 0 15px 0; color: #166534; font-size: 16px; }
          .device-list { margin: 0; padding: 0; list-style: none; }
          .device-item { padding: 10px 0; border-bottom: 1px dashed #dcfce3; color: #15803d; font-size: 15px; }
          .device-item:last-child { border-bottom: none; padding-bottom: 0; }
          .action-guide { margin-top: 35px; }
          .action-guide h3 { color: #1e293b; font-size: 18px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          .guide-step { display: table; width: 100%; margin-bottom: 15px; }
          .step-number { display: table-cell; width: 32px; font-weight: bold; color: #ef4444; font-size: 24px; vertical-align: top; padding-right: 10px; }
          .step-text { display: table-cell; vertical-align: top; font-size: 15px; padding-top: 4px; }
          .email-footer { background: #f1f5f9; padding: 25px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .email-footer p { margin: 5px 0; }
          .btn-primary { display: inline-block; background-color: #ef4444; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; font-size: 16px; }
          .btn-primary-blue { background-color: #3b82f6; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-card">
            <div class="email-header ${isLelDanger ? 'email-header-lel' : ''}">
              <div class="email-logo-box">🔥</div>
              <h1>Cảnh Báo Rò Rỉ Gas</h1>
            </div>
            <div class="email-body">
              <div style="text-align: center;">
                <div class="status-badge ${isLelDanger ? 'status-badge-lel' : ''}">
                  ⚠️ ${isLelDanger ? 'Mức độ: CỰC KỲ NGUY HIỂM (Nguy cơ cháy nổ)' : 'Mức độ: NGUY HIỂM CAO'}
                </div>
              </div>
              
              <p>Xin chào,</p>
              <p>Hệ thống giám sát an toàn <strong>SAFE FLAME</strong> vừa phát hiện sự gia tăng đột biến của khí Gas tại khu vực giám sát. Dưới đây là thông số chi tiết từ cảm biến:</p>
              
              <table class="data-table">
                <tr>
                  <th>Thời gian phát hiện</th>
                  <td>${timeString}</td>
                </tr>
                <tr>
                  <th>Nồng độ Khí (PPM)</th>
                  <td class="data-value-danger">${ppmValue} PPM</td>
                </tr>
                <tr>
                  <th>Trạng thái Hệ thống</th>
                  <td style="color: #ef4444;">ĐÃ KÍCH HOẠT KHẨN CẤP</td>
                </tr>
              </table>

              <div class="automation-box">
                <h3>🛡️ HỆ THỐNG ĐÃ TỰ ĐỘNG BẢO VỆ:</h3>
                <ul class="device-list">
                  <li class="device-item">
                    <span>✔️ <strong>Van khóa Gas:</strong> Đã đóng (Cắt nguồn Gas)</span>
                  </li>
                  <li class="device-item">
                    <span>✔️ <strong>Quạt hút gió:</strong> Đang hoạt động hết công suất</span>
                  </li>
                  <li class="device-item">
                    <span>✔️ <strong>Còi báo động:</strong> Đang reo cảnh báo tại chỗ</span>
                  </li>
                </ul>
              </div>

              <div class="action-guide">
                <h3>⚠️ HƯỚNG DẪN AN TOÀN KHẨN CẤP</h3>
                <div class="guide-step">
                  <div class="step-number">1</div>
                  <div class="step-text"><strong>Tuyệt đối không tạo tia lửa:</strong> Không bật/tắt công tắc điện, không dùng điện thoại, bật lửa gần khu vực rò rỉ.</div>
                </div>
                <div class="guide-step">
                  <div class="step-number">2</div>
                  <div class="step-text"><strong>Mở cửa thông gió:</strong> Mở ngay tất cả cửa sổ và cửa ra vào để khí gas thoát ra ngoài nhanh nhất.</div>
                </div>
                <div class="guide-step">
                  <div class="step-number">3</div>
                  <div class="step-text"><strong>Di tản an toàn:</strong> Yêu cầu mọi người rời khỏi khu vực nguy hiểm và gọi PCCC (114) nếu khí gas tiếp tục phun mạnh.</div>
                </div>
                </div>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://gas-warning-dashboard.vercel.app'}" class="btn-primary">Truy Cập Bảng Điều Khiển</a>
              </div>
            </div>
            <div class="email-footer">
              <p><strong>SAFE FLAME PROTECTION SYSTEM</strong></p>
              <p>Hệ thống Giám sát & Cảnh báo Rò rỉ Khí Gas IoT</p>
              <p style="font-size: 11px; margin-top: 15px;">Email tự động, vui lòng không trả lời.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sendEmailViaGoogle(mailOptions.to, mailOptions.subject, mailOptions.html);
    console.log(`✉️ Email cảnh báo đã gửi thành công tới ${emails} thông qua Google Script!`);
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email cảnh báo rò rỉ gas (Google Script):', error);
    throw error;
  }
}

/**
 * Gửi email chứa mã xác minh OTP để đặt lại mật khẩu
 * @param {string} recipientEmail Email của người nhận
 * @param {string} otp Mã xác minh OTP (6 chữ số)
 */
async function sendResetPasswordOtpEmail(recipientEmail, otp) {
  const mailOptions = {
    from: `"Hệ thống An toàn SAFE FLAME" <${process.env.EMAIL_USER || 'no-reply@safeflame.com'}>`,
    to: recipientEmail,
    subject: `🔑 [SAFE FLAME] Mã xác minh đặt lại mật khẩu của bạn`,
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7fb; margin: 0; padding: 0; }
          .email-wrapper { padding: 40px 20px; text-align: center; }
          .email-card { background: #ffffff; max-width: 550px; margin: 0 auto; border-radius: 20px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); overflow: hidden; text-align: left; }
          .email-header { background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 35px 30px; text-align: center; }
          .email-header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
          .email-logo-box { background: rgba(255, 255, 255, 0.2); width: 60px; height: 60px; line-height: 60px; border-radius: 16px; margin: 0 auto 15px; font-size: 28px; display: inline-block; }
          .email-body { padding: 40px 35px; color: #334155; line-height: 1.7; font-size: 16px; }
          .otp-container { background: #f8fafc; border: 2px dashed #94a3b8; border-radius: 16px; text-align: center; padding: 25px 20px; margin: 30px 0; }
          .otp-label { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
          .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; color: #0f172a; letter-spacing: 8px; margin: 0; }
          .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; border-radius: 0 12px 12px 0; font-size: 14px; color: #991b1b; margin-top: 30px; }
          .email-footer { background: #f1f5f9; padding: 25px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .email-footer p { margin: 5px 0; }
          .btn-primary { display: inline-block; background-color: #3b82f6; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-card">
            <div class="email-header">
              <div class="email-logo-box">🛡️</div>
              <h1>Xác Thực Tài Khoản</h1>
            </div>
            <div class="email-body">
              <p>Xin chào,</p>
              <p>Hệ thống bảo vệ <strong>SAFE FLAME</strong> vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này. Vui lòng sử dụng mã xác minh dưới đây để tiếp tục:</p>
              
              <div class="otp-container">
                <div class="otp-label">Mã OTP của bạn là</div>
                <div class="otp-code">${otp}</div>
              </div>

              <div class="warning-box">
                <strong>Lưu ý bảo mật:</strong> Mã xác minh này chỉ có hiệu lực trong <strong>10 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên hỗ trợ.
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #94a3b8;">Nếu bạn không thực hiện yêu cầu này, hãy phớt lờ email này. Tài khoản của bạn vẫn được bảo vệ an toàn.</p>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://gas-warning-dashboard.vercel.app'}" class="btn-primary">Truy Cập Trang Chủ</a>
              </div>
            </div>
            <div class="email-footer">
              <p><strong>SAFE FLAME PROTECTION SYSTEM</strong></p>
              <p>Hệ thống Giám sát & Cảnh báo Rò rỉ Khí Gas IoT</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sendEmailViaGoogle(mailOptions.to, mailOptions.subject, mailOptions.html);
    console.log(`✉️ Email OTP đặt lại mật khẩu đã gửi thành công tới ${recipientEmail} thông qua Google Script!`);
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi khi gửi email OTP đặt lại mật khẩu (Google Script):', error);
    throw error;
  }
}

module.exports = {
  sendWarningEmail,
  sendResetPasswordOtpEmail
};
