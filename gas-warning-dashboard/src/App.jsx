import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { Capacitor } from '@capacitor/core'
import {
  Activity,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Fan,
  Flame,
  Wifi,
  WifiOff,
  Settings,
  FileText,
  Volume2,
  VolumeX,
  Gauge,
  LogOut,
  User as UserIcon,
  X,
  Phone,
  Key,
  Loader2,
  Server,
  Power,
  Cpu,
  Layers,
  Plus,
  Radio,
  ChevronDown,
  Check,
  Home,
  Building2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import { App as CapacitorApp } from '@capacitor/app'
import './App.css'
import logoImg from './assets/logo.jpg'
import Login from './components/Login'
import Register from './components/Register'
import SoundSettingsModal from './components/SoundSettingsModal'
import AdminDashboard from './components/AdminDashboard'
import LandingPage from './components/LandingPage'
import alarmService from './services/alarmService'
import { initFCM } from './services/fcmService'
import { initGA4, trackGAEvent } from './services/analyticsService'

const CLOUD_BACKEND_URL = 'https://gas-station-project.onrender.com/api'

// Xóa bỏ triệt để mọi IP cũ lưu trong máy trước đây
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    localStorage.removeItem('custom_backend_url')
  } catch (e) {}
}

function App() {
  const backendUrl = (() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.endsWith('.local') || hostname === 'safeflame.vn')) {
        return `http://${hostname}:5001/api`
      }
    }
    return import.meta.env.VITE_BACKEND_URL || CLOUD_BACKEND_URL
  })()

  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    try {
      const saved = localStorage.getItem('selected_device_id')
      if (saved) return saved
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const u = JSON.parse(savedUser)
        if (u.assignedDeviceId) return u.assignedDeviceId
      }
    } catch (e) {}
    return 'DEFAULT_DEV'
  })
  const [currentDeviceName, setCurrentDeviceName] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const u = JSON.parse(savedUser)
        if (u.roomName) return u.roomName
      }
    } catch (e) {}
    return 'Phòng Mặc Định'
  })
  const [availableDevices, setAvailableDevices] = useState([])
  const [currentScreen, setCurrentScreen] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) return 'dashboard'
    return 'landing'
  })
  const [isAppInitializing, setIsAppInitializing] = useState(!!localStorage.getItem('token'))
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false)
  const [isAdminView, setIsAdminView] = useState(false)

  const [ppm, setPpm] = useState(350)
  const [isOnline, setIsOnline] = useState(true)
  const [isValveOpen, setIsValveOpen] = useState(true)
  const [isFanOn, setIsFanOn] = useState(false)
  const [isBuzzerMuted, setIsBuzzerMuted] = useState(false)

  const isSimulationRunning = false
  const baseLeakRate = 120
  const isGasLeaking = false

  const [leakElapsedTime, setLeakElapsedTime] = useState(0)
  const [recentReadings, setRecentReadings] = useState([])
  const [chartData, setChartData] = useState(Array(30).fill(350))

  // Xin quyền thông báo & Mở khóa AudioContext khi người dùng tương tác lần đầu
  useEffect(() => {
    alarmService.requestNotificationPermission()

    const unlockAudio = () => {
      alarmService.initAudio()
      alarmService.requestNotificationPermission()
      window.removeEventListener('click', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
    }

    window.addEventListener('click', unlockAudio)
    window.addEventListener('touchstart', unlockAudio)
    return () => {
      window.removeEventListener('click', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
    }
  }, [])

  const lastTrackedQueryRef = useRef('')

  // Khởi tạo GA4 & Lắng nghe nguồn truy cập UTM từ Facebook / TikTok / Trực Tiếp
  useEffect(() => {
    try {
      const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID
      if (gaId) {
        initGA4(gaId)
      }

      const params = new URLSearchParams(window.location.search)
      let utmSource = params.get('utm_source') || params.get('ref')
      const currentQuery = window.location.search || 'direct'

      // Nếu không có UTM và chưa từng ghi nhận session này (khách gõ link trực tiếp)
      const isDirectVisit = !utmSource && !sessionStorage.getItem('safeflame_session_tracked') && !localStorage.getItem('token')
      if (isDirectVisit) {
        utmSource = 'direct'
        sessionStorage.setItem('safeflame_session_tracked', 'true')
      }

      // Ngăn chặn React StrictMode chạy 2 lần trong môi trường Dev & chống gửi lặp cùng URL
      if (utmSource && lastTrackedQueryRef.current !== currentQuery) {
        lastTrackedQueryRef.current = currentQuery
        localStorage.setItem('traffic_source', utmSource)
        trackGAEvent('campaign_traffic', {
          source: utmSource,
          campaign: params.get('utm_campaign') || (utmSource === 'direct' ? 'direct_visit' : 'safeflame'),
          medium: params.get('utm_medium') || (utmSource === 'direct' ? 'none' : 'social')
        })

        fetch(`${backendUrl}/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: utmSource,
            path: window.location.pathname,
            referrer: document.referrer || '',
            device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
          })
        }).catch(() => {})
      }
    } catch (e) {}
  }, [backendUrl])

  // Lắng nghe phím Back vật lý trên Android để thoát app chuẩn xác
  useEffect(() => {
    let backListener = null
    let lastBackPress = 0

    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('backButton', () => {
        if (isProfileOpen) {
          setIsProfileOpen(false)
          return
        }
        if (isSoundModalOpen) {
          setIsSoundModalOpen(false)
          return
        }

        const now = Date.now()
        if (now - lastBackPress < 2000) {
          CapacitorApp.exitApp()
        } else {
          lastBackPress = now
          toast('Nhấn nút Quay lại lần nữa để thoát ứng dụng', {
            icon: '🚪',
            duration: 2000,
            id: 'exit-app-toast'
          })
        }
      }).then(listener => {
        backListener = listener
      })
    }

    return () => {
      if (backListener) {
        backListener.remove()
      }
    }
  }, [isProfileOpen, isSoundModalOpen])

  // Xử lý đăng nhập thành công
  const handleLoginSuccess = (newToken, user) => {
    localStorage.setItem('token', newToken)
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
      if (user.assignedDeviceId) {
        setSelectedDeviceId(user.assignedDeviceId)
        localStorage.setItem('selected_device_id', user.assignedDeviceId)
      }
      if (user.roomName) {
        setCurrentDeviceName(user.roomName)
      }
    }
    setToken(newToken)
    setCurrentUser(user)
    setCurrentScreen('dashboard')
  }

  // Xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('selected_device_id')
    setToken('')
    setCurrentUser(null)
    setCurrentScreen('landing')
    setSelectedDeviceId('DEFAULT_DEV')
    setCurrentDeviceName('Phòng Mặc Định')
  }

  // Xác minh token khi khởi động
  useEffect(() => {
    if (token) {
      let isMounted = true
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 15000) // Cho phép tối đa 15s (đặc biệt khi Cloud Render đang wake up)

      const verifyToken = async () => {
        try {
          const res = await fetch(`${backendUrl}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
          })
          if (!isMounted) return
          clearTimeout(timeoutId)
          if (res.ok) {
            const data = await res.json()
            setCurrentUser(data.user)
            localStorage.setItem('user', JSON.stringify(data.user))
            setCurrentScreen('dashboard')
          } else if (res.status === 401) {
            handleLogout()
          } else {
            // Lỗi tạm thời phía server, nếu đã có user lưu từ trước vẫn cho vào dashboard
            if (currentUser) {
              setCurrentScreen('dashboard')
            } else {
              handleLogout()
            }
          }
        } catch (err) {
          if (!isMounted) return
          console.warn('Lỗi kết nối Backend để xác thực:', err)
          if (currentUser) {
            setCurrentScreen('dashboard')
          } else {
            handleLogout()
          }
        } finally {
          if (isMounted) {
            setIsAppInitializing(false)
          }
        }
      }
      verifyToken()
      return () => {
        isMounted = false
        controller.abort()
        clearTimeout(timeoutId)
      }
    } else {
      setIsAppInitializing(false)
    }
  }, [token, backendUrl])

  // Đăng ký thiết bị nhận thông báo đẩy FCM theo Device ID (Kể cả khi chưa đăng nhập và sau khi đã đăng nhập)
  useEffect(() => {
    initFCM(token, backendUrl, selectedDeviceId)
  }, [token, backendUrl, selectedDeviceId])

  // Lấy danh sách các phòng / thiết bị từ máy chủ
  useEffect(() => {
    if (!token) return
    let isMounted = true
    const fetchDevices = async () => {
      try {
        const res = await fetch(`${backendUrl}/devices`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok && isMounted) {
          const data = await res.json()
          if (data.devices && Array.isArray(data.devices)) {
            setAvailableDevices(data.devices)
          }
        }
      } catch (e) {}
    }
    fetchDevices()
    const interval = setInterval(fetchDevices, 10000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [token, backendUrl])

  useEffect(() => {
    let pollingInterval = null
    if (!isSimulationRunning && token) {
      const fetchStatus = async () => {
        try {
          const res = await fetch(`${backendUrl}/status?deviceId=${selectedDeviceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.status === 401) {
            handleLogout()
            return
          }
          if (!res.ok) throw new Error('Không thể kết nối đến Backend')
          const data = await res.json()

          setPpm(data.ppm)
          setIsValveOpen(data.isOpen)
          setIsFanOn(data.isOn)
          setIsBuzzerMuted(data.isBuzzerMuted ?? false)
          if (data.deviceName) {
            setCurrentDeviceName(data.deviceName)
          }

          // Tự động đồng bộ ngay lập tức khi Chủ Trọ vừa gán hoặc đổi phòng cho người thuê
          if (data.userAssignedDeviceId) {
            setCurrentUser(prevUser => {
              if (prevUser && prevUser.role === 'tenant') {
                const isDifferentDevice = prevUser.assignedDeviceId !== data.userAssignedDeviceId
                const isDifferentRoomName = data.userRoomName && prevUser.roomName !== data.userRoomName

                if (isDifferentDevice || isDifferentRoomName) {
                  const newDevId = data.userAssignedDeviceId
                  const newRoomName = data.userRoomName || data.deviceName || `Phòng ${newDevId}`

                  console.log(`🔄 Tự động đồng bộ phòng mới từ Chủ Trọ: [${newDevId}] ${newRoomName}`)
                  setSelectedDeviceId(newDevId)
                  setCurrentDeviceName(newRoomName)
                  localStorage.setItem('selected_device_id', newDevId)

                  const updatedUser = {
                    ...prevUser,
                    assignedDeviceId: newDevId,
                    roomName: newRoomName
                  }
                  localStorage.setItem('user', JSON.stringify(updatedUser))

                  toast.success(`🏢 Phòng của bạn vừa được cập nhật: ${newRoomName}!`, {
                    id: 'room-sync-toast',
                    icon: '🔔',
                    duration: 4000
                  })

                  return updatedUser
                }
              }
              return prevUser
            })
          }

          if (data.isEspOnline !== undefined) {
            setIsOnline(data.isEspOnline)
          } else {
            setIsOnline(true)
          }

          if (data.recentLogs && Array.isArray(data.recentLogs)) {
            const formatted = data.recentLogs.map(log => ({
              timestamp: new Date(log.timestamp).getTime(),
              value: log.ppm
            })).reverse()
            setRecentReadings(formatted)
          }
        } catch (err) {
          console.warn('Lỗi kết nối Backend:', err)
          setIsOnline(false)
        }
      }

      fetchStatus()
      pollingInterval = setInterval(fetchStatus, 2000)
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [isSimulationRunning, token, backendUrl, selectedDeviceId])


  const handleToggleValveReal = async () => {
    if (!isOnline && !isSimulationRunning) return
    const targetState = !isValveOpen

    // 🔒 KHÓA LIÊN ĐỘNG AN TOÀN (Safety Interlock): Chống mở van khi nồng độ gas nguy hiểm
    if (targetState && (ppm >= 600 || isDangerMode)) {
      toast.error('🚫 CỰC KỲ NGUY HIỂM: Nồng độ khí gas đang vượt ngưỡng an toàn (≥ 600 PPM)! Hệ thống khóa cứng van để phòng ngừa cháy nổ.', {
        duration: 5000,
        id: 'safety-valve-lock'
      })
      return
    }

    if (isSimulationRunning) {
      setIsValveOpen(targetState)
      return
    }

    try {
      const res = await fetch(`${backendUrl}/control/valve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isOpen: targetState, deviceId: selectedDeviceId })
      })
      if (res.status === 401) {
        handleLogout()
        return
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.message || 'Không thể thực hiện thao tác trên van gas!')
        return
      }
      const data = await res.json()
      setIsValveOpen(data.isOpen)
      toast.success(data.isOpen ? `🔓 Đã mở Van Khóa Gas [${selectedDeviceId}]!` : `🔒 Đã đóng Van Khóa Gas [${selectedDeviceId}]!`)
    } catch (err) {
      console.error('Lỗi khi điều khiển van gas:', err)
      toast.error('Không thể kết nối đến máy chủ để điều khiển Van Khóa Gas. Vui lòng kiểm tra mạng!')
    }
  }

  const handleToggleFanReal = async () => {
    if (!isOnline && !isSimulationRunning) return
    const targetState = !isFanOn

    // 🔒 KHÓA LIÊN ĐỘNG AN TOÀN (Safety Interlock): Không cho phép tắt quạt khi nồng độ gas nguy hiểm
    if (!targetState && (ppm >= 600 || isDangerMode)) {
      toast.error('🚫 NGUY HIỂM: Không thể tắt quạt hút khi nồng độ gas đang ở mức nguy hiểm! Quạt phải chạy để thông gió cưỡng bức.', {
        duration: 5000,
        id: 'safety-fan-lock'
      })
      return
    }

    if (isSimulationRunning) {
      setIsFanOn(targetState)
      return
    }

    try {
      const res = await fetch(`${backendUrl}/control/fan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isOn: targetState, deviceId: selectedDeviceId })
      })
      if (res.status === 401) {
        handleLogout()
        return
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.message || 'Không thể thực hiện thao tác trên quạt hút!')
        return
      }
      const data = await res.json()
      setIsFanOn(data.isOn)
      toast.success(data.isOn ? `🌀 Đã bật Quạt Hút Gió [${selectedDeviceId}]!` : `⏸️ Đã tắt Quạt Hút Gió [${selectedDeviceId}]!`)
    } catch (err) {
      console.error('Lỗi khi điều khiển quạt hút:', err)
      toast.error('Không thể kết nối đến máy chủ để điều khiển Quạt Hút Gió. Vui lòng thử lại!')
    }
  }

  const handleToggleBuzzerReal = async () => {
    if (!isOnline && !isSimulationRunning) return
    const targetState = !isBuzzerMuted

    if (isSimulationRunning) {
      setIsBuzzerMuted(targetState)
      return
    }

    try {
      const res = await fetch(`${backendUrl}/control/buzzer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isMuted: targetState, deviceId: selectedDeviceId })
      })
      if (res.status === 401) {
        handleLogout()
        return
      }
      if (!res.ok) throw new Error('Control buzzer failed')
      const data = await res.json()
      setIsBuzzerMuted(data.isBuzzerMuted)
      toast.success(data.isBuzzerMuted ? `🔕 Đã tắt Còi Báo [${selectedDeviceId}]!` : `🔔 Đã bật Còi Báo [${selectedDeviceId}]!`)
    } catch (err) {
      console.error('Lỗi khi điều khiển còi báo:', err)
      toast.error('Không thể kết nối đến máy chủ để điều khiển Còi Báo Động!')
    }
  }

  useEffect(() => {
    let interval = null
    if (isSimulationRunning) {
      interval = setInterval(() => {
        setPpm((prevPpm) => {
          let nextPpm = prevPpm

          if (isGasLeaking && isValveOpen) {
            const fluctuation = Math.floor(Math.random() * 21) - 10
            nextPpm += (baseLeakRate + fluctuation)
          }

          if (isFanOn) {
            nextPpm -= 200
          } else {
            if (!(isGasLeaking && isValveOpen)) {
              nextPpm -= 15
            }
          }

          const ambientPpm = 350
          if (nextPpm < ambientPpm) nextPpm = ambientPpm
          if (nextPpm > 60000) nextPpm = 60000

          // Xử lý báo động có Dải trễ 100 PPM (Bật tại >= 600, Chỉ tắt khi < 500)
          if (nextPpm >= 600) {
            setIsValveOpen(false)
            setIsFanOn(true)
            setIsBuzzerMuted(false)
          }
          else if (nextPpm < 500 && prevPpm >= 500) {
            setIsFanOn(false)
            setIsBuzzerMuted(true)
          }

          fetch(`${backendUrl}/esp/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ppm: nextPpm })
          }).catch(err => console.error('Simulation backend sync error:', err));
          return Math.round(nextPpm)
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isSimulationRunning, isGasLeaking, isValveOpen, isFanOn, baseLeakRate, backendUrl])








  useEffect(() => {
    let elapsedInterval = null

    // Ngưỡng báo động nguy hiểm (>= 600 PPM)
    if (ppm >= 600 && isOnline) {
      elapsedInterval = setInterval(() => {
        setLeakElapsedTime(prev => prev + 1)
      }, 1000)

      // Kích hoạt Còi hú Siren và Rung máy nếu chưa bấm Tắt còi
      if (!isBuzzerMuted) {
        alarmService.startSiren()
      } else {
        alarmService.stopSiren()
      }

      // Bắn thông báo khẩn cấp lên thanh thông báo hệ thống Android
      alarmService.triggerSystemNotification(ppm)
    } else {
      // Khi trở về an toàn (< 600 PPM): Tắt còi hú, tắt rung và thu hồi thông báo
      alarmService.stopSiren()
      alarmService.clearSystemNotification()

      const timer = setTimeout(() => {
        setLeakElapsedTime(0)
      }, 0)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      if (isSimulationRunning) {
        const now = Date.now()
        setRecentReadings((prev) => {
          const updated = [...prev, { timestamp: now, value: ppm }]
          if (updated.length > 6) {
            updated.shift()
          }
          return updated
        })
      }

      setChartData((prev) => {
        const updated = [...prev.slice(1), ppm]
        return updated
      })
    }, 0)

    return () => {
      if (elapsedInterval) clearInterval(elapsedInterval)
      clearTimeout(timer)
    }
  }, [ppm, isOnline, isBuzzerMuted, isSimulationRunning])


  const calculateLeakRate = () => {
    if (recentReadings.length >= 2) {
      const first = recentReadings[0]
      const last = recentReadings[recentReadings.length - 1]
      const timeDiffSeconds = (last.timestamp - first.timestamp) / 1000

      if (timeDiffSeconds > 0) {
        const ppmDiff = last.value - first.value
        return Math.max(-500, Math.min(1000, ppmDiff / timeDiffSeconds))
      }
    }
    return 0
  }

  const leakRate = calculateLeakRate()



  const alarmThreshold = 600
  const lelThreshold = 10000


  const secondsToAlarm =
    leakRate > 0 && ppm < alarmThreshold ? Math.round((alarmThreshold - ppm) / leakRate) : null
  const secondsToLel =
    leakRate > 0 && ppm < lelThreshold ? Math.round((lelThreshold - ppm) / leakRate) : null


  const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '--'
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes} phút ${seconds} giây`
  }

  const formatLeakDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes} phút ${remainingSeconds} giây`
  }


  const getSeverity = () => {
    if (ppm < 300) return { level: 'SAFE', color: 'green', text: 'An toàn', bg: 'bg-emerald-50/80 border-emerald-100 text-emerald-700', icon: ShieldCheck }
    if (ppm < 600) return { level: 'WARNING', color: 'orange', text: 'Cảnh báo rò rỉ', bg: 'bg-amber-50/80 border-amber-100 text-amber-700', icon: Flame }
    return { level: 'DANGER', color: 'red', text: 'NGUY HIỂM NỔ!', bg: 'bg-red-50/80 border-red-100 text-red-700 shadow-neon-red', icon: ShieldAlert }
  }

  const severity = getSeverity()


  const maxVal = Math.max(...chartData, 5000)
  const minVal = Math.min(...chartData, 350)
  const valRange = maxVal - minVal || 1

  const points = chartData
    .map((val, idx) => {
      const x = (idx / 29) * 100
      const y = 80 - ((val - minVal) / valRange) * 70
      return `${x},${y}`
    })
    .join(' ')

  const fillPoints = `0,80 ${points} 100,80`

  if (isAppInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden animate-gradient-bg">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />

        <div className="glass-card p-8 sm:p-10 rounded-[32px] shadow-2xl flex flex-col items-center max-w-sm w-full text-center relative z-10 border border-slate-200/50 bg-white/95 animate-fade-slide">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 shadow-lg shadow-sky-500/10 overflow-hidden relative z-10 animate-bounce">
              <img src={logoImg} className="w-full h-full object-contain" alt="Safe Flame Logo" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-sky-500/20 -z-0 scale-125 animate-ping opacity-40" />
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 -z-0 scale-150 animate-pulse opacity-30" style={{ animationDuration: '2s' }} />
          </div>

          <h2 className="text-xl font-black bg-gradient-to-r from-blue-900 via-blue-800 to-sky-600 bg-clip-text text-transparent mb-2">
            SAFE FLAME
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">
            Protection System
          </p>

          <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4 relative border border-slate-200/50">
            <div className="h-full bg-gradient-to-r from-blue-600 to-sky-500 rounded-full w-full skeleton-shimmer" />
          </div>

          <p className="text-xs text-slate-500 font-semibold animate-pulse">
            Đang xác thực hệ thống an toàn...
          </p>
        </div>
      </div>
    )
  }

  if (currentScreen === 'landing') {
    return (
      <LandingPage
        onGoToLogin={() => setCurrentScreen('login')}
        onGoToRegister={() => setCurrentScreen('register')}
        onGoToDemo={() => setCurrentScreen('demo')}
      />
    )
  }

  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen text-slate-900 bg-grid-pattern relative flex flex-col items-center justify-center p-4 animate-gradient-bg">
        <button
          onClick={() => setCurrentScreen('landing')}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer bg-white/80 hover:bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs backdrop-blur-sm"
        >
          <span>← Quay lại Trang Giới Thiệu</span>
        </button>
        <Login
          backendUrl={backendUrl}
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setCurrentScreen('register')}
        />
      </div>
    )
  }

  if (currentScreen === 'register') {
    return (
      <div className="min-h-screen text-slate-900 bg-grid-pattern relative flex flex-col items-center justify-center p-4 animate-gradient-bg">
        <button
          onClick={() => setCurrentScreen('landing')}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer bg-white/80 hover:bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs backdrop-blur-sm"
        >
          <span>← Quay lại Trang Giới Thiệu</span>
        </button>
        <Register
          backendUrl={backendUrl}
          onRegisterSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setCurrentScreen('login')}
        />
      </div>
    )
  }

  return (
    <>
      <div className={`min-h-screen text-slate-900 bg-grid-pattern relative overflow-x-hidden pb-16 transition-all duration-1000 ${ppm >= 600 && isOnline ? 'animate-gradient-danger' : 'animate-gradient-bg'
        }`}>
      <div className="animate-fade-slide">
        { }
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[40%] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />
        {ppm >= 600 && isOnline && (
          <div className="absolute top-[30%] left-[20%] w-[50%] h-[40%] rounded-full bg-red-500/5 blur-[150px] pointer-events-none animate-pulse" />
        )}

        {/* Demo Mode Notice Bar */}
        {currentScreen === 'demo' && (
          <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white px-3 sm:px-6 py-2.5 text-xs sm:text-sm font-bold flex flex-wrap items-center justify-between gap-2 shadow-md relative z-50">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase">Demo Mode</span>
              <span>Bạn đang trải nghiệm giao diện Bàn Giám Sát mẫu (Không yêu cầu đăng nhập).</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('landing')}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              >
                ← Về Trang Giới Thiệu
              </button>
              <button
                onClick={() => setCurrentScreen('login')}
                className="px-3 py-1 rounded-lg bg-white text-blue-700 hover:bg-blue-50 text-xs font-extrabold transition-all cursor-pointer shadow-xs"
              >
                Đăng Nhập Ngay
              </button>
            </div>
          </div>
        )}

        {/* Header chính */}
        <header className="border-b border-slate-200/50 bg-white/75 backdrop-blur-md sticky top-0 z-50 px-3 py-3 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Safe Flame Logo */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-200/50 flex items-center justify-center p-0.5 sm:p-1 shadow-md shadow-sky-500/5 overflow-hidden">
                  <img src={logoImg} className="w-full h-full object-contain" alt="Safe Flame Logo" />
                </div>
                {ppm >= 600 && isOnline && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-ping" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold tracking-tight bg-gradient-to-r from-blue-900 via-blue-800 to-sky-600 bg-clip-text text-transparent leading-tight">
                  Hệ thống Cảnh báo Khí Gas IoT
                </h1>
                <p className="text-[8px] sm:text-[10px] font-bold text-sky-600 tracking-wider sm:tracking-widest uppercase mt-0.5">SAFE FLAME PROTECTION SYSTEM</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Nút Chuyển đổi Giám Sát / Quản Trị Trọ (Dành riêng cho Chủ Trọ) */}
              {currentUser?.role === 'landlord' && (
                <button
                  type="button"
                  onClick={() => setIsAdminView(prev => !prev)}
                  className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:py-1.5 sm:px-3 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 text-left ${
                    isAdminView
                      ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700'
                  }`}
                  title={isAdminView ? 'Chuyển sang Bàn Giám Sát Thiết Bị' : 'Chuyển sang Quản Trị Dãy Trọ'}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isAdminView ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {isAdminView ? <Activity className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-none">
                    <span className="text-[11px] font-black">
                      {isAdminView ? 'Giám Sát Home' : 'Quản Trị Trọ'}
                    </span>
                    <span className={`text-[8px] font-extrabold uppercase tracking-wider mt-0.5 ${
                      isAdminView ? 'text-blue-100' : 'text-blue-600'
                    }`}>
                      {isAdminView ? 'Bàn điều khiển' : 'Admin Panel'}
                    </span>
                  </div>
                </button>
              )}

              {/* Thông tin người dùng đăng nhập & Hồ sơ cá nhân */}
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 border border-sky-200/80 p-1.5 sm:py-1.5 sm:px-3 rounded-xl transition-all cursor-pointer text-left focus:outline-none shadow-xs active:scale-95"
                  title="Xem hồ sơ cá nhân"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-none">
                    <span className="text-[11px] font-bold text-slate-800 max-w-[110px] truncate">{currentUser.fullName}</span>
                    <span className="text-[8px] text-sky-600 font-extrabold uppercase tracking-wider mt-0.5">
                      {currentUser.role === 'landlord' ? 'Chủ Trọ' : 'Người Thuê'}
                    </span>
                  </div>
                </button>
              )}

              {/* Nút Cài đặt Còi Báo Động */}
              <button
                type="button"
                onClick={() => setIsSoundModalOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 border border-red-200/80 p-1.5 sm:py-1.5 sm:px-3 rounded-xl transition-all cursor-pointer text-left focus:outline-none shadow-xs active:scale-95 text-red-600"
                title="Cài đặt Âm thanh Còi Báo Động"
              >
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="text-[11px] font-bold text-slate-800">Còi Báo Động</span>
                  <span className="text-[8px] text-red-600 font-extrabold uppercase tracking-wider mt-0.5">
                    {alarmService.getSoundType() === 'whoop' ? 'Whoop' : alarmService.getSoundType() === 'beep' ? 'Bíp Bíp' : 'Cứu Hỏa'}
                  </span>
                </div>
              </button>

              {/* Trạng thái kết nối */}
              <div className={`flex items-center gap-1 sm:gap-2 p-2 sm:px-4 sm:py-2 rounded-xl border transition-all ${isOnline
                ? 'bg-sky-50 border-sky-200 text-sky-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider hidden sm:inline">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Nút đăng xuất */}
              <button
                onClick={handleLogout}
                className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-red-650 transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.95] shadow-sm"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-[10px] sm:text-xs font-bold hidden sm:inline">Đăng xuất</span>
              </button>

              {/* Nút Thoát hoàn toàn ứng dụng (Chỉ hiển thị trên Android App) */}
              {Capacitor.isNativePlatform() && (
                <button
                  type="button"
                  onClick={() => CapacitorApp.exitApp()}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.95] shadow-xs"
                  title="Thoát hoàn toàn ứng dụng"
                >
                  <Power className="w-4 h-4" />
                  <span className="text-[10px] sm:text-xs font-bold hidden sm:inline">Thoát App</span>
                </button>
              )}
            </div>
          </div>
        </header>

        { }
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 mt-4 sm:mt-6">
          {isAdminView && currentUser?.role === 'landlord' ? (
            <AdminDashboard
              currentUser={currentUser}
              token={token}
              backendUrl={backendUrl}
              onSwitchToMonitor={(devId, devName) => {
                setSelectedDeviceId(devId)
                setCurrentDeviceName(devName)
                localStorage.setItem('selected_device_id', devId)
                setIsAdminView(false)
                toast.success(`Đang can thiệp phòng: ${devName}`)
              }}
              onRefreshDevices={() => {
                if (token) {
                  fetch(`${backendUrl}/devices`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  }).then(r => r.json()).then(d => {
                    if (d.devices) setAvailableDevices(d.devices)
                  }).catch(() => {})
                }
              }}
            />
          ) : (
            <>
              {/* Banner Hồ sơ người dùng trên Dashboard */}
              {currentUser && (
            <div className="glass-card rounded-2xl p-3 sm:p-4 mb-4 border border-slate-200/80 bg-white/80 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white text-base font-black shadow-md shadow-sky-500/20 shrink-0">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                      Xin chào, <span className="text-sky-600">{currentUser.fullName}</span>
                    </h3>
                    <span className="px-2 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                      {currentUser.role === 'landlord' ? 'Chủ Trọ' : 'Người Thuê'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-none">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-700 border border-sky-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5 text-sky-600" />
                <span>Hồ sơ</span>
              </button>
            </div>
          )}

          {/* Thanh chuyển đổi & Giám sát phòng/thiết bị (Multi-Device Control Bar) */}
          {currentUser && (
            <div className="glass-card rounded-2xl p-3.5 sm:p-4 mb-4 border border-slate-200/80 bg-white/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20 shrink-0">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                        {currentUser.role === 'landlord' ? 'Khu Vực Đang Giám Sát' : 'Thiết Bị Của Bạn'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        isOnline ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
                        {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <h4 className="text-sm sm:text-base font-black text-slate-800">
                        {currentDeviceName || 'Phòng Mặc Định'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-xs font-bold border border-slate-200">
                        ID: {selectedDeviceId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phân quyền Chủ trọ vs Người thuê */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {currentUser.role === 'landlord' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Chuyển phòng:</span>
                      <div className="relative">
                        <select
                          value={selectedDeviceId}
                          onChange={(e) => {
                            const newDevId = e.target.value;
                            setSelectedDeviceId(newDevId);
                            localStorage.setItem('selected_device_id', newDevId);
                            const found = availableDevices.find(d => d.deviceId === newDevId);
                            if (found) setCurrentDeviceName(found.deviceName);
                            toast.success(`Đã chuyển sang xem: ${found ? found.deviceName : newDevId}`);
                          }}
                          className="pl-3 pr-8 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 cursor-pointer shadow-xs appearance-none"
                        >
                          {availableDevices.length > 0 ? (
                            availableDevices.map((dev) => (
                              <option key={dev.deviceId} value={dev.deviceId}>
                                {dev.deviceName} ({dev.deviceId}) {dev.isEspOnline ? '🟢' : '⚪'}
                              </option>
                            ))
                          ) : (
                            <option value={selectedDeviceId}>
                              {currentDeviceName} ({selectedDeviceId})
                            </option>
                          )}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsProfileOpen(true)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                        title="Quản lý / Thêm phòng mới"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Phòng Cố Định Của Bạn</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Banner Can Thiệp Khẩn Cấp Của Chủ Trọ (Master Override) */}
          {currentUser?.role === 'landlord' && selectedDeviceId !== 'DEFAULT_DEV' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs mb-4 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black block text-amber-900">
                    Chế Độ Can Thiệp Khẩn Cấp Của Chủ Trọ (Master Override)
                  </span>
                  <span className="text-[11px] text-amber-700">
                    Bạn đang giám sát từ xa phòng <b>{currentDeviceName} ({selectedDeviceId})</b>. Mọi thao tác khóa van, bật quạt hay ngắt còi báo giả sẽ có hiệu lực ngay lập tức.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAdminView(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Về Quản Trị Trọ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeviceId('DEFAULT_DEV')
                    setCurrentDeviceName('Trạm Gas Chính')
                    localStorage.setItem('selected_device_id', 'DEFAULT_DEV')
                    toast.success('Đã chuyển về Trạm Gas Chính')
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Về Trạm Tổng
                </button>
              </div>
            </div>
          )}

          { }
          {ppm >= 600 && isOnline && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 text-red-800 shadow-xl shadow-red-500/5 flex items-start gap-3 sm:gap-4 animate-shake">
              <div className="p-2.5 bg-red-600 rounded-xl text-white mt-0.5 shrink-0">
                <ShieldAlert className="w-5.5 h-5.5 sm:w-6 sm:h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base md:text-lg text-red-900 leading-snug">CẢNH BÁO: PHÁT HIỆN RÒ RỈ GAS!</h3>
                <p className="text-xs sm:text-sm text-red-800/95 mt-1 leading-normal">
                  Nồng độ hiện tại đạt <span className="font-bold underline">{ppm} PPM</span>. Hệ thống SAFE FLAME tự động khóa van cấp và kích hoạt quạt hút. Vui lòng di tản ngay lập tức!
                </p>
              </div>
            </div>
          )}

          { }
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

            { }
            <div className={`glass-card glass-card-hover rounded-3xl p-4 sm:p-5 md:p-6 relative overflow-hidden ${isOnline ? severity.bg : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
              <div className="flex justify-between items-center mb-5 sm:mb-6">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Gauge className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500" />
                  <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-500">Nồng độ Khí Gas</span>
                </div>
                <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${!isOnline ? 'bg-slate-200 text-slate-500' :
                  severity.level === 'SAFE' ? 'bg-emerald-100 text-emerald-800' :
                    severity.level === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {isOnline ? severity.text : 'Mất kết nối'}
                </span>
              </div>

              <div className="flex flex-col items-center py-2 sm:py-4">
                <div className={`relative flex items-center justify-center rounded-full p-2 ${ppm >= 600 && isOnline ? 'animate-pulse-radar' : ''
                  }`}>
                  { }
                  <svg className="w-32 h-32 xs:w-36 xs:h-36 sm:w-40 sm:h-40 transform -rotate-90" viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r="72"
                      stroke="#e2e8f0"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="72"
                      stroke={
                        !isOnline ? '#94a3b8' :
                          severity.level === 'SAFE' ? '#10b981' :
                            severity.level === 'WARNING' ? '#f59e0b' : '#ef4444'
                      }
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={452.3}
                      strokeDashoffset={452.3 - (Math.min(ppm, 10000) / 10000) * 452.3}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  { }
                  <div className="absolute text-center">
                    <span className="text-2xl xs:text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-slate-800">
                      {isOnline ? ppm : '---'}
                    </span>
                    <span className="block text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold mt-0.5">PPM</span>
                  </div>
                </div>

                { }
                <div className="w-full flex justify-between px-2 xs:px-4 sm:px-6 mt-4 text-[9px] xs:text-[10px] text-slate-400 font-bold">
                  <span>0 PPM (Sạch)</span>
                  <span>4k PPM (Báo động)</span>
                  <span>10k+ PPM</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/60 flex justify-between items-center flex-wrap gap-2 text-xs sm:text-sm">
                <span className="text-slate-500">Xu hướng:</span>
                <span className={`font-bold flex items-center gap-1 ${!isOnline ? 'text-slate-400' :
                  leakRate > 5 ? 'text-red-600' :
                    leakRate < -5 ? 'text-emerald-600' : 'text-slate-600'
                  }`}>
                  {isOnline ? (
                    <>
                      {leakRate > 5 ? '▲ Tăng nhanh' : leakRate < -5 ? '▼ Giảm dần' : '● Ổn định'}
                      <span className="text-[10px] sm:text-xs font-mono font-normal">({Math.round(leakRate)} PPM/s)</span>
                    </>
                  ) : '---'}
                </span>
              </div>
            </div>

            { }
            <div className="glass-card glass-card-hover rounded-3xl p-4 sm:p-5 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Settings className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500" />
                    <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-600">Thiết bị (Chạm để Bật/Tắt)</span>
                  </div>
                </div>

                { }
                <div className="grid grid-cols-3 gap-2 xs:gap-3 lg:grid-cols-1 xl:grid-cols-3 mt-2">

                  { }
                  <button
                    disabled={!isOnline && !isSimulationRunning}
                    onClick={handleToggleValveReal}
                    className={`relative p-3.5 xs:p-4 sm:p-5 rounded-2xl border flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all duration-300 active:scale-95 cursor-pointer select-none ${!isOnline && !isSimulationRunning
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      : isValveOpen
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-700 shadow-neon-green'
                        : 'bg-red-50/60 border-red-200 text-red-700 shadow-neon-red'
                      }`}
                  >
                    <div className={`p-2 sm:p-3.5 rounded-full ${!isOnline && !isSimulationRunning ? 'bg-slate-200' : isValveOpen ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                      <Flame className={`w-6 h-6 sm:w-8 sm:h-8 ${isValveOpen && ppm > 600 ? 'animate-bounce' : ''}`} />
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] xs:text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                        Van Khóa Gas {(!isValveOpen && (ppm >= 600 || isDangerMode)) ? '🔒' : ''}
                      </span>
                      <span className={`text-xs xs:text-sm sm:text-base font-extrabold block ${(!isValveOpen && (ppm >= 600 || isDangerMode)) ? 'text-rose-600 font-black' : ''}`}>
                        {isValveOpen ? 'ĐANG MỞ' : (ppm >= 600 || isDangerMode) ? 'KHÓA AN TOÀN' : 'ĐÃ ĐÓNG'}
                      </span>
                    </div>
                    { }
                    <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${!isOnline && !isSimulationRunning ? 'bg-slate-400' : isValveOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                      }`} />
                  </button>

                  { }
                  <button
                    disabled={!isOnline && !isSimulationRunning}
                    onClick={handleToggleFanReal}
                    className={`relative p-3.5 xs:p-4 sm:p-5 rounded-2xl border flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all duration-300 active:scale-95 cursor-pointer select-none ${!isOnline && !isSimulationRunning
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      : isFanOn
                        ? 'bg-sky-50 border-sky-200 text-sky-700 shadow-neon-sky'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                  >
                    <div className={`p-2 sm:p-3.5 rounded-full relative overflow-hidden ${!isOnline && !isSimulationRunning ? 'bg-slate-200' : isFanOn ? 'bg-sky-100' : 'bg-slate-200'
                      }`}>
                      {isFanOn && (
                        <>
                          <div className="wind-line top-2 w-6" style={{ animationDelay: '0s', left: '0%' }} />
                          <div className="wind-line top-5 w-8" style={{ animationDelay: '0.4s', left: '10%' }} />
                          <div className="wind-line top-8 w-5" style={{ animationDelay: '0.8s', left: '-5%' }} />
                        </>
                      )}
                      <Fan className={`w-6 h-6 sm:w-8 sm:h-8 ${isFanOn ? 'animate-spin-fast' : ''}`} />
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] xs:text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                        Quạt Hút Gió {(isFanOn && (ppm >= 600 || isDangerMode)) ? '⚡' : ''}
                      </span>
                      <span className={`text-xs xs:text-sm sm:text-base font-extrabold block ${isFanOn && (ppm >= 600 || isDangerMode) ? 'text-sky-600 font-black' : ''}`}>
                        {isFanOn ? ((ppm >= 600 || isDangerMode) ? 'THÔNG GIÓ' : 'ĐANG BẬT') : 'ĐANG TẮT'}
                      </span>
                    </div>
                    { }
                    <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${!isOnline && !isSimulationRunning ? 'bg-slate-400' : isFanOn ? 'bg-sky-500 animate-pulse' : 'bg-slate-300'
                      }`} />
                  </button>

                  { }
                  <button
                    disabled={!isOnline && !isSimulationRunning}
                    onClick={handleToggleBuzzerReal}
                    className={`relative p-3.5 xs:p-4 sm:p-5 rounded-2xl border flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all duration-300 active:scale-95 cursor-pointer select-none ${!isOnline && !isSimulationRunning
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      : !isBuzzerMuted
                        ? 'bg-amber-50/60 border-amber-200 text-amber-700 shadow-neon-orange'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                  >
                    <div className={`p-2 sm:p-3.5 rounded-full ${!isOnline && !isSimulationRunning ? 'bg-slate-200' : !isBuzzerMuted ? 'bg-amber-100' : 'bg-slate-200'
                      }`}>
                      {isBuzzerMuted ? (
                        <VolumeX className="w-6 h-6 sm:w-8 sm:h-8" />
                      ) : (
                        <Volume2 className={`w-6 h-6 sm:w-8 sm:h-8 ${!isBuzzerMuted && ppm >= 600 ? 'animate-bounce' : 'animate-pulse'}`} />
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] xs:text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Còi Báo Động</span>
                      <span className="text-xs xs:text-sm sm:text-base font-extrabold block">
                        {isBuzzerMuted ? 'ĐÃ TẮT' : 'ĐANG BẬT'}
                      </span>
                    </div>
                    { }
                    <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${!isOnline && !isSimulationRunning ? 'bg-slate-400' : !isBuzzerMuted ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
                      }`} />
                  </button>

                </div>
              </div>

              { }
              <div className="mt-4 text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-2 sm:p-2.5 rounded-xl">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
                <span>Khi môi trường trở về an toàn, hệ thống sẽ tự động tắt còi và quạt nhưng vẫn giữ nguyên khóa van (Đóng) để bạn có thời gian kiểm tra. Bạn có thể tự ấn mở van lại khi đã chắc chắn an toàn.</span>
              </div>
            </div>

            { }
            <div className="glass-card glass-card-hover rounded-3xl p-4 sm:p-5 md:p-6 relative overflow-hidden flex flex-col justify-between">

              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-4">
                  <Activity className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500" />
                  <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-500">Phân tích & Dự báo thời gian nổ</span>
                </div>

                {leakElapsedTime >= 5 ? (
                  <>
                    {/* Thời gian đã rò rỉ */}
                    <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
                      <span className="text-[10px] sm:text-xs text-slate-500 block font-bold">Thời gian rò rỉ (Gas &gt; 600 PPM)</span>
                      <span className={`text-base sm:text-xl font-bold font-mono tracking-tight block mt-0.5 ${ppm > 600 ? 'text-amber-600 animate-pulse' : 'text-slate-400'
                        }`}>
                        {formatLeakDuration(leakElapsedTime)}
                      </span>
                    </div>

                    {/* Ngưỡng cảnh báo & nổ */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center text-xs sm:text-sm p-2 sm:p-2.5 rounded-xl bg-slate-50 gap-2">
                        <span className="text-slate-500 flex items-center gap-1.5 font-semibold text-[10px] sm:text-sm shrink-0">
                          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 shrink-0" />
                          <span className="hidden xs:inline">Ngưỡng Báo Động</span>
                          <span className="inline xs:hidden">Báo động</span> (600 PPM):
                        </span>
                        <span className="font-mono font-bold text-orange-600 text-[10px] sm:text-sm">
                          {ppm >= alarmThreshold ? 'Đã đạt' : formatTime(secondsToAlarm)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs sm:text-sm p-2 sm:p-2.5 rounded-xl bg-slate-50 gap-2">
                        <span className="text-slate-500 flex items-center gap-1.5 font-semibold text-[10px] sm:text-sm shrink-0">
                          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                          <span className="hidden xs:inline">Ngưỡng Cháy Nổ LEL</span>
                          <span className="inline xs:hidden">Ngưỡng nổ LEL</span> (40k PPM):
                        </span>
                        <span className="font-mono font-bold text-red-600 text-[10px] sm:text-sm">
                          {ppm >= lelThreshold ? 'ĐÃ ĐẠT NGƯỠNG NỔ' : formatTime(secondsToLel)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-5 sm:py-6 px-2 sm:px-4 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-3 border border-emerald-100">
                      <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-800">Môi trường an toàn</h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">
                      Chưa phát hiện rò rỉ khí gas kéo dài. Hệ thống đang hoạt động an toàn và ổn định.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-2 sm:p-3 rounded-xl bg-slate-50 text-[10px] sm:text-[11px] text-slate-500 border border-slate-200/80">
                {leakElapsedTime >= 5 && leakRate > 0 ? (
                  <span>
                    Khí gas đang tăng ở tốc độ <strong>{Math.round(leakRate)} PPM/giây</strong>.
                  </span>
                ) : (
                  <span>
                    Hiện tại không ghi nhận tốc độ tăng gas nguy hiểm. Hệ thống ổn định.
                  </span>
                )}
              </div>

            </div>

          </div>

          { }
          <div className="glass-card glass-card-hover rounded-3xl p-4 sm:p-5 md:p-6 mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <div>
                <h3 className="font-bold text-sm xs:text-base md:text-lg text-slate-800">Biểu đồ Lịch sử Nồng độ Khí Gas (30s gần nhất)</h3>
                <p className="text-[10px] sm:text-xs text-slate-400">Tốc độ cập nhật: 1 giây / lần</p>
              </div>
              <div className="flex items-center gap-2 text-[9px] xs:text-[10px] sm:text-xs flex-wrap">
                <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-lg border border-emerald-100/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="hidden xs:inline">An toàn (&lt; 600)</span>
                  <span className="inline xs:hidden">&lt; 600</span>
                </span>
                <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-lg border border-amber-100/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="hidden xs:inline">Cảnh báo (600 - 4k)</span>
                  <span className="inline xs:hidden">600 - 4k</span>
                </span>
                <span className="flex items-center gap-1 font-bold text-red-700 bg-red-50/80 px-2 py-0.5 rounded-lg border border-red-100/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="hidden xs:inline">Nguy hiểm (&gt; 4k)</span>
                  <span className="inline xs:hidden">&gt; 4k</span>
                </span>
              </div>
            </div>

            <div className="w-full h-28 xs:h-32 sm:h-36 md:h-44 bg-slate-50/50 rounded-2xl border border-slate-200 p-2 sm:p-3 relative overflow-hidden">
              <svg
                className="w-full h-full"
                viewBox="0 0 100 80"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3186b2" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="0.5" />
                <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="0.5" />
                <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="0.5" />

                <polygon
                  points={fillPoints}
                  fill="url(#chartGrad)"
                  className="transition-all duration-500"
                />

                <polyline
                  fill="none"
                  stroke={
                    ppm < 300 ? '#3186b2' :
                      ppm < 600 ? '#f59e0b' : '#ef4444'
                  }
                  strokeWidth="1.5"
                  points={points}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute top-2 left-4 text-[8px] xs:text-[9px] sm:text-[10px] text-slate-500 bg-white/95 border border-slate-200/80 px-1.5 py-0.5 rounded font-bold">
                Max: {Math.round(maxVal)} PPM
              </div>
              <div className="absolute bottom-2 left-4 text-[8px] xs:text-[9px] sm:text-[10px] text-slate-500 bg-white/95 border border-slate-200/80 px-1.5 py-0.5 rounded font-bold">
                Min: {Math.round(minVal)} PPM
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5 sm:p-6 md:p-8 mt-6">
            <div className="flex items-center gap-2.5 mb-6 border-b border-slate-200 pb-4">
              <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                <FileText className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm xs:text-base md:text-lg text-slate-800">
                  Hướng Dẫn Sử Dụng & Giải Thích Thông Số
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  Thông tin chi tiết về các thông số đo lường và hướng dẫn điều khiển an toàn hệ thống SAFE FLAME.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4 sm:space-y-5">
                <h4 className="font-bold text-xs sm:text-sm text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-4 h-4" />
                  Giải thích thông số giám sát
                </h4>

                <div className="space-y-3">
                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-800">Nồng độ khí Gas (PPM)</h5>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
                        Đo lượng khí gas tồn tại trong không khí bằng đơn vị Phần Triệu (PPM).
                      </p>
                      <ul className="mt-2 space-y-1 text-[9px] sm:text-xs text-slate-650 font-medium">
                        <li className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <strong>Dưới 600 PPM:</strong> Môi trường an toàn, không khí sạch.
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <strong>600 - 4000 PPM:</strong> Cảnh báo rò rỉ nhẹ, cần kiểm tra hệ thống gas.
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <strong>Trên 600 PPM:</strong> Ngưỡng nguy hiểm. Báo động kêu.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <Activity className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-800">Tốc độ rò rỉ (PPM/giây) & Dự báo nổ</h5>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
                        Cho biết tốc độ tăng/giảm lượng khí gas mỗi giây. Dựa vào tốc độ này, hệ thống sẽ tự động tính toán thời gian ước lượng khí gas sẽ đạt ngưỡng báo động hoặc ngưỡng nổ (LEL) để người dùng kịp thời đưa ra phương án xử lý hoặc di tản.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                <h4 className="font-bold text-xs sm:text-sm text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4" />
                  Hướng dẫn điều khiển thiết bị
                </h4>

                <div className="space-y-3">
                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <Flame className="w-4.5 h-4.5 text-red-500" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-800">Van Khóa Gas & Quạt Hút Gió</h5>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
                        Khi nồng độ Gas giảm xuống dưới 600 PPM (về mức an toàn), hệ thống sẽ tự động tắt Quạt và Còi báo động. Tuy nhiên, Van khóa Gas sẽ <strong>luôn giữ nguyên trạng thái đóng</strong> nhằm đảm bảo an toàn tuyệt đối. Người dùng cần tự ấn nút mở Van trở lại sau khi đã xác nhận xử lý xong rò rỉ.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <Volume2 className="w-4.5 h-4.5 text-amber-500" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-800">Còi/Loa Cảnh Báo (Buzzer)</h5>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
                        Còi báo phát âm thanh cảnh báo tại chỗ. Khi còi kêu do rò rỉ, bạn có thể tạm thời nhấn nút tắt còi để ngưng tiếng ồn khó chịu trong lúc tiến hành xử lý rò rỉ gas hoặc khi đã khóa van an toàn.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

            </>
          )}
        </main>

        { }
        {isProfileOpen && (
          <ProfileModal
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            token={token}
            backendUrl={backendUrl}
            selectedDeviceId={selectedDeviceId}
            setSelectedDeviceId={setSelectedDeviceId}
            currentDeviceName={currentDeviceName}
            setCurrentDeviceName={setCurrentDeviceName}
            availableDevices={availableDevices}
            onClose={() => setIsProfileOpen(false)}
            onOpenAdmin={() => {
              setIsProfileOpen(false)
              setIsAdminView(true)
            }}
          />
        )}

        {isSoundModalOpen && (
          <SoundSettingsModal onClose={() => setIsSoundModalOpen(false)} />
        )}

        <footer className="max-w-7xl mx-auto px-4 md:px-8 mt-12 text-center text-[10px] md:text-xs text-slate-400 font-semibold">
          <p>© 2026 Hệ thống giám sát rò rỉ khí Gas IoT. Thiết kế đồng bộ bởi thương hiệu SAFE FLAME.</p>
        </footer>
      </div>
    </div>
    </>
  )
}

function ProfileModal({
  currentUser,
  setCurrentUser,
  token,
  backendUrl,
  selectedDeviceId,
  setSelectedDeviceId,
  currentDeviceName,
  setCurrentDeviceName,
  availableDevices,
  onClose,
  onOpenAdmin
}) {
  if (!currentUser) return null;
  const [fullName, setFullName] = useState(currentUser?.fullName || '')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [deviceInput, setDeviceInput] = useState(selectedDeviceId || currentUser?.assignedDeviceId || 'DEFAULT_DEV')
  const [roomNameInput, setRoomNameInput] = useState(currentDeviceName || currentUser?.roomName || 'Phòng Mặc Định')
  const [isAssigning, setIsAssigning] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeTab, setActiveTab] = useState('info') // 'info', 'device', or 'password'

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!fullName.trim()) {
      setError('Họ và tên không được để trống!')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${backendUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi cập nhật thông tin.')
      }
      setCurrentUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      setSuccess('Cập nhật hồ sơ thành công!')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignDevice = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const cleanDev = deviceInput.trim().toUpperCase()
    const cleanRoom = roomNameInput.trim() || ('Phòng ' + cleanDev)

    if (!cleanDev) {
      setError('Vui lòng nhập Mã Thiết Bị (Device ID)!')
      return
    }

    setIsAssigning(true)
    try {
      const res = await fetch(`${backendUrl}/auth/assign-device`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deviceId: cleanDev, roomName: cleanRoom })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi liên kết thiết bị.')
      }

      // Cập nhật state toàn cục & localStorage
      setCurrentUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      if (setSelectedDeviceId) {
        setSelectedDeviceId(cleanDev)
        localStorage.setItem('selected_device_id', cleanDev)
      }
      if (setCurrentDeviceName) {
        setCurrentDeviceName(cleanRoom)
      }

      // Đăng ký lại FCM Token với deviceId mới
      initFCM(token, backendUrl, cleanDev)

      setSuccess(`Đã liên kết thành công với [${cleanDev}] - ${cleanRoom}!`)
      toast.success(`Đã chuyển sang phòng: ${cleanRoom}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin mật khẩu!')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!')
      return
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải chứa ít nhất 6 ký tự!')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${backendUrl}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi đổi mật khẩu.')
      }
      setSuccess('Đổi mật khẩu thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px] z-[9999] flex justify-end animate-fade-in text-slate-800 cursor-pointer" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-white/95 backdrop-blur-md border-l border-slate-200/60 shadow-2xl relative flex flex-col animate-sidebar-slide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute top-[-30%] left-[-30%] w-[60%] h-[60%] rounded-full bg-sky-500/5 blur-[100px] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 rounded-xl text-sky-600">
              <UserIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Hồ sơ & Thiết bị</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs selector */}
        <div className="flex border-b border-slate-200/50 px-4 sm:px-6 pt-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('info'); setError(''); setSuccess(''); }}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'info'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            Tài khoản
          </button>
          <button
            onClick={() => { setActiveTab('device'); setError(''); setSuccess(''); }}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'device'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            Thiết bị & Phòng
          </button>
          <button
            onClick={() => { setActiveTab('password'); setError(''); setSuccess(''); }}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'password'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            Đổi mật khẩu
          </button>
        </div>

        {/* Modal Body (Scrollable Sidebar) */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-150 text-red-700 text-xs font-semibold flex items-center gap-2 animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <span>{success}</span>
            </div>
          )}

          {activeTab === 'info' && (
            <form key="form-profile-info" onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Account Details read-only */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Vai trò</span>
                  <span className="text-xs font-bold text-sky-600 mt-1 block uppercase">
                    {currentUser?.role === 'landlord' ? 'Chủ Trọ' : 'Người Thuê'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Email</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block truncate" title={currentUser?.email}>
                    {currentUser?.email}
                  </span>
                </div>
              </div>

              {/* Editable Fields */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Họ và tên *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value.replace(/[<>]/g, ''))}
                    placeholder="Nhập họ tên của bạn..."
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thông tin'
                )}
              </button>
            </form>
          )}

          {activeTab === 'device' && (
            <div key="panel-profile-device" className="space-y-4">
              {currentUser?.role === 'tenant' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-slate-700">
                    <div className="flex items-center gap-2 text-sky-700 font-bold text-xs mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Thiết bị bảo vệ phòng của bạn</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Tài khoản Người Thuê được cố định với thiết bị được cấp. Mọi cảnh báo rò rỉ khí gas tại phòng này sẽ được gửi thông báo khẩn cấp và hú còi bảo vệ.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Phòng Đang Ở</span>
                      <span className="text-base font-black text-slate-800">{currentUser.roomName || 'Phòng Mặc Định'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Mã Thiết Bị ESP32 (Device ID)</span>
                      <span className="text-sm font-mono font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block mt-0.5">
                        {currentUser.assignedDeviceId || 'DEFAULT_DEV'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Quyền Can Thiệp Thiết Bị</span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Có toàn quyền điều khiển Van Gas, Quạt Hút, Còi Báo tại phòng này</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      <b>Lưu ý dành cho người thuê:</b> Thiết bị phòng được quản lý và phân quyền trực tiếp bởi <b>Chủ Trọ</b>. Nếu bạn chuyển phòng hoặc thay đổi cảm biến, vui lòng liên hệ Chủ Trọ để được cập nhật trên hệ thống.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-slate-700">
                    <div className="flex items-center gap-2 text-sky-700 font-bold text-xs mb-1">
                      <Radio className="w-4 h-4 text-sky-600" />
                      <span>Trung Tâm Quản Trị Hệ Thống Phòng & Cảm Biến</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Với tư cách <b>Chủ Trọ</b>, bạn có toàn quyền thêm phòng mới, xóa/sửa cảm biến ESP32 và phân chia phòng cho từng khách thuê tại <b>Trang Quản Trị Trọ</b>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tổng số phòng trọ</span>
                      <span className="text-sm font-black text-slate-800">{availableDevices?.length || 0} phòng</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Phòng đang theo dõi</span>
                      <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                        {currentDeviceName} ({selectedDeviceId})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      if (onOpenAdmin) onOpenAdmin()
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Building2 className="w-4.5 h-4.5" />
                    <span>Mở Trang Quản Trị Trọ (CRUD Phòng & Người Thuê)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <form key="form-profile-password" onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Mật khẩu hiện tại *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại..."
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Mật khẩu mới *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự..."
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Xác nhận mật khẩu mới *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    Đang thay đổi...
                  </>
                ) : (
                  'Đổi mật khẩu'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null
}

export default App
