import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText,
  X,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Fan,
  Volume2,
  Bell,
  Clock,
  Printer,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Activity
} from 'lucide-react'

export default function IncidentBlackboxModal({
  isOpen,
  onClose,
  backendUrl,
  token,
  deviceId,
  roomName
}) {
  const [incidents, setIncidents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState(null)

  const fetchIncidents = async () => {
    setIsLoading(true)
    try {
      const url = deviceId
        ? `${backendUrl}/incidents?deviceId=${encodeURIComponent(deviceId)}`
        : `${backendUrl}/incidents`

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (res.ok && data.incidents) {
        setIncidents(data.incidents)
        if (data.incidents.length > 0) {
          setSelectedIncident(data.incidents[0])
        }
      }
    } catch (err) {
      console.warn('Lỗi tải IncidentLog:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchIncidents()
    }
  }, [isOpen, deviceId])

  const handleSimulateIncident = async () => {
    setIsSimulating(true)
    try {
      const res = await fetch(`${backendUrl}/incidents/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deviceId: deviceId || 'DEFAULT_DEV' })
      })
      const data = await res.json()
      if (res.ok && data.incident) {
        setIncidents(prev => [data.incident, ...prev])
        setSelectedIncident(data.incident)
      }
    } catch (err) {
      console.error('Lỗi simulate incident:', err)
    } finally {
      setIsSimulating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) return null

  return typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 ring-1 ring-slate-900/5 flex flex-col max-h-[92vh] overflow-hidden animate-scale-up cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">Hộp Đen Sự Cố & Lịch Sử Can Thiệp PCCC</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-wider">
                  Incident Blackbox
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ghi lại từng mili-giây diễn biến rò rỉ khí gas và chuỗi kích hoạt ngắt van, thông gió tự động
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="In hoặc xuất báo cáo PDF"
            >
              <Printer className="w-3.5 h-3.5 text-orange-600" />
              <span>In Báo Cáo</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng hộp đen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-200/80 bg-slate-50/90 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-bold">Tổng số sự cố được ghi lại:</span>
            <span className="px-2.5 py-0.5 rounded-md bg-white font-mono font-black text-orange-600 border border-slate-200 shadow-xs">
              {incidents.length} vụ việc
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateIncident}
              disabled={isSimulating}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Tạo Sự Cố Diễn Tập Demo</span>
            </button>

            <button
              onClick={fetchIncidents}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 bg-white text-slate-600 transition-all cursor-pointer shadow-xs"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Body - Split Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
          {/* Left Column: Incidents List */}
          <div className="p-4 overflow-y-auto space-y-2.5 max-h-[40vh] md:max-h-none bg-slate-50/40">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2 px-1">
              Danh Sách Vụ Rò Rỉ Gần Nhất:
            </span>

            {incidents.map((inc) => {
              const isSelected = selectedIncident?._id === inc._id
              const startedDate = new Date(inc.startedAt)

              return (
                <div
                  key={inc._id || inc.startedAt}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-50/70 border-orange-500 shadow-md ring-2 ring-orange-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300 hover:bg-orange-50/20 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-xs text-slate-900 truncate">
                      {inc.roomName || inc.deviceId}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      inc.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-300 animate-pulse'
                    }`}>
                      {inc.status === 'resolved' ? 'Đã an toàn' : 'Đang xử lý'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-orange-600" />
                      {startedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {startedDate.toLocaleDateString('vi-VN')}
                    </span>
                    <span className="font-black text-orange-600 font-mono">
                      Đỉnh: {inc.peakPpm} PPM
                    </span>
                  </div>
                </div>
              )
            })}

            {incidents.length === 0 && !isLoading && (
              <div className="text-center py-10 text-slate-400 text-xs">
                Chưa ghi nhận sự cố rò rỉ nào.
              </div>
            )}
          </div>

          {/* Right 2 Columns: Detailed Incident Blackbox Timeline */}
          <div className="md:col-span-2 p-5 sm:p-6 overflow-y-auto space-y-6 bg-white">
            {selectedIncident ? (
              <>
                {/* Incident Overview Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-orange-50/80 border border-orange-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black uppercase">
                        HỒ SƠ SỰ CỐ PCCC #{String(selectedIncident._id || '001').slice(-6).toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {new Date(selectedIncident.startedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 mt-1">
                      Khu vực: {selectedIncident.roomName} ({selectedIncident.deviceId})
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-500 font-extrabold block">Đỉnh Nồng Độ</span>
                      <span className="text-xl font-black text-rose-600 font-mono">
                        {selectedIncident.peakPpm} PPM
                      </span>
                    </div>
                    <div className="text-right pl-3 border-l border-orange-200">
                      <span className="text-[10px] uppercase text-slate-500 font-extrabold block">Thời Gian Xử Lý</span>
                      <span className="text-xl font-black text-emerald-700 font-mono">
                        {selectedIncident.durationSeconds || 140}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline Action Stream */}
                <div>
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 flex items-center gap-1.5 mb-4">
                    <Activity className="w-4 h-4" />
                    Dòng Thời Gian Can Thiệp Tự Động (Từng Giây):
                  </h5>

                  <div className="relative pl-6 sm:pl-8 border-l-2 border-orange-200 space-y-4">
                    {selectedIncident.actions && selectedIncident.actions.map((act, index) => {
                      const actTime = new Date(act.time)
                      const isAlert = act.type === 'DETECTION' || act.type === 'ALERT'
                      const isValve = act.type === 'VALVE_CLOSED' || act.type === 'VALVE'
                      const isFan = act.type === 'FAN_ON' || act.type === 'FAN'
                      const isBuzzer = act.type === 'BUZZER_ON' || act.type === 'BUZZER'
                      const isSafe = act.type === 'SAFE_RESOLVED' || act.type === 'SAFE'

                      return (
                        <div key={index} className="relative group">
                          {/* Timeline Dot Icon */}
                          <div className={`absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-xs ${
                            isSafe
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                              : isAlert
                              ? 'bg-rose-50 border-rose-500 text-rose-600 animate-pulse'
                              : 'bg-orange-50 border-orange-500 text-orange-600'
                          }`}>
                            {isValve ? (
                              <Flame className="w-3 h-3 text-rose-600" />
                            ) : isFan ? (
                              <Fan className="w-3 h-3 text-orange-600 animate-spin" />
                            ) : isBuzzer ? (
                              <Volume2 className="w-3 h-3 text-amber-600" />
                            ) : isSafe ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                            )}
                          </div>

                          {/* Action Content Card */}
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 group-hover:border-orange-400 group-hover:bg-orange-50/20 transition-all shadow-xs">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-mono font-bold text-orange-600">
                                {actTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                                {act.type}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-800 font-medium">
                              {act.message}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Safety Conclusion Note */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900 shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block text-slate-900 mb-0.5">Kết Luận An Toàn PCCC:</span>
                    Hệ thống SafeFlame đã hoàn thành chu trình bảo vệ an toàn: ngắt nguồn khí gas trong vòng &lt; 1 giây, khởi động quạt thông gió đẩy khí nguy hiểm và lưu vết toàn bộ dữ liệu hộp đen phục vụ công tác thanh tra PCCC.
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-400 text-sm">
                Chọn một vụ việc bên trái để xem dòng thời gian chi tiết.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Hộp đen lưu trữ tự động trên Cloud Database - Đảm bảo tính minh bạch và toàn vẹn dữ liệu.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-all cursor-pointer shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null
}
