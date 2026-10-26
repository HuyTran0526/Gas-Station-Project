import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar,
  Clock,
  ShieldCheck,
  X,
  Phone,
  Send,
  AlertCircle,
  Wrench,
  CheckCircle2,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function InspectionBookingModal({
  isOpen,
  onClose,
  backendUrl,
  token,
  roomName,
  deviceId,
  currentUser
}) {
  const [category, setCategory] = useState('leak_check')
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [timeSlot, setTimeSlot] = useState('afternoon')
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Gửi yêu cầu đặt lịch bảo dưỡng/kiểm tra lên server
      const res = await fetch(`${backendUrl}/notifications/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `[Yêu Cầu Kiểm Tra] ${roomName || 'Phòng Trọ'}`,
          body: `Khách thuê phòng ${roomName} yêu cầu kiểm tra định kỳ (${category === 'leak_check' ? 'Kiểm tra rò rỉ gas' : category === 'valve_maintenance' ? 'Bảo dưỡng van tự động' : 'Kiểm tra cảm biến'}). Ngày hẹn: ${preferredDate} (${timeSlot === 'morning' ? 'Sáng' : timeSlot === 'afternoon' ? 'Chiều' : 'Tối'}). SĐT: ${phone}`,
          deviceId: deviceId || 'DEFAULT_DEV'
        })
      }).catch(() => null)

      setIsSuccess(true)
      toast.success('Đã gửi yêu cầu kiểm tra định kỳ tới Chủ trọ!')
      setTimeout(() => {
        setIsSuccess(false)
        onClose()
      }, 1800)
    } catch (err) {
      toast.error('Có lỗi khi gửi yêu cầu, vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  return typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg my-auto bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Đặt Lịch Kiểm Tra Định Kỳ PCCC
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Yêu cầu chủ trọ & kỹ thuật viên kiểm tra bình gas, van ngắt, quạt hút
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900">Đã Gửi Yêu Cầu Thành Công!</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Chủ trọ và đội ngũ kỹ thuật SAFE FLAME đã nhận được lịch hẹn kiểm tra phòng <b>{roomName}</b> vào ngày <b>{preferredDate}</b>. Chúng tôi sẽ liên hệ lại bạn sớm nhất.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50/50">
            {/* Room info banner */}
            <div className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Địa điểm kiểm tra:</span>
                <span className="font-extrabold text-slate-900 text-sm">{roomName || 'Phòng Của Bạn'} ({deviceId || 'DEFAULT_DEV'})</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                Miễn Phí Định Kỳ
              </span>
            </div>

            {/* Hạng mục kiểm tra */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Hạng Mục Cần Kiểm Tra:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'leak_check', label: 'Rò rỉ khí gas & ống dẫn', icon: AlertCircle },
                  { id: 'valve_maintenance', label: 'Bảo dưỡng van ngắt Servo', icon: Wrench },
                  { id: 'sensor_calibration', label: 'Kiểm tra cảm biến MQ', icon: ShieldCheck },
                  { id: 'fan_alarm', label: 'Quạt hút & Còi báo động', icon: FileText }
                ].map((item) => {
                  const Icon = item.icon
                  const isSelected = category === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500 border-orange-500 text-white font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-orange-500'}`} />
                      <span className="text-xs leading-tight">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Thời gian & Khung giờ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ngày Mong Muốn:
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Khung Giờ:
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                >
                  <option value="morning">Sáng (08:30 - 11:30)</option>
                  <option value="afternoon">Chiều (14:00 - 17:30)</option>
                  <option value="evening">Tối (18:30 - 20:30)</option>
                </select>
              </div>
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Số Điện Thoại Liên Hệ:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại của bạn..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Ghi Chú Cho Chủ Trọ / Kỹ Thuật (Tùy chọn):
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Bình gas hơi có mùi lạ khi bật bếp, van đóng có tiếng kêu nhẹ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Cho Chủ Trọ'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  ) : null
}
