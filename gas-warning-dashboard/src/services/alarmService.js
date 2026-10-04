import { Haptics, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'
import hiloSound from '../assets/alarm-hilo.wav'
import whoopSound from '../assets/alarm-whoop.wav'
import beepSound from '../assets/alarm-beep.wav'

const SOUND_MAP = {
  hilo: hiloSound,
  whoop: whoopSound,
  beep: beepSound
}

class AlarmService {
  constructor() {
    this.audioElement = null
    this.previewElement = null
    this.previewTimer = null
    this.vibrateInterval = null
    this.isAlarmActive = false
    this.currentSoundType = (typeof window !== 'undefined' && localStorage.getItem('safeflame_alarm_sound')) || 'hilo'
  }

  initAudio() {}

  setSoundType(type) {
    this.currentSoundType = type
    if (typeof window !== 'undefined') {
      localStorage.setItem('safeflame_alarm_sound', type)
    }
    if (this.isAlarmActive) {
      this.stopSiren()
      this.startSiren()
    }
  }

  getSoundType() {
    return this.currentSoundType
  }

  // Rung máy cực VIP trên điện thoại thật (an toàn 100% trên cả giả lập)
  startVibration() {
    if (this.vibrateInterval) return

    const triggerHaptics = async () => {
      if (!this.isAlarmActive) return
      try {
        if (Capacitor.isNativePlatform()) {
          await Haptics.notification({ type: NotificationType.Error }).catch(() => {})
          await Haptics.vibrate({ duration: 800 }).catch(() => {})
        } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([600, 200, 600, 200, 1000])
        }
      } catch (e) {}
    }

    triggerHaptics()
    this.vibrateInterval = setInterval(triggerHaptics, 2200)
  }

  stopVibration() {
    if (this.vibrateInterval) {
      clearInterval(this.vibrateInterval)
      this.vibrateInterval = null
    }
  }

  // Phát còi báo động khẩn cấp
  startSiren() {
    if (this.isAlarmActive) return
    this.isAlarmActive = true
    this.stopPreview()

    try {
      const src = SOUND_MAP[this.currentSoundType] || hiloSound
      if (!this.audioElement) {
        this.audioElement = new Audio()
      }
      this.audioElement.src = src
      this.audioElement.loop = true
      this.audioElement.volume = 1.0

      const playPromise = this.audioElement.play()
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Audio play chưa sẵn sàng:', err)
        })
      }
    } catch (e) {
      console.warn('Lỗi khi phát âm thanh còi:', e)
    }

    // Kích hoạt rung VIP
    this.startVibration()
  }

  // Tắt còi báo động & Tắt rung
  stopSiren() {
    this.isAlarmActive = false
    if (this.audioElement) {
      try {
        this.audioElement.pause()
        this.audioElement.currentTime = 0
      } catch (e) {}
    }
    this.stopVibration()
  }

  // Nghe thử âm thanh trong 3.5 giây
  previewSound(type, onFinish) {
    this.stopSiren()
    this.stopPreview()

    try {
      const src = SOUND_MAP[type] || hiloSound
      this.previewElement = new Audio(src)
      this.previewElement.loop = true
      this.previewElement.volume = 1.0

      const playPromise = this.previewElement.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {})
      }

      // Nghe thử cũng rung nhẹ 1 nhịp thử nghiệm
      try {
        Haptics.vibrate({ duration: 300 }).catch(() => {})
      } catch (e) {}

      this.previewTimer = setTimeout(() => {
        this.stopPreview()
        if (onFinish) onFinish()
      }, 3500)
    } catch (e) {
      if (onFinish) onFinish()
    }
  }

  stopPreview() {
    if (this.previewTimer) {
      clearTimeout(this.previewTimer)
      this.previewTimer = null
    }
    if (this.previewElement) {
      try {
        this.previewElement.pause()
        this.previewElement.currentTime = 0
      } catch (e) {}
      this.previewElement = null
    }
  }

  requestNotificationPermission() {}
  triggerSystemNotification() {}
  clearSystemNotification() {}
}

export const alarmService = new AlarmService()
export default alarmService
