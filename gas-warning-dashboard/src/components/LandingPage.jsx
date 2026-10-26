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
  ChevronDown,
  Mail,
  Phone,
  Package,
  Maximize2,
  Eye,
  X,
  Copy,
  CheckCheck,
  QrCode,
  GraduationCap,
  Layers
} from 'lucide-react'
import logoImg from '../assets/logo.jpg'
import logoIconImg from '../assets/logo-icon.png'
import posterImg from '../assets/safe-flame-poster.png'
import BrandLogo from './BrandLogo'

export default function LandingPage({ onGoToLogin, onGoToRegister, onGoToDemo, backendUrl }) {
  // Trạng thái mô phỏng tương tác trên Hero Card (Interactive Hero Demo)
  const [demoState, setDemoState] = useState('safe') // 'safe' | 'warning' | 'danger'
  const [openFaq, setOpenFaq] = useState(null)
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false)
  const [copiedField, setCopiedField] = useState(null)


  const copyToClipboard = (text, fieldName) => {
    try {
      navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2500)
    } catch (e) {
      console.warn('Copy to clipboard failed', e)
    }
  }

  const demoConfigs = {
    safe: {
      ppm: 350,
      label: 'Bình thường - An toàn',
      statusClass: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300',
      badgeClass: 'bg-emerald-500 text-stone-950 font-black',
      dotColor: 'bg-emerald-400',
      barColor: 'from-emerald-500 to-teal-400',
      valveOpen: true,
      fanOn: false,
      buzzerActive: false,
      desc: 'Môi trường phòng bếp trong lành, không phát hiện rò rỉ khí gas.'
    },
    warning: {
      ppm: 480,
      label: 'Cảnh giác - Có dấu hiệu rò rỉ',
      statusClass: 'bg-amber-950/40 border-amber-500/40 text-amber-300',
      badgeClass: 'bg-amber-500 text-stone-950 font-black',
      dotColor: 'bg-amber-400',
      barColor: 'from-amber-400 to-orange-500',
      valveOpen: true,
      fanOn: true,
      buzzerActive: false,
      desc: 'Phát hiện nồng độ gas tăng nhẹ. Hệ thống tự bật quạt thông gió để làm thoáng phòng.'
    },
    danger: {
      ppm: 880,
      label: '🚨 BÁO ĐỘNG ĐỎ - RÒ RỈ KHẨN CẤP!',
      statusClass: 'bg-red-950/50 border-red-500/60 text-red-200 animate-pulse',
      badgeClass: 'bg-gradient-to-r from-red-600 to-orange-600 text-white animate-bounce font-black',
      dotColor: 'bg-red-500',
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
      a: 'CÓ! Cảm biến ESP32 được lập trình xử lý tự động độc lập tại chỗ. Khi nồng độ gas vượt ngưỡng nguy hiểm, thiết bị sẽ tự động ngắt van cơ học và hú còi báo động ngay lập tức tại phòng kể cả khi không có mạng WiFi. Khi WiFi phục hồi, hệ thống sẽ đồng bộ lịch sử cảnh báo lên máy chủ.'
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
      a: 'Hoàn toàn không. Bộ thiết bị SafeFlame thiết kế dạng Plug & Play nhỏ gọn như trên hình ảnh sản phẩm: Cắm nguồn điện, gắn cảm biến gần khu vực bình gas hoặc khu bếp và kết nối WiFi trong 3 phút là sẵn sàng hoạt động.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0b0907] text-stone-100 font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Flame Glows - Tông màu rực lửa & ấm áp */}
      <div className="fixed top-[-20%] left-[-10%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-orange-600/20 via-amber-600/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="fixed top-[40%] right-[-15%] w-[55%] h-[55%] rounded-full bg-gradient-to-bl from-orange-500/15 via-red-600/10 to-transparent blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-15%] left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-amber-600/15 via-orange-600/10 to-transparent blur-[140px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* TOP NOTIFICATION BAR - FPT UNIVERSITY PARTNER RECOGNITION                */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-orange-950 via-stone-900 to-amber-950 border-b border-orange-500/20 py-1.5 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-extrabold text-[11px] border border-orange-500/30">
            <GraduationCap className="w-3.5 h-3.5" />
            FPT UNIVERSITY
          </span>
          <span className="text-stone-300 text-[11px] sm:text-xs">
            Dự án nghiên cứu & ứng dụng IoT an toàn phòng chống cháy nổ rò rỉ khí gas
          </span>
          <a
            href="tel:0393022057"
            className="hidden md:inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-bold ml-2 underline underline-offset-2"
          >
            <Phone className="w-3 h-3" />
            Hotline: 0393.022.057
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR                                                             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0b0907]/85 border-b border-orange-500/15 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <BrandLogo
            theme="dark"
            size="md"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-stone-300">
            <a href="#hardware" className="hover:text-orange-400 transition-colors flex items-center gap-1">
              <Package className="w-4 h-4 text-orange-400" />
              <span>Sản Phẩm Thực Tế</span>
            </a>
            <a href="#features" className="hover:text-orange-400 transition-colors">Tính Năng Cốt Lõi</a>
            <a href="#how-it-works" className="hover:text-orange-400 transition-colors">4 Tầng Bảo Vệ</a>
            <a href="#solutions" className="hover:text-orange-400 transition-colors">Giải Pháp Trọ</a>
            <a href="#contact" className="hover:text-orange-400 transition-colors">Liên Hệ</a>
            <a href="#faq" className="hover:text-orange-400 transition-colors">Hỏi Đáp (FAQ)</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Social Links (Desktop Header) */}
            <div className="hidden sm:flex items-center gap-1.5 mr-1 border-r border-stone-800 pr-3">
              <a
                href="https://www.facebook.com/people/Safe-Flame/100092285542043/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-stone-800 bg-stone-900/80 hover:bg-orange-600 hover:border-orange-500 text-stone-300 hover:text-white transition-all shadow-xs"
                title="Safe Flame | Facebook"
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
                className="p-2 rounded-xl border border-stone-800 bg-stone-900/80 hover:bg-orange-600 hover:border-orange-500 text-stone-300 hover:text-white transition-all shadow-xs"
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
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Xem thử giao diện giám sát nồng độ gas"
            >
              <Activity className="w-4 h-4 text-orange-400" />
              <span>Xem Demo</span>
            </button>
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Đăng Nhập</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION WITH FLAME THEME & DUAL DEMO / POSTER HIGHLIGHT          */}
      {/* ========================================================================= */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline & Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-bold shadow-xs">
                <Flame className="w-4 h-4 text-orange-400 animate-pulse fill-orange-400/50" />
                <span>PHÁT HIỆN SỚM • BẢO VỆ AN TOÀN TOÀN DIỆN</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                Hệ Thống Cảnh Báo <br className="hidden sm:inline" />
                Rò Rỉ Khí Gas <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                  Ứng Dụng Công Nghệ IoT
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Tự động <b className="text-white">đóng chặt van khóa gas</b> trong 1.5 giây, <b className="text-white">kích hoạt quạt thông gió</b> cưỡng bức, phát còi 100dB và gửi thông báo tức thời đến điện thoại mọi lúc mọi nơi.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={onGoToDemo}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-base transition-all shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                >
                  <Activity className="w-5 h-5" />
                  <span>Trải Nghiệm Live Dashboard Demo</span>
                </button>
                <a
                  href="#hardware"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-orange-500/30 bg-stone-900/80 hover:bg-stone-850 hover:border-orange-500/60 text-orange-300 font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Package className="w-5 h-5 text-orange-400" />
                  <span>Xem Trọn Bộ Thiết Bị Thật</span>
                </a>
              </div>

              {/* Official Social Channels / Fanpage & TikTok */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <span className="text-xs font-semibold text-stone-400">
                  Kênh chính thức Safe Flame:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <a
                    href="https://www.facebook.com/people/Safe-Flame/100092285542043/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-600 hover:border-orange-500 text-orange-200 hover:text-white text-xs font-bold transition-all shadow-sm hover:shadow-orange-500/25 active:scale-95 group"
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
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-gradient-to-r hover:from-orange-600 hover:to-amber-600 hover:border-orange-500 text-amber-200 hover:text-white text-xs font-bold transition-all shadow-sm hover:shadow-orange-500/25 active:scale-95 group"
                    title="Safe Flame (@safeflame05) | TikTok"
                  >
                    <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.27 6.27 0 0 0 1.93-4.52V8.92a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.93-.35z" />
                    </svg>
                    <span>TikTok @safeflame05</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </a>

                  <button
                    onClick={() => setIsPosterModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-orange-500/40 bg-stone-900/90 hover:bg-orange-500/20 text-orange-300 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-orange-400" />
                    <span>Xem Poster Gốc</span>
                  </button>
                </div>
              </div>

              {/* Quick Trust Badges */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-stone-800/80 text-left">
                <div>
                  <span className="block text-2xl font-black text-orange-400">1.5s</span>
                  <span className="text-xs text-stone-400 font-semibold">Tự động ngắt van cơ</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-amber-400">100dB</span>
                  <span className="text-xs text-stone-400 font-semibold">Còi & Đèn LED báo động</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-yellow-400">Realtime</span>
                  <span className="text-xs text-stone-400 font-semibold">Thông báo đẩy tức thì</span>
                </div>
              </div>
            </div>

            {/* Right Column: INTERACTIVE HERO DEMO WIDGET IN FLAME TONE */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-7 rounded-3xl bg-stone-900/90 border border-orange-500/25 shadow-2xl shadow-orange-950/40 backdrop-blur-xl relative space-y-6">
                
                {/* Header widget */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Mô Phỏng Trực Tiếp Cảm Biến</h4>
                      <p className="text-[11px] text-stone-400">Thiết bị ESP32 - Phòng Trọ Safe Flame</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online 24/7
                  </span>
                </div>

                {/* Switcher Buttons to test live */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider block mb-2">
                    Bấm để thử các kịch bản khí gas:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDemoState('safe')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        demoState === 'safe'
                          ? 'bg-emerald-500 text-stone-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700 text-stone-300'
                      }`}
                    >
                      🟢 An Toàn
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoState('warning')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        demoState === 'warning'
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/20 font-black'
                          : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700 text-stone-300'
                      }`}
                    >
                      🟡 Cảnh Giác
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoState('danger')}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        demoState === 'danger'
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white border-red-500 shadow-lg shadow-red-600/30 animate-pulse font-black'
                          : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700 text-stone-300'
                      }`}
                    >
                      🚨 Rò Rỉ Gas!
                    </button>
                  </div>
                </div>

                {/* PPM Gauge Live Meter */}
                <div className="p-5 rounded-2xl bg-[#0e0c0a] border border-orange-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Nồng độ khí Gas</span>
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${currentCfg.badgeClass}`}>
                      {currentCfg.label}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {currentCfg.ppm}
                    </span>
                    <span className="text-sm font-bold text-stone-400">PPM (Parts Per Million)</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-3 rounded-full bg-stone-900 overflow-hidden border border-stone-800 p-0.5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${currentCfg.barColor} transition-all duration-500`}
                      style={{ width: `${Math.min(100, (currentCfg.ppm / 1000) * 100)}%` }}
                    />
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed pt-1">
                    {currentCfg.desc}
                  </p>
                </div>

                {/* 3 Hardware Devices Status */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Van gas */}
                  <div className={`p-3 rounded-xl border transition-all text-center ${
                    currentCfg.valveOpen ? 'bg-stone-900/60 border-stone-800' : 'bg-red-950/40 border-red-500/60 text-red-200'
                  }`}>
                    <div className="flex justify-center mb-1.5">
                      {currentCfg.valveOpen ? (
                        <Unlock className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase text-stone-400 block">Van Khóa Gas</span>
                    <span className={`text-xs font-black ${currentCfg.valveOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                      {currentCfg.valveOpen ? 'ĐANG MỞ' : '🔒 ĐÃ KHÓA'}
                    </span>
                  </div>

                  {/* Quạt hút */}
                  <div className={`p-3 rounded-xl border transition-all text-center ${
                    currentCfg.fanOn ? 'bg-orange-950/40 border-orange-500/60 text-orange-200' : 'bg-stone-900/60 border-stone-800'
                  }`}>
                    <div className="flex justify-center mb-1.5">
                      <Fan className={`w-5 h-5 text-orange-400 ${currentCfg.fanOn ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase text-stone-400 block">Quạt Hút Gió</span>
                    <span className={`text-xs font-black ${currentCfg.fanOn ? 'text-orange-400' : 'text-stone-500'}`}>
                      {currentCfg.fanOn ? '🌀 BẬT 100%' : 'TẮT'}
                    </span>
                  </div>

                  {/* Còi báo */}
                  <div className={`p-3 rounded-xl border transition-all text-center ${
                    currentCfg.buzzerActive ? 'bg-red-950/40 border-red-500/60 text-red-200 animate-pulse' : 'bg-stone-900/60 border-stone-800'
                  }`}>
                    <div className="flex justify-center mb-1.5">
                      {currentCfg.buzzerActive ? (
                        <Volume2 className="w-5 h-5 text-red-400 animate-bounce" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-stone-500" />
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase text-stone-400 block">Còi Báo Động</span>
                    <span className={`text-xs font-black ${currentCfg.buzzerActive ? 'text-red-400' : 'text-stone-500'}`}>
                      {currentCfg.buzzerActive ? '🔊 100dB HÚ!' : 'IM LẶNG'}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={onGoToDemo}
                    className="w-full py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
      {/* 3. NEW SECTION: SẢN PHẨM THỰC TẾ & BỘ ĐÓNG GÓI TIÊU CHUẨN (POSTER SHOWCASE) */}
      {/* ========================================================================= */}
      <section id="hardware" className="py-20 bg-gradient-to-b from-[#0f0c09] via-stone-950 to-[#0b0907] border-y border-orange-500/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-extrabold uppercase tracking-wider">
              <Package className="w-4 h-4" />
              <span>Thiết Bị Phần Cứng Đã Hoàn Thiện & Đóng Gói Chuẩn</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Trọn Bộ Thiết Bị Cảm Biến & Hộp Đựng SAFE FLAME
            </h2>
            <p className="text-sm sm:text-base text-stone-300">
              Sản phẩm phần cứng hoàn thiện từ phòng lab Đại học FPT, tích hợp trọn gói cảm biến màn hình LCD, còi hú 100dB, đèn LED cùng hộp đóng gói thương hiệu cao cấp.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: Interactive Poster / Product Showcase with Glow Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div 
                onClick={() => setIsPosterModalOpen(true)}
                className="group relative max-w-sm rounded-3xl p-3 bg-gradient-to-b from-orange-500/30 via-stone-850 to-stone-900 border border-orange-500/40 shadow-2xl shadow-orange-950/60 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-orange-400"
                title="Nhấn để phóng to ảnh poster đầy đủ"
              >
                {/* Ambient backglow behind image */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-600/25 via-transparent to-transparent pointer-events-none" />

                {/* Badge top */}
                <div className="absolute top-6 left-6 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/90 border border-orange-500/40 text-[11px] font-black text-orange-300 backdrop-blur-md shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ảnh Chụp Sản Phẩm Thật</span>
                </div>

                {/* Zoom overlay on hover */}
                <div className="absolute inset-0 z-20 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white font-bold backdrop-blur-[2px]">
                  <div className="p-3 rounded-full bg-orange-500 text-stone-950 shadow-lg">
                    <Maximize2 className="w-6 h-6" />
                  </div>
                  <span className="text-sm bg-stone-900/90 px-3 py-1 rounded-full border border-orange-500/30">
                    Phóng to poster chất lượng cao
                  </span>
                </div>

                {/* The Poster Image */}
                <div className="rounded-2xl overflow-hidden bg-stone-950 border border-stone-800">
                  <img
                    src={posterImg}
                    alt="Safe Flame Poster - Bộ Thiết Bị Cảm Biến Rò Rỉ Khí Gas IoT"
                    className="w-full h-auto object-cover max-h-[580px] mx-auto transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Quick Caption Under Image */}
                <div className="mt-3 text-center px-2 py-1">
                  <p className="text-xs font-bold text-orange-300 flex items-center justify-center gap-1.5">
                    <span>Cảm biến LCD</span>
                    <span className="text-stone-600">•</span>
                    <span>Hộp Safe Flame</span>
                    <span className="text-stone-600">•</span>
                    <span>FPT University</span>
                  </p>
                </div>
              </div>

              <span className="text-[11px] text-stone-400 mt-3 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-orange-400" />
                Nhấp vào ảnh để xem chi tiết thông số & mã QR
              </span>
            </div>

            {/* Right: The 4 Core Product Pillars (from Poster) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  Cam Kết Chất Lượng Thiết Bị
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Phát Hiện Sớm — Bảo Vệ An Toàn Tuyệt Đối
                </h3>
                <p className="text-sm text-stone-300 leading-relaxed">
                  Được thiết kế tinh gọn theo triết lý Plug & Play, thiết bị Safe Flame dễ dàng lắp đặt tại mọi không gian bếp, phòng trọ mà không làm ảnh hưởng đến cấu trúc công trình.
                </p>
              </div>

              {/* 4 Poster Feature Points with Visual Accent Line */}
              <div className="space-y-4 relative pl-4 sm:pl-6 before:content-[''] before:absolute before:left-1 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-orange-500 before:via-amber-500 before:to-orange-600">
                
                {/* Feature 1 */}
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-orange-500/40 transition-all space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-xs shrink-0 border border-orange-500/30">
                      1
                    </div>
                    <h4 className="text-base font-extrabold text-white">Phát hiện rò rỉ khí gas nhanh chóng</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 pl-9.5">
                    Cảm biến MQ2 độ nhạy cao quét môi trường liên tục mỗi 2 giây, phát hiện tức thì khí gas LPG ngay từ những ppm rò rỉ đầu tiên.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-orange-500/40 transition-all space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs shrink-0 border border-amber-500/30">
                      2
                    </div>
                    <h4 className="text-base font-extrabold text-white">Cảnh báo kịp thời bằng âm thanh & đèn LED</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 pl-9.5">
                    Tích hợp còi hú cứu hỏa cường độ cao 100dB đánh thức tức thì cùng hệ thống đèn LED nhấp nháy trực quan ngay trên thiết bị.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-orange-500/40 transition-all space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-xs shrink-0 border border-orange-500/30">
                      3
                    </div>
                    <h4 className="text-base font-extrabold text-white">Thông báo đến điện thoại mọi lúc, mọi nơi</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 pl-9.5">
                    Module IoT kết nối WiFi gửi tin nhắn cảnh báo đẩy (Push Notification) đến smartphone của Người Thuê & Chủ Trọ chỉ sau 1 giây.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-orange-500/40 transition-all space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-black text-xs shrink-0 border border-red-500/30">
                      4
                    </div>
                    <h4 className="text-base font-extrabold text-white">Tự động ngắt van gas & kích hoạt quạt thông gió</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 pl-9.5">
                    Tự can thiệp cơ học vặn ngắt van gas tại bình trong 1.5s và kích hoạt quạt hút 100% công suất để loại trừ hoàn toàn nguy cơ nổ.
                  </p>
                </div>

              </div>

              {/* Hardware Highlights 4-grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-center">
                  <span className="block text-xs font-black text-orange-400 mb-0.5">Màn hình LCD</span>
                  <span className="text-[11px] text-stone-400">Đọc PPM tại chỗ</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-center">
                  <span className="block text-xs font-black text-amber-400 mb-0.5">Hộp Tiêu Chuẩn</span>
                  <span className="text-[11px] text-stone-400">Bao bì cao cấp</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-center">
                  <span className="block text-xs font-black text-orange-400 mb-0.5">Plug & Play</span>
                  <span className="text-[11px] text-stone-400">Lắp đặt 3 phút</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-center">
                  <span className="block text-xs font-black text-amber-400 mb-0.5">ESP32 SoC</span>
                  <span className="text-[11px] text-stone-400">Xử lý tại chỗ</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION: NỖI SỢ THỰC TẾ & VẤN ĐỀ NGUY HIỂM TẠI NHÀ TRỌ                 */}
      {/* ========================================================================= */}
      <section id="features" className="py-16 bg-[#0a0806] border-y border-stone-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-400">
              Cảnh Giác Nguy Hiểm Vô Hình
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Tại Sao Rò Rỉ Khí Gas Là Kẻ Thù Thầm Lặng Nguy Hiểm Nhất?
            </h2>
            <p className="text-sm sm:text-base text-stone-400">
              Khí gas gia dụng (LPG) nặng hơn không khí và có xu hướng chìm xuống sàn nhà. Trong không gian phòng trọ khép kín, một sơ suất nhỏ có thể gây hậu quả khôn lường.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3.5 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Tia Lửa Nhỏ - Phát Nổ Lớn</h3>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Khi khí gas tích tụ trong phòng kín, chỉ một hành động bật công tắc đèn, cắm sạc điện thoại hay tia lửa nhỏ từ tủ lạnh cũng có thể kích nổ toàn bộ căn phòng.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3.5 hover:border-amber-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Ngạt Khí Trong Lúc Ngủ Say</h3>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Rò rỉ khí gas vào ban đêm đẩy oxy ra khỏi phòng, làm người thuê bị mê man sâu và ngạt khí trước khi kịp nhận biết để mở cửa thoát hiểm.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3.5 hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Trách Nhiệm Nặng Nề Của Chủ Trọ</h3>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Một phòng gặp sự cố có thể cháy lan toàn bộ dãy trọ. Chủ trọ đối mặt với thiệt hại hàng tỷ đồng và trách nhiệm pháp lý nghiêm trọng về phòng cháy chữa cháy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION: CƠ CHẾ 4 TẦNG BẢO VỆ CỦA SAFE FLAME                          */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-400">
              Công Nghệ Can Thiệp Tự Động
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Cơ Chế 4 Tầng Bảo Vệ Toàn Diện Của SAFE FLAME
            </h2>
            <p className="text-sm sm:text-base text-stone-400">
              Không chỉ dừng lại ở việc phát hiện, SAFE FLAME trực tiếp can thiệp phần cứng để dập tắt mối nguy hiểm trước khi con người kịp phản ứng.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tầng 1 */}
            <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 relative space-y-4 hover:border-orange-500/50 transition-all">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-orange-500 text-stone-950 font-black text-[10px] uppercase tracking-wider">
                Tầng 1 - Cảm Biến
              </span>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mt-2">
                <Radio className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Quét Liên Tục Mỗi 2s</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Cảm biến MQ2 đo nồng độ liên tục mỗi 2 giây, phát hiện các phân tử khí LPG và Methane ngay từ những ppm rò rỉ đầu tiên.
              </p>
            </div>

            {/* Tầng 2 */}
            <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 relative space-y-4 hover:border-amber-500/50 transition-all">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[10px] uppercase tracking-wider">
                Tầng 2 - Ngắt Nguồn
              </span>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mt-2">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Khóa Van Cơ Học Trong 1.5s</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Động cơ cơ học lập tức vặn ngắt van gas tại đầu bình, cô lập triệt để nguồn cấp, không để rò rỉ thêm một phân tử gas nào.
              </p>
            </div>

            {/* Tầng 3 */}
            <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 relative space-y-4 hover:border-yellow-500/50 transition-all">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-yellow-500 text-stone-950 font-black text-[10px] uppercase tracking-wider">
                Tầng 3 - Thoát Khí
              </span>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mt-2">
                <Fan className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Quạt Hút Cưỡng Bức 100%</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Khởi động quạt hút thông gió công suất cao đẩy toàn bộ lượng khí gas tích tụ ra ngoài cửa thông gió, giải tỏa áp suất nổ.
              </p>
            </div>

            {/* Tầng 4 */}
            <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 relative space-y-4 hover:border-red-500/50 transition-all">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider">
                Tầng 4 - Cảnh Báo Kép
              </span>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mt-2">
                <Volume2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Còi 100dB & Thông Báo App</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Còi cứu hỏa tại chỗ đánh thức cả dãy phòng + Bắn thông báo đẩy tức thì về điện thoại người thuê và chủ nhà để phối hợp xử lý.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION: GIẢI PHÁP CHUYÊN BIỆT CHO CHỦ TRỌ & NGƯỜI THUÊ               */}
      {/* ========================================================================= */}
      <section id="solutions" className="py-20 bg-stone-950/70 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-400">
              Đối Tượng Sử Dụng
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Hệ Thống Phân Quyền Thông Minh Cho Cả Hai Bên
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cột Chủ Trọ */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-900/90 border border-orange-500/30 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Dành Cho Chủ Nhà Trọ</h3>
                    <p className="text-xs text-orange-400 font-bold uppercase">Quản Lý Tập Trung</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-bold">
                  Admin Master
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-stone-300">
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
                  <span><b>Quản lý & Cấp tài khoản cho khách:</b> Phân quyền thiết bị cho từng phòng dễ dàng, minh bạch.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>Tăng giá trị cho thuê:</b> Nhà trọ trang bị hệ thống an toàn IoT luôn được khách ưu tiên chọn thuê dài hạn.</span>
                </li>
              </ul>

              <button
                onClick={onGoToLogin}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Truy Cập Trang Quản Trị Trọ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Cột Người Thuê */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-900/90 border border-amber-500/30 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Dành Cho Người Thuê Trọ</h3>
                    <p className="text-xs text-amber-400 font-bold uppercase">An Tâm Sinh Hoạt</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  Tenant Room
                </span>
              </div>

              <ul className="space-y-3.5 text-sm text-stone-300">
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
                className="w-full py-3.5 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-amber-500/40 text-amber-300 font-extrabold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Đăng Ký Tài Khoản Khách Thuê</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>



      {/* ========================================================================= */}
      {/* 7. CONTACT US & SOCIAL CHANNELS (VERBATIM FROM POSTER FOOTER)             */}
      {/* ========================================================================= */}
      <section id="contact" className="py-16 bg-[#0c0907] border-t border-orange-500/20 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-orange-400">
              Kênh Trao Đổi & Hỗ Trợ Kỹ Thuật
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              CONTACT US
            </h2>
            <p className="text-xs sm:text-sm text-stone-400">
              Liên hệ đội ngũ phát triển Safe Flame để tư vấn giải pháp an toàn và trang bị thiết bị cho nhà trọ của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Phone & Email Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-orange-500/30 space-y-5">
              <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
                <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Hotline & Hòm Thư Dự Án</h3>
                  <p className="text-xs text-stone-400">Hỗ trợ nhanh 24/7</p>
                </div>
              </div>

              {/* Phone item */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-orange-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Số Điện Thoại</span>
                    <a href="tel:0393022057" className="text-lg font-black text-white hover:text-orange-400 transition-colors">
                      0393022057
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('0393022057', 'phone')}
                  className="px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  {copiedField === 'phone' ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã copy</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-400" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>

              {/* Email item */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Hộp Thư Điện Tử</span>
                    <a href="mailto:safeflame04@gmail.com" className="text-sm sm:text-base font-bold text-white hover:text-amber-400 transition-colors">
                      safeflame04@gmail.com
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('safeflame04@gmail.com', 'email')}
                  className="px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  {copiedField === 'email' ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã copy</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-400" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200/90 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Bảo trợ chuyên môn & nghiên cứu: <b>Đại học FPT Cần Thơ</b></span>
              </div>
            </div>

            {/* Social QR & Links Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-orange-500/30 space-y-5">
              <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Mạng Xã Hội Chính Thức</h3>
                  <p className="text-xs text-stone-400">Quét mã QR hoặc nhấn truy cập trực tiếp</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Facebook card */}
                <a
                  href="https://www.facebook.com/people/Safe-Flame/100092285542043/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 hover:border-orange-500/50 hover:bg-stone-850 transition-all text-center group flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-black text-white group-hover:text-orange-400 transition-colors block">FACEBOOK</span>
                    <span className="text-[10px] text-stone-400">Safe Flame Fanpage</span>
                  </div>
                  <span className="text-[10px] font-bold text-orange-400 mt-1 inline-flex items-center gap-0.5">
                    Mở trang <ExternalLink className="w-3 h-3" />
                  </span>
                </a>

                {/* TikTok card */}
                <a
                  href="https://www.tiktok.com/@safeflame05"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-850 transition-all text-center group flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.27 6.27 0 0 0 1.93-4.52V8.92a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.93-.35z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-black text-white group-hover:text-amber-400 transition-colors block">TIKTOK</span>
                    <span className="text-[10px] text-stone-400">@safeflame05</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 mt-1 inline-flex items-center gap-0.5">
                    Mở kênh <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              </div>

              <div className="text-center pt-1">
                <button
                  onClick={() => setIsPosterModalOpen(true)}
                  className="text-xs font-bold text-orange-300 hover:text-orange-200 underline underline-offset-4 cursor-pointer"
                >
                  Xem mã QR quét nhanh trên poster gốc →
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SECTION: FAQ (CÂU HỎI THƯỜNG GẶP)                                      */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 border-t border-stone-850">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-400">
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
                  className="rounded-2xl border border-stone-800 bg-stone-900/80 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-stone-200 hover:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${isOpen ? 'rotate-180 text-orange-400' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-stone-400 leading-relaxed border-t border-stone-800/60 pt-3">
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
      {/* 9. BOTTOM CALL TO ACTION BANNER                                           */}
      {/* ========================================================================= */}
      <section className="py-16 bg-gradient-to-r from-orange-950/80 via-stone-900 to-amber-950/70 border-t border-orange-500/30 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Đừng Chờ Sự Cố Xảy Ra Mới Hành Động!
          </h2>
          <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
            Trang bị ngay giải pháp cảm biến rò rỉ khí gas SAFE FLAME để bảo vệ bình yên cho gia đình và người thuê trọ của bạn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onGoToDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-base shadow-xl shadow-orange-500/25 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <Activity className="w-5 h-5" />
              <span>Xem Thử Demo Ngay Bây Giờ</span>
            </button>
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl border border-stone-700 bg-stone-850 hover:bg-stone-800 text-stone-200 font-bold text-base transition-all cursor-pointer"
            >
              <span>Vào Trang Đăng Nhập</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="py-12 bg-[#070504] border-t border-stone-850 text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 border border-stone-750">
              <div className="w-full h-full bg-stone-900 rounded-[10px] p-1 flex items-center justify-center">
                <img src={logoIconImg} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm">SAFE FLAME IoT System</span>
                <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30 font-bold">
                  FPT University
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                © 2026 Dự án giám sát an toàn rò rỉ khí gas IoT • Hotline: 0393.022.057
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-semibold">
            <span className="text-red-400 flex items-center gap-1 font-bold">
              <PhoneCall className="w-3.5 h-3.5" />
              Cứu Hỏa Khẩn Cấp: 114
            </span>
            <a
              href="https://www.facebook.com/people/Safe-Flame/100092285542043/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-400 transition-colors flex items-center gap-1.5"
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
              className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
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

      {/* ========================================================================= */}
      {/* 11. POSTER LIGHTBOX MODAL                                                 */}
      {/* ========================================================================= */}
      {isPosterModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-slide"
          onClick={() => setIsPosterModalOpen(false)}
        >
          <div 
            className="relative max-w-lg w-full max-h-[92vh] flex flex-col items-center bg-stone-900 border border-orange-500/40 rounded-3xl p-3 sm:p-4 shadow-2xl shadow-orange-950/80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header bar */}
            <div className="w-full flex items-center justify-between pb-3 px-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span className="text-xs sm:text-sm font-black text-white">Poster Giới Thiệu Chính Thức Safe Flame</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPosterModalOpen(false)}
                className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster image full view */}
            <div className="w-full overflow-y-auto py-2 flex justify-center">
              <img
                src={posterImg}
                alt="Safe Flame Poster Full"
                className="max-h-[75vh] w-auto rounded-xl object-contain shadow-md"
              />
            </div>

            {/* Modal footer with quick action buttons */}
            <div className="w-full pt-3 px-2 border-t border-stone-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-stone-300">
                <Phone className="w-3.5 h-3.5 text-orange-400" />
                <span>0393.022.057</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={posterImg}
                  download="safe-flame-poster.png"
                  className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-bold border border-orange-500/30 transition-colors"
                >
                  Tải Ảnh Về Máy
                </a>
                <button
                  type="button"
                  onClick={() => setIsPosterModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-stone-950 font-black transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



    </div>
  )
}
