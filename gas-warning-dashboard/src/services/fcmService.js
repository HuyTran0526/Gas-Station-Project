import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import toast from 'react-hot-toast'

// Gửi token thiết bị lên Cloud Server (hỗ trợ cả có token JWT lẫn chưa đăng nhập)
async function sendTokenToServer(deviceToken, authToken, backendUrl, deviceId) {
  if (!deviceToken || !backendUrl) return

  try {
    const headers = {
      'Content-Type': 'application/json'
    }
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const res = await fetch(`${backendUrl}/auth/fcm-token`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        fcmToken: deviceToken,
        platform: 'android',
        deviceId: deviceId || 'DEFAULT_DEV'
      })
    })

    if (res.ok) {
      console.log('✅ Đã đồng bộ FCM Device Token lên Cloud Server thành công cho:', deviceId || 'DEFAULT_DEV')
    } else {
      console.warn('⚠️ Server từ chối lưu FCM Token:', res.status)
    }
  } catch (err) {
    console.warn('❌ Lỗi kết nối gửi FCM Token lên server:', err.message)
  }
}

export const initFCM = async (authToken, backendUrl, deviceId) => {
  if (!Capacitor.isNativePlatform()) return

  try {
    // Nếu thiết bị đã từng lấy được token trước đó, gửi ngay lên server
    const cachedToken = localStorage.getItem('fcm_device_token')
    if (cachedToken) {
      sendTokenToServer(cachedToken, authToken, backendUrl, deviceId)
    }

    // 1. Gỡ bỏ listeners cũ để tránh đăng ký trùng lặp
    try {
      await PushNotifications.removeAllListeners()
    } catch (e) {}

    // 2. ĐĂNG KÝ LISTENERS TRƯỚC KHI GỌI register() (Bắt buộc theo tài liệu Capacitor)
    await PushNotifications.addListener('registration', async (fcmToken) => {
      console.log('✅ Đã nhận FCM Device Token từ Google:', fcmToken.value)
      localStorage.setItem('fcm_device_token', fcmToken.value)
      await sendTokenToServer(fcmToken.value, authToken, backendUrl, deviceId)
      toast.success('🔔 Đã kết nối nhận báo động phòng!', {
        id: 'fcm-connect-success',
        duration: 3000
      })
    })

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Lỗi đăng ký nhận thông báo FCM:', error)
      toast.error('Thiết bị không thể nhận thông báo đẩy. Vui lòng kiểm tra Google Play Services.', {
        id: 'fcm-connect-error',
        duration: 5000
      })
    })

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📩 Đã nhận thông báo đẩy FCM khi mở app:', notification)
    })

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('👉 Người dùng chạm vào thông báo đẩy FCM:', action)
    })

    // 3. Tạo Notification Channel độ ưu tiên MAX trên Android (Đổ chuông, bật sáng màn hình)
    await PushNotifications.createChannel({
      id: 'gas_emergency_channel',
      name: 'Báo Động Khẩn Cấp SafeFlame',
      description: 'Kênh thông báo còi hú và rung khi rò rỉ khí gas nguy hiểm',
      importance: 5, // MAX: Hiển thị heads-up banner, rung và âm thanh
      visibility: 1, // Hiển thị đầy đủ trên màn hình khóa
      vibration: true,
      lights: true,
      lightColor: '#FF0000'
    })

    // 4. Kiểm tra quyền & Yêu cầu cấp quyền
    let perm = await PushNotifications.checkPermissions()
    if (perm.receive !== 'granted') {
      perm = await PushNotifications.requestPermissions()
    }

    if (perm.receive === 'granted') {
      // 5. Phát lệnh đăng ký FCM với Google Play Services
      await PushNotifications.register()
    } else {
      console.warn('⚠️ Người dùng chưa cấp quyền thông báo đẩy')
    }
  } catch (e) {
    console.error('❌ Lỗi khởi tạo FCM Push Notifications:', e)
  }
}

export default initFCM
