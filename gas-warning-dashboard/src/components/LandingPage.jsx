import { useState } from 'react'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Fan,
  Activity,
  Radio,
  Cpu,
  Volume2,
  VolumeX,
  Building2,
  Home,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  Users,
  Smartphone,
  PhoneCall,
  Check,
  HelpCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import logoImg from '../assets/logo.jpg'

export default function LandingPage({ onGoToLogin, onGoToRegister, onGoToDemo }) {
  // Trạng thái mô phỏng tương tác trên Hero Card (Interactive Hero Demo)
  const [demoState, setDemoState] = useState('safe') // 'safe' | 'warning' | 'danger'
  const [openFaq, setOpenFaq] = useState(null)

  const demoConfigs = {
    safe: {
      ppm: 350,
      label: 'Bình thường - An toàn',
      statusClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      badgeClass: 'bg-emerald-500 text-white',
      dotColor: 'bg-emerald-500',
      barColor: 'from-emerald-500 to-teal-400',
      valveOpen: true,
      fanOn: false,
      buzzerActive: false,
      desc: 'Môi trường phòng bếp trong lành, không phát hiện rò rỉ khí gas.'
    },
    warning: {
      ppm: 480,
      label: 'Cảnh giác - Có dấu hiệu rò rỉ',
      statusClass: 'bg-amber-50 border-amber-200 text-amber-800',
      badgeClass: 'bg-amber-500 text-white',
      dotColor: 'bg-amber-500',
      barColor: 'from-amber-400 to-orange-500',
      valveOpen: true,
      fanOn: true,
      buzzerActive: false,
      desc: 'Phát hiện nồng độ gas tăng nhẹ. Hệ thống tự bật quạt thông gió để làm thoáng phòng.'
    },
    danger: {
      ppm: 880,
      label: '🚨 BÁO ĐỘNG ĐỎ - RÒ RỈ KHẨN CẤP!',
      statusClass: 'bg-red-50 border-red-300 text-red-700 animate-pulse',
      badgeClass: 'bg-red-600 text-white animate-bounce',
      dotColor: 'bg-red-600',
      barColor: 'from-orange-500 via-red-500 to-rose-600',
      valveOpen: false,
      fanOn: true,
      buzzerActive: true,
      desc: 'NGUY HIỂM! Van gas đã tự động khóa chặt, quạt hút chạy 100% công suất, còi hú vang dội và đã gửi thông báo đến điện thoại!'
    }
  }

  const currentCfg = demoConfigs[demoState]

  const faqs = [
    {
      q: 'Hệ thống có tiếp tục hoạt động khi phòng bị mất kết nối WiFi không?',
      a: 'CÓ! Cảm biến ESP32 được lập trình xử lý tự động độc lập tại chỗ. Khi nồng độ gas vượt ngưỡng 500 PPM, thiết bị sẽ tự động ngắt van cơ học và hú còi báo động ngay lập tức tại phòng kể cả khi không có mạng WiFi. Khi WiFi phục hồi, hệ thống sẽ đồng bộ dữ liệu lên máy chủ.'
    },
    {
      q: 'Nấu ăn thông thường bằng bếp gas có bị báo động nhầm không?',
      a: 'Không. SAFE FLAME được hiệu chuẩn thông minh với ngưỡng phân tầng: Nấu nướng thông thường tạo ra dao động nhẹ (350 - 420 PPM) được xếp vào vùng an toàn. Chỉ khi có sự cố rò rỉ gas thực tế (vượt 500 PPM), các cơ chế bảo vệ khẩn cấp mới được kích hoạt.'
    },
    {
      q: 'Chủ trọ có thể can thiệp khóa van hay tắt còi từ xa khi khách thuê vắng nhà không?',
      a: 'CÓ! Tài khoản Chủ Trọ (Landlord) được trang bị quyền Master Override khẩn cấp. Nếu có báo động mà khách thuê đang đi học/đi làm hoặc điện thoại hết pin, Chủ Trọ có thể trực tiếp theo dõi và can thiệp điều khiển thiết bị từ bất kỳ đâu.'
    },
    {
      q: 'Việc lắp đặt thiết bị có phức tạp và cần đục tường không?',
      a: 'Hoàn toàn không. Bộ thiết bị SafeFlame thiết kế dạng Plug & Play nhỏ gọn: Cắm nguồn điện 5V/12V, gắn cảm biến gần khu vực bình gas hoặc khu bếp và kết nối WiFi trong 3 phút là sẵn sàng hoạt động.'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-600/15 via-sky-500/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-rose-600/15 via-amber-500/10 to-transparent blur-[140px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR                                                             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-700 shadow-md shadow-sky-500/20 flex items-center justify-center shrink-0">
              <img src={logoImg} alt="SAFE FLAME Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-wider text-white">SAFE FLAME</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </div>
              <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest leading-none">
                IoT Gas Safety System
              </p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-sky-400 transition-colors">Tính Năng Cốt Lõi</a>
            <a href="#how-it-works" className="hover:text-sky-400 transition-colors">4 Tầng Bảo Vệ</a>
            <a href="#solutions" className="hover:text-sky-400 transition-colors">Giải Pháp Phòng Trọ</a>
            <a href="#faq" className="hover:text-sky-400 transition-colors">Hỏi Đáp (FAQ)</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Social Links (Desktop Header) */}
            <div className="hidden sm:flex items-center gap-1.5 mr-1 border-r border-slate-800 pr-3">
              <a
                href="https://www.facebook.com/people/Safe-Flame/100092285542043/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-slate-700/60 bg-slate-800/60 hover:bg-blue-600 hover:border-blue-500 text-slate-300 hover:text-white transition-all shadow-xs"
                title="Safe Flame | Can Tho | Facebook"
                aria-label="Facebook Fanpage Safe Flame"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@safeflame05"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-slate-700/60 bg-slate-800/60 hover:bg-rose-600 hover:border-rose-500 text-slate-300 hover:text-white transition-all shadow-xs"
                title="Safe Flame (@safeflame05) | TikTok"
                aria-label="TikTok Safe Flame"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.27 6.27 0 0 0 1.93-4.52V8.92a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.93-.35z" />
                </svg>
              </a>
            </div>

            <button
              onClick={onGoToDemo}
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Xem thử giao diện giám sát nồng độ gas"
            >
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Xem Demo</span>
            </button>
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-sky-500/25 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Đăng Nhập</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION WITH INTERACTIVE GAS SIMULATOR                            */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline & Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300 text-xs font-bold shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Giải Pháp IoT An Toàn Cháy Nổ & Rò Rỉ Khí Gas #1 Cho Phòng Trọ</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                Bảo Vệ Tính Mạng & Phòng Trọ <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-amber-300 bg-clip-text text-transparent">
                  Khỏi Thảm Họa Rò Rỉ Gas 24/7
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Tự động <b className="text-white">đóng chặt van khóa gas</b> trong 1.5 giây, <b className="text-white">kích hoạt quạt hút thông gió</b> cưỡng bức, hú còi 100dB và gửi thông báo khẩn cấp tức thời về điện thoại của Người Thuê & Chủ Trọ.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={onGoToDemo}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-base transition-all shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                >
                  <Activity className="w-5 h-5" />
                  <span>Trải Nghiệm Live Dashboard Demo</span>
                </button>
                <button
                  onClick={onGoToRegister}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-600 text-slate-200 font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-5 h-5 text-sky-400" />
                  <span>Đăng Ký Tài Khoản Trọ</span>
                </button>
              </div>

              {/* Official Social Channels / Fanpage & TikTok */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <span className="text-xs font-semibold text-slate-400">
                  Kênh chính thức Safe Flame:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <a
                    href="https://www.facebook.com/people/Safe-Flame/100092285542043/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-600 hover:border-blue-500 text-blue-300 hover:text-white text-xs font-bold transition-all shadow-sm hover:shadow-blue-500/25 active:scale-95 group"
                    title="Safe Flame | Can Tho | Facebook"
                  >
                    <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Fanpage Facebook</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </a>

                  <a
                    href="https://www.tiktok.com/@safeflame05"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-gradient-to-r hover:from-rose-600 hover:to-pink-600 hover:border-rose-500 text-rose-300 hover:text-white text-xs font-bold transition-all shadow-sm hover:shadow-rose-500/25 active:scale-95 group"
                    title="Safe Flame (@safeflame05) | TikTok"
                  >
                    <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.27 6.27 0 0 0 1.93-4.52V8.92a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.93-.35z" />
                    </svg>
                    <span>TikTok @safeflame05</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </a>
                </div>
              </div>

              {/* Quick Trust Badges */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 text-left">
                <div>
                  <span className="block text-2xl font-black text-sky-400">1.5s</span>
                  <span className="text-xs text-slate-400 font-semibold">Tự động ngắt van cơ</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-amber-400">100dB</span>
                  <span className="text-xs text-slate-400 font-semibold">Còi hú cứu hỏa tại chỗ</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-emerald-400">Realtime</span>
                  <span className="text-xs text-slate-400 font-semibold">Báo động đẩy di động</span>
                </div>
              </div>
            </div>

            {/* Right Column: INTERACTIVE HERO DEMO WIDGET */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl relative space-y-6">
                
                {/* Header widget */}
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Mô Phỏng Trực Tiếp Cảm Biến</h4>
                      <p className="text-[11px] text-slate-400">Thiết bị ESP32 - Phòng 101</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online 24/7
                  </span>
                </div>

                {/* Switcher Buttons to test live */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-2">
                    Bấm để thử các kịch bản khí gas:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDemoState('safe')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        demoState === 'safe'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600 text-slate-300'
                      }`}
                    >
                      🟢 An Toàn
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoState('warning')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        demoState === 'warning'
                          ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600 text-slate-300'
                      }`}
                    >
                      🟡 Cảnh Giác
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoState('danger')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        demoState === 'danger'
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30 animate-pulse'
                          : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600 text-slate-300'
                      }`}
                    >
                      🚨 Rò Rỉ Gas!
                    </button>
                  </div>
                </div>

                {/* PPM Gauge Live Meter */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nồng độ khí Gas</span>
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${currentCfg.badgeClass}`}>
                      {currentCfg.label}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {currentCfg.ppm}
                    </span>
                    <span className="text-sm font-bold text-slate-400">PPM (Parts Per Million)</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700/80 p-0.5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${currentCfg.barColor} transition-all duration-500`}
                      style={{ width: `${Math.min(100, (currentCfg.ppm / 1000) * 100)}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {currentCfg.desc}
                  </p>
                </div>

                {/* 3 Hardware Devices Status */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Van gas */}
                  <div className={`p-3 rounded-xl border transition-all text-center ${
                    currentCfg.valveOpen ? 'bg-slate-900/60 border-slate-700/60' : 'bg-red-950/40 border-red-500/60 text-red-200'
                  }`}>
                    <div className="flex justify-center mb-1.5">
                      {currentCfg.valveOpen ? (
                        <Unlock className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Van Khóa Gas</span>
                    <span className={`text-xs font-black ${currentCfg.valveOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                      {currentCfg.valveOpen ? 'ĐANG MỞ' : '🔒 ĐÃ KHÓA'}
                    </span>
                  </div>

                  {/* Quạt hút */}
                  <div className={`p-3 rounded-xl border transition-all text-center ${
                    currentCfg.fanOn ? 'bg-sky-950/40 border-sky-500/60 text-sky-200' : 'bg-slate-900/60 border-slate-700/60'
                  }`}>
                    <div className="flex justify-center mb-1.5">
                      <Fan className={`w-5 h-5 text-sky-400 ${currentCfg.fanOn ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Quạt Hút Gió</span>
                    <span className={`text-xs font-black ${currentCfg.fanOn ? 'text-sky-400' : 'text-slate-500'}`}>
                      {currentCfg.fanOn ? '🌀 BẬT 100%' : 'TẮT'}
                    </span>
                  </div>

                  {/* Còi báo */}
                  <div className={`p-3 rounded-xl border transition-all text-center ${
                    currentCfg.buzzerActive ? 'bg-red-950/40 border-red-500/60 text-red-200 animate-pulse' : 'bg-slate-900/60 border-slate-700/60'
                  }`}>
                    <div className="flex justify-center mb-1.5">
                      {currentCfg.buzzerActive ? (
                        <Volume2 className="w-5 h-5 text-red-400 animate-bounce" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Còi Báo Động</span>
                    <span className={`text-xs font-black ${currentCfg.buzzerActive ? 'text-red-400' : 'text-slate-500'}`}>
                      {currentCfg.buzzerActive ? '🔊 100dB HÚ!' : 'IM LẶNG'}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={onGoToDemo}
                    className="w-full py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Mở màn hình Bảng điều khiển đầy đủ</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION: NỖI SỢ THỰC TẾ & VẤN ĐỀ NGUY HIỂM TẠI NHÀ TRỌ                 */}
      {/* ========================================================================= */}
      <section className="py-16 bg-slate-950/60 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-400">
              Cảnh Giác Nguy Hiểm Vô Hình
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Tại Sao Rò Rỉ Khí Gas Là Kẻ Thù Thầm Lặng Nguy Hiểm Nhất?
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Khí gas gia dụng (LPG) nặng hơn không khí và có xu hướng chìm xuống sàn nhà. Trong không gian phòng trọ khép kín, một sơ suất nhỏ có thể gây hậu quả khôn lường.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Tia Lửa Nhỏ - Phát Nổ Lớn</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Khi khí gas tích tụ trong phòng kín, chỉ một hành động bật công tắc đèn, cắm sạc điện thoại hay tia lửa nhỏ từ tủ lạnh cũng có thể kích nổ toàn bộ căn phòng.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Ngạt Khí Trong Lúc Ngủ Say</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Rò rỉ khí gas vào ban đêm đẩy oxy ra khỏi phòng, làm người thuê bị mê man sâu và ngạt khí trước khi kịp nhận biết để mở cửa thoát hiểm.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-sky-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Trách Nhiệm Nặng Nề Của Chủ Trọ</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Một phòng gặp sự cố có thể cháy lan toàn bộ dãy trọ. Chủ trọ đối mặt với thiệt hại hàng tỷ đồng và trách nhiệm pháp lý nghiêm trọng về phòng cháy chữa cháy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION: CƠ CHẾ 4 TẦNG BẢO VỆ CỦA SAFE FLAME                          */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-400">
              Công Nghệ Can Thiệp Tự Động
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Cơ Chế 4 Tầng Bảo Vệ Toàn Diện Của SAFE FLAME
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Không chỉ dừng lại ở việc phát hiện, SAFE FLAME trực tiếp can thiệp phần cứng để dập tắt mối nguy hiểm trước khi con người kịp phản ứng.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tầng 1 */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 relative space-y-4 hover:border-sky-500/50 transition-all">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-sky-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                Tầng 1 - Cảm Biến
              </span>
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mt-2">
                <Radio className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Quét Liên Tục Mỗi 2s</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cảm biến MQ2 đo nồng độ liên tục mỗi 2 giây, phát hiện các phân tử khí LPG và Methane ngay từ những ppm rò rỉ đầu tiên.
              </p>
            </div>

            {/* Tầng 2 */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 relative space-y-4 hover:border-emerald-500/50 transition-all">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                Tầng 2 - Ngắt Nguồn
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mt-2">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Khóa Van Cơ Học Trong 1.5s</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Động cơ cơ học lập tức vặn ngắt van gas tại đầu bình, cô lập triệt để nguồn cấp, không để rò rỉ thêm một phân tử gas nào.
              </p>
            </div>

            {/* Tầng 3 */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 relative space-y-4 hover:border-amber-500/50 transition-all">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                Tầng 3 - Thoát Khí
              </span>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mt-2">
                <Fan className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Quạt Hút Cưỡng Bức 100%</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Khởi động quạt hút thông gió công suất cao đẩy toàn bộ lượng khí gas tích tụ ra ngoài cửa thông gió, giải tỏa áp suất nổ.
              </p>
            </div>

            {/* Tầng 4 */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 relative space-y-4 hover:border-red-500/50 transition-all">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-red-500 text-white font-black text-[10px] uppercase tracking-wider">
                Tầng 4 - Cảnh Báo Kép
              </span>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mt-2">
                <Volume2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Còi 100dB & Thông Báo App</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Còi cứu hỏa tại chỗ đánh thức cả tầng + Bắn thông báo đẩy tức thì về điện thoại người thuê và chủ nhà để phối hợp xử lý.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION: GIẢI PHÁP CHUYÊN BIỆT CHO CHỦ TRỌ & NGƯỜI THUÊ               */}
      {/* ========================================================================= */}
      <section id="solutions" className="py-20 bg-slate-950/70 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-400">
              Đối Tượng Sử Dụng
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Hệ Thống Phân Quyền Thông Minh Cho Cả Hai Bên
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cột Chủ Trọ */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-blue-500/30 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Dành Cho Chủ Nhà Trọ</h3>
                    <p className="text-xs text-blue-400 font-bold uppercase">Quản Lý Tập Trung</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
                  Admin Master
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>Quản trị 50 - 100 phòng trọ:</b> Theo dõi trạng thái cảm biến toàn bộ dãy phòng trên 1 màn hình duy nhất.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>Master Override can thiệp từ xa:</b> Có quyền khóa van, tắt còi hay bật quạt khi khách thuê đi vắng.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>Quản lý & Cấp tài khoản cho khách:</b> CRUD phòng trọ và cấp quyền thiết bị dễ dàng, minh bạch.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>Tăng giá trị cho thuê:</b> Nhà trọ trang bị hệ thống an toàn IoT luôn được khách ưu tiên chọn thuê dài hạn.</span>
                </li>
              </ul>

              <button
                onClick={onGoToLogin}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Truy Cập Trang Quản Trị Trọ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Cột Người Thuê */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-emerald-500/30 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Dành Cho Người Thuê Trọ</h3>
                    <p className="text-xs text-emerald-400 font-bold uppercase">An Tâm Sinh Hoạt</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  Tenant Room
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>An tâm ngủ ngon mỗi đêm:</b> Cảm biến canh gác 24/7, loại bỏ nỗi lo rò rỉ gas lúc đang ngủ say.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>Điều khiển tiện lợi trên điện thoại:</b> Tự kiểm tra nồng độ gas phòng mình, chủ động đóng mở van gas khi nấu ăn.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>Cảnh báo tức thời khi quên:</b> Nhận thông báo ngay nếu vô tình quên vặn bếp hoặc dây dẫn bị chuột cắn.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>Bảo mật riêng tư:</b> Người thuê chỉ thấy và điều khiển đúng phòng của mình, không xem được phòng khác.</span>
                </li>
              </ul>

              <button
                onClick={onGoToRegister}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Đăng Ký Tài Khoản Khách Thuê</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION: FAQ (CÂU HỎI THƯỜNG GẶP)                                      */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-400">
              Giải Đáp Thắc Mắc
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Câu Hỏi Thường Gặp Về SAFE FLAME
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-200 hover:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-sky-400' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BOTTOM CALL TO ACTION BANNER                                           */}
      {/* ========================================================================= */}
      <section className="py-16 bg-gradient-to-r from-blue-900/60 via-slate-900 to-sky-950/60 border-t border-slate-800 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Đừng Chờ Sự Cố Xảy Ra Mới Hành Động!
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Trang bị ngay giải pháp cảm biến rò rỉ khí gas SAFE FLAME để bảo vệ bình yên cho gia đình và người thuê trọ của bạn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onGoToDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-base shadow-xl shadow-sky-500/25 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <Activity className="w-5 h-5" />
              <span>Xem Thử Demo Ngay Bây Giờ</span>
            </button>
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl border border-slate-700 bg-slate-800/90 hover:bg-slate-800 text-slate-200 font-bold text-base transition-all cursor-pointer"
            >
              <span>Vào Trang Đăng Nhập</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="py-12 bg-slate-950 border-t border-slate-850 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white p-1 border border-slate-800">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-black text-white text-sm">SAFE FLAME IoT System</span>
              <p className="text-[10px] text-slate-400">© 2026 Dự án giám sát an toàn rò rỉ khí gas IoT</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-semibold">
            <span className="text-red-400 flex items-center gap-1 font-bold">
              <PhoneCall className="w-3.5 h-3.5" />
              Cứu Hỏa Khẩn Cấp: 114
            </span>
            <a
              href="https://www.facebook.com/people/Safe-Flame/100092285542043/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </a>
            <a
              href="https://www.tiktok.com/@safeflame05"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rose-400 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.27 6.27 0 0 0 1.93-4.52V8.92a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.93-.35z" />
              </svg>
              <span>TikTok</span>
            </a>
            <button onClick={onGoToDemo} className="hover:text-white transition-colors cursor-pointer">Live Demo</button>
            <button onClick={onGoToLogin} className="hover:text-white transition-colors cursor-pointer">Đăng Nhập</button>
            <button onClick={onGoToRegister} className="hover:text-white transition-colors cursor-pointer">Đăng Ký</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
