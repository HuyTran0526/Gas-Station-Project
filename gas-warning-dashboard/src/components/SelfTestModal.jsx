import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Flame,
  Fan,
  Volume2,
  Cpu,
  Wifi,
  WifiOff,
  BellRing,
  Check,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

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
  onTestComplete,
  onScheduleChange
}) {
  const [scheduleDays, setScheduleDays] = useState(testScheduleDays || 30)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkedItems, setCheckedItems] = useState({
    sensor: true,
    valve: true,
    fanBuzzer: true,
    pipes: true
  })

  useEffect(() => {
    if (testScheduleDays) {
      setScheduleDays(testScheduleDays)
    }
  }, [testScheduleDays])

  if (!isOpen) return null

  // Tính toán thời gian & số ngày còn lại
  const lastDate = lastTestedAt ? new Date(lastTestedAt) : null
  const nextTestDate = lastDate ? new Date(lastDate.getTime() + scheduleDays * 24 * 60 * 60 * 1000) : null
  const today = new Date()

  let daysRemaining = null
  let isOverdue = false
  let isDueToday = false

  if (nextTestDate) {
    const diffTime = nextTestDate.getTime() - today.getTime()
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (daysRemaining < 0) {
      isOverdue = true
    } else if (daysRemaining === 0) {
      isDueToday = true
    }
  }

  // Lưu chu kỳ nhắc nhở (15, 30, 60, 90 ngày)
  const handleSaveSchedule = async (days) => {
    setScheduleDays(days)
    setIsSavingSchedule(true)
    try {
      const res = await fetch(`${backendUrl}/device/test-schedule`, {
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
      if (res.ok) {
        toast.success(`Đã cập nhật chu kỳ nhắc nhở: Mỗi ${days} ngày!`)
        if (onScheduleChange) onScheduleChange(days)
      }
    } catch (err) {
      console.warn('Lỗi cập nhật chu kỳ nhắc nhở:', err)
      toast.error('Không thể lưu chu kỳ nhắc nhở. Vui lòng kiểm tra lại kết nối.')
    } finally {
      setIsSavingSchedule(false)
    }
  }

  // Xác nhận đã hoàn thành kiểm tra an toàn thực tế
  const handleConfirmInspection = async () => {
    setIsSubmitting(true)
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
      if (res.ok) {
        toast.success('🎉 Đã ghi nhận đợt kiểm tra an toàn thành công! Chu kỳ nhắc nhở đã được đặt lại.')
        if (onTestComplete) {
          onTestComplete(data.lastTestedAt || new Date())
        }
      } else {
        toast.error(data.message || 'Lỗi khi ghi nhận kiểm tra.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Lỗi kết nối máy chủ. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Giả lập trạng thái để test/demo tức thì (Quá hạn, Đến hạn hôm nay, An toàn)
  const [isSimulating, setIsSimulating] = useState(false)
  const handleSimulate = async (type) => {
    setIsSimulating(true)
    try {
      const res = await fetch(`${backendUrl}/device/simulate-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceId: deviceId || 'DEFAULT_DEV',
          type
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Đã áp dụng trạng thái mô phỏng!')
        if (onTestComplete) {
          onTestComplete(data.lastTestedAt)
        }
      } else {
        toast.error(data.message || 'Lỗi mô phỏng trạng thái')
      }
    } catch (err) {
      console.error(err)
      toast.error('Lỗi kết nối máy chủ')
    } finally {
      setIsSimulating(false)
    }
  }

  const toggleCheck = (key) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

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
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Lịch Nhắc Nhở Kiểm Tra Định Kỳ
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 ${
                  isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-150 text-slate-600'
                }`}>
                  {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-slate-500" />}
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhắc nhở kiểm tra bình gas, thử van khóa, quạt hút & còi hú theo định kỳ an toàn PCCC
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

          {/* Thiết bị đang theo dõi */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="text-xs">
              <span className="text-slate-500 block font-medium">Khu vực / Thiết bị:</span>
              <span className="text-slate-900 font-black text-sm">{roomName || 'Phòng Giám Sát'} ({deviceId || 'DEFAULT_DEV'})</span>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-500 block font-medium">Chu kỳ nhắc nhở:</span>
              <span className="text-orange-600 font-black font-mono">Mỗi {scheduleDays} ngày</span>
            </div>
          </div>

          {/* Trạng thái nhắc nhở & Đếm ngược */}
          <div className={`p-4 rounded-3xl border shadow-xs transition-all ${
            !lastDate
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : isOverdue
              ? 'bg-rose-50/90 border-rose-200 text-rose-950'
              : isDueToday
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 ${
                !lastDate
                  ? 'bg-amber-100 text-amber-700'
                  : isOverdue
                  ? 'bg-rose-100 text-rose-700'
                  : isDueToday
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {!lastDate ? (
                  <Clock className="w-5 h-5" />
                ) : isOverdue ? (
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                ) : isDueToday ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm sm:text-base">
                    {!lastDate
                      ? 'Chưa Có Lịch Kiểm Tra'
                      : isDueToday
                      ? '🟡 ĐẾN HẠN KIỂM TRA HÔM NAY!'
                      : isOverdue
                      ? `⚠️ ĐÃ QUÁ HẠN KIỂM TRA ${Math.abs(daysRemaining)} NGÀY!`
                      : `🟢 ĐANG TRONG CHU KỲ AN TOÀN (CÒN ${daysRemaining} NGÀY)`}
                  </h4>
                  {nextTestDate && (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/70 border border-slate-200/50">
                      Hạn: {nextTestDate.toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed opacity-90">
                  {!lastDate
                    ? 'Phòng này chưa từng được ghi nhận đợt kiểm tra an toàn nào. Hãy thực hiện kiểm tra thực tế và bấm nút xác nhận bên dưới để kích hoạt chu kỳ theo dõi.'
                    : isDueToday
                    ? `Hôm nay là ngày đến hạn kiểm tra an toàn định kỳ theo chu kỳ ${scheduleDays} ngày. Vui lòng kiểm tra bình gas và thử van khóa theo checklist bên dưới.`
                    : isOverdue
                    ? `Đã quá ${Math.abs(daysRemaining)} ngày kể từ lần kiểm tra gần nhất (${lastDate.toLocaleDateString('vi-VN')}). Vui lòng tiến hành kiểm tra van gas và các cơ cấu ngay lập tức để đảm bảo phòng chống cháy nổ.`
                    : `Lần kiểm tra gần nhất vào ngày ${lastDate.toLocaleDateString('vi-VN')}. Hệ thống sẽ tiếp tục theo dõi và nhắc nhở khi đến ngày ${nextTestDate.toLocaleDateString('vi-VN')}.`}
                </p>
              </div>
            </div>
          </div>

          {/* Checklist 4 bước kiểm tra an toàn thực tế */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                Quy Trình Kiểm Tra An Toàn Định Kỳ (Checklist)
              </span>
              <span className="text-[11px] text-slate-400">Tích chọn khi thực hiện</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Bước 1 */}
              <label
                onClick={() => toggleCheck('sensor')}
                className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  checkedItems.sensor ? 'bg-orange-50/50 border-orange-200 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                  checkedItems.sensor ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {checkedItems.sensor && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <b className="font-bold text-slate-900 block">1. Kiểm tra cảm biến Gas MQ:</b>
                  <span className="text-[11px] text-slate-500">Vệ sinh bề mặt cảm biến, đảm bảo khe thông gió không bị dầu mỡ bám dính hay che khuất.</span>
                </div>
              </label>

              {/* Bước 2 */}
              <label
                onClick={() => toggleCheck('valve')}
                className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  checkedItems.valve ? 'bg-orange-50/50 border-orange-200 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                  checkedItems.valve ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {checkedItems.valve && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <b className="font-bold text-slate-900 block">2. Thử nghiệm van khóa Servo:</b>
                  <span className="text-[11px] text-slate-500">Bấm thử nút Đóng/Mở van trên Dashboard để kiểm tra cơ cấu xoay gạt 90° có trơn tru, không bị kẹt.</span>
                </div>
              </label>

              {/* Bước 3 */}
              <label
                onClick={() => toggleCheck('fanBuzzer')}
                className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  checkedItems.fanBuzzer ? 'bg-orange-50/50 border-orange-200 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                  checkedItems.fanBuzzer ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {checkedItems.fanBuzzer && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <b className="font-bold text-slate-900 block">3. Kiểm tra Quạt hút & Còi báo động:</b>
                  <span className="text-[11px] text-slate-500">Bật thử quạt hút gió để đẩy khí và thử còi hú báo động xác nhận loa kêu to rõ ràng.</span>
                </div>
              </label>

              {/* Bước 4 */}
              <label
                onClick={() => toggleCheck('pipes')}
                className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  checkedItems.pipes ? 'bg-orange-50/50 border-orange-200 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                  checkedItems.pipes ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {checkedItems.pipes && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <b className="font-bold text-slate-900 block">4. Thử bọt xà phòng mối nối bình gas:</b>
                  <span className="text-[11px] text-slate-500">Dùng bọt xà phòng quét quanh cổ bình gas và ống cao su để đảm bảo không bị rò rỉ cơ học.</span>
                </div>
              </label>
            </div>

            {/* Nút bấm xác nhận hoàn thành kiểm tra */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmInspection}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang ghi nhận...' : 'Xác Nhận Đã Hoàn Thành Kiểm Tra An Toàn'}</span>
              </button>
            </div>
          </div>

          {/* Cấu hình chu kỳ nhắc nhở */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-orange-600" />
                Cài Đặt Chu Kỳ Tự Động Nhắc Nhở:
              </span>
              <span className="text-xs font-mono font-bold text-orange-600">
                Mỗi {scheduleDays} ngày
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 60, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleSaveSchedule(days)}
                  disabled={isSavingSchedule}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                    scheduleDays === days
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 font-black shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-orange-300'
                  }`}
                >
                  {days} Ngày
                  {days === 30 && <span className="block text-[9px] font-normal opacity-90">Chuẩn</span>}
                </button>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
              <span>Lần kiểm tra trước: {lastDate ? lastDate.toLocaleDateString('vi-VN') : 'Chưa có'}</span>
              <span>Đợt tiếp theo: {nextTestDate ? nextTestDate.toLocaleDateString('vi-VN') : 'Sau ' + scheduleDays + ' ngày'}</span>
            </div>
          </div>

          {/* Khu Vực Thử Nghiệm Tức Thì (Dành cho Demo & Báo Cáo Không Cần Chờ) */}
          <div className="p-4 rounded-3xl bg-slate-100/90 border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-600" />
                Thử Nghiệm Cảnh Báo Ngay (Không Cần Chờ):
              </span>
              <span className="text-[10px] text-orange-600 font-extrabold uppercase bg-orange-150/60 px-2 py-0.5 rounded-md">
                Chế độ Test Demo
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSimulate('overdue')}
                disabled={isSimulating}
                className="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                title="Giả lập trạng thái quá hạn kiểm tra 5 ngày để xem cảnh báo đỏ"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Thử Quá Hạn</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulate('due_today')}
                disabled={isSimulating}
                className="py-2.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                title="Giả lập trạng thái đến hạn hôm nay để xem cảnh báo vàng"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Thử Đến Hạn</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulate('safe')}
                disabled={isSimulating}
                className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                title="Reset về trạng thái vừa kiểm tra xong (an toàn)"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Thử An Toàn</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              💡 Bấm nút để chuyển đổi tức thì giữa các trạng thái cảnh báo và xem giao diện phản ứng mà không cần phải chờ hết chu kỳ ngày.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Safe Flame • Tính Năng Bảo Dưỡng An Toàn Gas Định Kỳ
          </span>
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
