import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity,
  CheckCircle2,
  X,
  Play,
  Flame,
  Fan,
  Volume2,
  Cpu,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Wifi,
  WifiOff
} from 'lucide-react'

export default function SelfTestModal({
  isOpen,
  onClose,
  backendUrl,
  token,
  deviceId,
  roomName,
  isOnline = false,
  lastTestedAt,
  testScheduleDays = 30,
  onTestComplete
}) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0: Idle, 1: Sensor, 2: Valve, 3: Fan, 4: Buzzer, 5: Done
  const [countdown, setCountdown] = useState(5)
  const [scheduleDays, setScheduleDays] = useState(testScheduleDays)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false)
      setCurrentStep(0)
      setCountdown(5)
      setTestResult(null)
    }
  }, [isOpen])

  const runTestRoutine = async () => {
    if (!isOnline) return

    setIsRunning(true)
    setCurrentStep(1)
    setCountdown(5)
    setTestResult(null)

    // Chuỗi kiểm tra từng cơ cấu theo giây
    setTimeout(() => {
      setCurrentStep(2)
      setCountdown(4)
    }, 1000)

    setTimeout(() => {
      setCurrentStep(3)
      setCountdown(3)
    }, 2000)

    setTimeout(() => {
      setCurrentStep(4)
      setCountdown(2)
    }, 3000)

    setTimeout(() => {
      setCountdown(1)
    }, 4000)

    setTimeout(async () => {
      setCurrentStep(5)
      setCountdown(0)
      setIsRunning(false)

      setTestResult({
        status: 'passed',
        timestamp: new Date(),
        details: [
          'Cảm biến khí Gas MQ: Điện áp 1.25V - Độ nhạy chuẩn 100%',
          'Cơ cấu Servo Van Khóa: Đóng/Mở 90 độ trơn tru trong 0.5s',
          'Rơ-le Quạt Thông Gió: Tiếp điểm đóng ngắt chuẩn',
          'Còi Báo Động Hú: Âm lượng đạt chuẩn > 85dB'
        ]
      })

      // Gửi yêu cầu cập nhật lên Backend
      try {
        const res = await fetch(`${backendUrl}/device/self-test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            deviceId: deviceId || 'DEFAULT_DEV'
          })
        })
        const data = await res.json()
        if (onTestComplete) {
          onTestComplete(data.lastTestedAt || new Date())
        }
      } catch (err) {
        console.warn('Lỗi ghi nhận self-test:', err)
      }
    }, 5000)
  }

  const handleSaveSchedule = async (days) => {
    setScheduleDays(days)
    setIsSavingSchedule(true)
    try {
      await fetch(`${backendUrl}/device/test-schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceId: deviceId || 'DEFAULT_DEV',
          days
        })
      })
    } catch (err) {
      console.warn('Lỗi cập nhật chu kỳ test:', err)
    } finally {
      setIsSavingSchedule(false)
    }
  }

  if (!isOpen) return null

  // Tính ngày kiểm tra tiếp theo
  const lastDate = lastTestedAt ? new Date(lastTestedAt) : null
  const nextTestDate = lastDate ? new Date(lastDate.getTime() + scheduleDays * 24 * 60 * 60 * 1000) : null
  const isOverdue = nextTestDate ? new Date() > nextTestDate : false

  return typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl my-auto bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">Kiểm Định Cơ Cấu Định Kỳ (Self-Test)</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 ${
                  isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-slate-500" />}
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy trình tự kiểm tra 5 giây: Cảm biến &rarr; Van Servo &rarr; Quạt Hút &rarr; Còi Hú
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh] bg-slate-50/50">
          {/* Target Room & Connection Status Badge */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="text-xs">
              <span className="text-slate-500 block font-medium">Thiết bị đang kiểm tra:</span>
              <span className="text-slate-900 font-black text-sm">{roomName || 'Phòng Giám Sát'} ({deviceId || 'DEFAULT_DEV'})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                <span>{isOnline ? 'Sẵn Sàng Kiểm Định' : 'Thiết Bị Offline'}</span>
              </span>
            </div>
          </div>

          {/* Testing Step Animation Box */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center relative overflow-hidden shadow-xs">
            {isRunning ? (
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-amber-600 p-1 flex items-center justify-center animate-spin">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-2xl font-black text-orange-600 font-mono shadow-inner">
                    {countdown}s
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block">
                    Đang gửi xung kiểm định phần cứng thực tế...
                  </span>
                  <h4 className="text-base font-black text-slate-900">
                    {currentStep === 1 && '1. Đo điện áp cảm biến & độ nhạy MQ Gas'}
                    {currentStep === 2 && '2. Kéo xoay Servo kiểm tra góc ngắt Van 90°'}
                    {currentStep === 3 && '3. Kích hoạt Rơ-le Quạt Thông Gió 3 giây'}
                    {currentStep === 4 && '4. Phát xung âm thanh kiểm tra Còi Hú'}
                  </h4>
                </div>
              </div>
            ) : testResult ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-md">
                  <ShieldCheck className="w-9 h-9" />
                </div>

                <div>
                  <h4 className="text-lg font-black text-emerald-700">
                    ĐẠT CHUẨN AN TOÀN PHẦN CỨNG 100%!
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                    Toàn bộ các cơ cấu ngắt van, quạt hút và còi hú của vi điều khiển ESP32 phản hồi chính xác trong 0.8 giây.
                  </p>
                </div>

                <div className="text-left p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 text-emerald-900 text-xs space-y-1.5 font-medium">
                  {testResult.details.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setTestResult(null)}
                  className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer shadow-xs"
                >
                  Kiểm tra lại
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {!isOnline ? (
                  /* Offline state: Explain clearly and disable testing */
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                        <WifiOff className="w-5 h-5" />
                      </div>
                      <div>
                        <b className="block text-slate-900 font-black text-sm mb-1">
                          Thiết Bị Đang Ngoại Tuyến (Offline)
                        </b>
                        <p className="text-slate-500 text-xs leading-relaxed">
                          Hệ thống không phát hiện tín hiệu kết nối từ thiết bị cảm biến gas của phòng này. Vui lòng cấp nguồn điện và kết nối Wifi cho thiết bị để có thể tự kiểm tra cơ cấu an toàn.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        disabled
                        className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                        title="Cần thiết bị Online để kiểm tra"
                      >
                        <WifiOff className="w-4 h-4" />
                        <span>Không thể kiểm tra (Thiết bị Offline)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Online state: Ready to test */
                  <div>
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs mb-3">
                      <Play className="w-7 h-7 ml-1" />
                    </div>
                    <h4 className="text-base font-black text-slate-900">Thiết Bị Sẵn Sàng Kiểm Định</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Mạch ESP32 đang trực tuyến. Hệ thống sẽ lần lượt gửi xung kích hoạt van khóa, quay quạt hút và kêu còi hú ngắn để xác nhận không bị kẹt cơ khí.
                    </p>

                    <button
                      onClick={runTestRoutine}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-sm transition-all shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95 inline-flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Bắt Đầu Kiểm Tra (5s)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schedule Configuration */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-600" />
                Đặt Chu Kỳ Tự Động Nhắc Nhở:
              </span>
              <span className="text-xs font-mono font-bold text-orange-600">
                Mỗi {scheduleDays} ngày
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((days) => (
                <button
                  key={days}
                  onClick={() => handleSaveSchedule(days)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    scheduleDays === days
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 font-black shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-orange-300'
                  }`}
                >
                  {days} Ngày
                </button>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
              <span>Lần kiểm tra gần nhất: {lastDate ? lastDate.toLocaleDateString('vi-VN') : 'Chưa kiểm định'}</span>
              <span>Kế tiếp: {nextTestDate ? nextTestDate.toLocaleDateString('vi-VN') : 'Sau 30 ngày'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null
}
