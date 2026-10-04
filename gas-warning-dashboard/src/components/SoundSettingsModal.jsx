import { useState } from 'react'
import { Volume2, VolumeX, Play, Square, Check, X, BellRing, Flame, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import alarmService from '../services/alarmService'

const SOUND_OPTIONS = [
  {
    id: 'hilo',
    name: 'Còi Hú Cứu Hỏa (Hi-Lo Siren)',
    desc: 'Âm thanh còi cấp cứu & cứu hỏa 2 tone dồn dập (Ò... É... Ò... É...)',
    icon: Flame,
    color: 'text-red-500 bg-red-50 border-red-200'
  },
  {
    id: 'whoop',
    name: 'Còi Báo Cháy Tòa Nhà (Whoop Siren)',
    desc: 'Âm thanh còi hú quét tần số dồn dập (WHEEE-OOOP... WHEEE-OOOP...)',
    icon: ShieldAlert,
    color: 'text-amber-500 bg-amber-50 border-amber-200'
  },
  {
    id: 'beep',
    name: 'Còi Bíp Báo Khí Gas (Fast Alarm Beep)',
    desc: 'Âm thanh chuông báo rò rỉ gas tần số cao (Bíp - Bíp - Bíp...)',
    icon: BellRing,
    color: 'text-sky-500 bg-sky-50 border-sky-200'
  }
]

function SoundSettingsModal({ onClose }) {
  const [selectedSound, setSelectedSound] = useState(alarmService.getSoundType())
  const [previewingId, setPreviewingId] = useState(null)

  const handlePreview = (soundId, e) => {
    e.stopPropagation()
    alarmService.initAudio()

    if (previewingId === soundId) {
      alarmService.stopPreview()
      setPreviewingId(null)
    } else {
      setPreviewingId(soundId)
      alarmService.previewSound(soundId, () => {
        setPreviewingId(null)
      })
    }
  }

  const handleSelectSound = (soundId) => {
    setSelectedSound(soundId)
    alarmService.setSoundType(soundId)
  }

  const handleSave = () => {
    alarmService.stopPreview()
    alarmService.setSoundType(selectedSound)
    toast.success('Đã lưu cấu hình âm thanh còi báo động!')
    onClose()
  }

  const handleClose = () => {
    alarmService.stopPreview()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 animate-fade-slide">
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Cài đặt Còi Báo Động</h3>
              <p className="text-[11px] text-slate-500 font-semibold">Chọn kiểu âm thanh phát khi nồng độ Gas vượt ngưỡng</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách các kiểu còi */}
        <div className="space-y-3 mb-6">
          {SOUND_OPTIONS.map((item) => {
            const Icon = item.icon
            const isSelected = selectedSound === item.id
            const isPlaying = previewingId === item.id

            return (
              <div
                key={item.id}
                onClick={() => handleSelectSound(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-red-500 bg-red-50/50 shadow-xs ring-2 ring-red-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-800 truncate">{item.name}</h4>
                      {isSelected && (
                        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Đang chọn
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>

                {/* Nút Nghe thử */}
                <button
                  type="button"
                  onClick={(e) => handlePreview(item.id, e)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 ${
                    isPlaying
                      ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-500/30'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isPlaying ? 'Dừng nghe thử' : 'Nghe thử âm thanh này'}
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Nghe thử</span>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Nút lưu */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Áp dụng âm thanh</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SoundSettingsModal
