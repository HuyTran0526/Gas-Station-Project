import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Capacitor } from '@capacitor/core'
import { Mail, Lock, User, ShieldAlert, ArrowRight, Loader2, Home, UserCheck, Server, Cpu } from 'lucide-react'
import logoImg from '../assets/logo.jpg'

function Register({ onRegisterSuccess, onSwitchToLogin, backendUrl, onOpenServerConfig }) {
  const isNative = Capacitor.isNativePlatform()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('tenant') // default to tenant
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1) // 1: Info, 2: OTP
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Load Google Identity Services SDK và render nút đăng ký chính thức (chỉ trên Web)
  useEffect(() => {
    if (isNative) return // Tránh crash OOM / WebView loop trên ứng dụng Android Native

    const id = 'google-jssdk-register'
    let script = document.getElementById(id)
    
    const initGoogleButton = () => {
      if (window.google && window.google.accounts) {
        const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID || '505448970785-7n04si26d3ake527i4i7u7ulk2srg508.apps.googleusercontent.com'
        
        window.google.accounts.id.initialize({
          client_id: client_id,
          callback: handleCredentialResponse
        })

        const buttonDiv = document.getElementById('google-register-btn')
        if (buttonDiv) {
          buttonDiv.innerHTML = ''
          window.google.accounts.id.renderButton(
            buttonDiv,
            { 
              theme: 'outline', 
              size: 'large', 
              width: 300,
              text: 'signup_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            }
          )
        }
      }
    }

    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.id = id
      script.async = true
      script.defer = true
      script.onload = initGoogleButton
      document.head.appendChild(script)
    } else {
      if (window.google) {
        initGoogleButton()
      } else {
        script.onload = initGoogleButton
      }
    }
  }, [backendUrl, isNative])

  const handleCredentialResponse = async (response) => {
    const idToken = response.credential
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`${backendUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Đăng ký bằng Google thất bại! Vui lòng thử lại.')
      }
      toast.success('🎉 Đăng ký tài khoản Google thành công! Bắt đầu sử dụng hệ thống.')
      onRegisterSuccess(data.token, data.user)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Basic Validation
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc!')
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự!')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`${backendUrl}/auth/send-register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Không thể gửi OTP. Email có thể đã tồn tại!')
      }
      toast.success('Mã OTP đã được gửi đến email của bạn!')
      setStep(2)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')

    if (!otp) {
      setError('Vui lòng nhập mã OTP!')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role: 'tenant',
          deviceId: 'DEFAULT_DEV',
          roomName: 'Chưa gán phòng (Chờ chủ trọ xếp)',
          otp
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Xác minh OTP thất bại hoặc đăng ký không thành công!')
      }
      toast.success('🎉 Đăng ký tài khoản thành công! Bắt đầu sử dụng hệ thống.')
      onRegisterSuccess(data.token, data.user)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-6 sm:p-8 glass-card rounded-3xl shadow-xl relative overflow-hidden transition-all duration-500 animate-fade-slide border border-white/50 bg-white/80 hover:shadow-sky-500/10">
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-sky-500/5 blur-[80px] pointer-events-none" />

      <div className="text-center mb-6 relative">
        <h2 className="text-2xl font-black bg-gradient-to-r from-blue-900 via-blue-800 to-sky-600 bg-clip-text text-transparent">
          Tạo tài khoản mới
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 font-medium">
          Đăng ký để cùng giám sát và vận hành hệ thống bảo vệ trọ Safe Flame
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-150 text-red-700 text-xs font-semibold flex items-center gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={step === 1 ? handleSubmit : handleVerifyOtp} className="space-y-4 relative">
        {step === 1 ? (
          <>
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Họ và tên *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value.replace(/[<>]/g, ''))}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all duration-300"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Email *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/[<>]/g, ''))}
                  placeholder="Nhập email..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all duration-300"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Mật khẩu *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all duration-300"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Xác nhận mật khẩu *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all duration-300"
                />
              </div>
            </div>

            {/* Thông báo vai trò Người Thuê */}
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-150 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-sky-900 block">Tài khoản Người Thuê Trọ</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Sau khi đăng ký thành công, Chủ trọ sẽ duyệt và xếp phòng kèm thiết bị cảnh báo gas tương ứng cho bạn.
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-sky-500/10 hover:shadow-sky-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi OTP...
                </>
              ) : (
                <>
                  Đăng ký tài khoản
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 text-center mb-4">
              <p className="text-sm font-semibold text-slate-700">Nhập mã xác minh</p>
              <p className="text-xs text-slate-500 mt-1">Chúng tôi đã gửi mã gồm 6 chữ số đến email <strong>{email}</strong></p>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1 text-center">
                Mã OTP *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[1em] py-3 rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all duration-300"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-700 hover:from-emerald-400 hover:via-emerald-500 hover:to-green-600 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xác minh...
                </>
              ) : (
                <>
                  Xác minh & Hoàn tất
                  <UserCheck className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full mt-2 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-transparent border-0 cursor-pointer"
            >
              Quay lại
            </button>
          </>
        )}

        {/* Divider for Social Login (chỉ trên Web) */}
        {!isNative && (
          <>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200/80"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Hoặc tiếp tục với</span>
              <div className="flex-grow border-t border-slate-200/80"></div>
            </div>

            {/* Official Google Sign-In Button Container */}
            <div className="w-full flex justify-center">
              <div id="google-register-btn" className="w-full max-w-full overflow-hidden"></div>
            </div>
          </>
        )}
      </form>

      <div className="mt-5 text-center text-xs text-slate-500 font-semibold relative">
        Đã có tài khoản?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-sky-650 hover:underline font-extrabold cursor-pointer bg-transparent border-0"
        >
          Đăng nhập ngay
        </button>
      </div>
    </div>
  )
}

export default Register
