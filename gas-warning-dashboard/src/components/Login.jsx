import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Mail, Lock, ShieldAlert, Loader2, LogIn, Eye, EyeOff, Server, Power } from 'lucide-react'
import logoImg from '../assets/logo.jpg'

function Login({ onLoginSuccess, onSwitchToRegister, backendUrl, onOpenServerConfig }) {
  const isNative = Capacitor.isNativePlatform()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Validation states
  const [emailError, setEmailError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [generalError, setGeneralError] = useState('')

  // Forgot password states
  const [loginMode, setLoginMode] = useState('login') // 'login' or 'forgot'
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotStep, setForgotStep] = useState(1) // 1 or 2
  const [forgotStatus, setForgotStatus] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [isForgotLoading, setIsForgotLoading] = useState(false)

  // Load Google Identity Services SDK và render nút đăng nhập chính thức (chỉ trên Web)
  useEffect(() => {
    if (isNative) return // Tránh crash OOM / WebView loop trên ứng dụng Android Native

    const id = 'google-jssdk'
    let script = document.getElementById(id)

    const initGoogleButton = () => {
      try {
        if (window.google && window.google.accounts) {
          const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID || '505448970785-7n04si26d3ake527i4i7u7ulk2srg508.apps.googleusercontent.com'

          window.google.accounts.id.initialize({
            client_id: client_id,
            callback: handleCredentialResponse
          })

          const buttonDiv = document.getElementById('google-signin-btn')
          if (buttonDiv) {
            buttonDiv.innerHTML = ''
            window.google.accounts.id.renderButton(
              buttonDiv,
              {
                theme: 'outline',
                size: 'large',
                width: 300,
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left'
              }
            )
          }
        }
      } catch (err) {
        console.warn('Lỗi khởi tạo nút Google Sign-In:', err)
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
  }, [backendUrl, loginMode, isNative])

  // Xử lý phản hồi từ Google khi xác thực người dùng thành công
  const handleCredentialResponse = async (response) => {
    const idToken = response.credential
    setIsLoading(true)
    setGeneralError('')

    try {
      const res = await fetch(`${backendUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập bằng Google thất bại! Vui lòng thử lại.')
      }
      toast.success('👋 Đăng nhập bằng Google thành công!')
      onLoginSuccess(data.token, data.user)
    } catch (err) {
      console.error(err)
      setGeneralError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Khử độc dữ liệu nhập đầu vào chống tấn công XSS chèn thẻ HTML
  const sanitizeInput = (text) => {
    return text.replace(/[<>]/g, '')
  }

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(val)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')
    setEmailError(false)
    setPasswordError(false)

    const cleanEmail = sanitizeInput(email.trim())
    const cleanPassword = password

    let hasError = false

    if (!cleanEmail) {
      setEmailError(true)
      hasError = true
    } else if (!validateEmail(cleanEmail)) {
      setEmailError(true)
      setGeneralError('Địa chỉ email không đúng định dạng!')
      hasError = true
    }

    if (!cleanPassword) {
      setPasswordError(true)
      hasError = true
    }

    if (hasError) {
      if (!generalError && (!cleanEmail || !cleanPassword)) {
        setGeneralError('Vui lòng nhập đầy đủ các trường thông tin bắt buộc!')
      }
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!')
      }

      toast.success('👋 Đăng nhập thành công! Chào mừng trở lại.')
      onLoginSuccess(data.token, data.user)
    } catch (err) {
      console.error(err)
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError')) {
        setGeneralError('Máy chủ Cloud đang khởi động (Render Cold Start ~30s). Vui lòng bấm Đăng nhập lại sau vài giây!')
      } else {
        setGeneralError(err.message || 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Gửi yêu cầu mã OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotStatus('')

    if (!forgotEmail.trim()) {
      setForgotError('Vui lòng nhập địa chỉ email!')
      return
    }

    if (!validateEmail(forgotEmail.trim())) {
      setForgotError('Email không đúng định dạng!')
      return
    }

    setIsForgotLoading(true)
    try {
      const res = await fetch(`${backendUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi gửi mã xác nhận. Email có thể không tồn tại!')
      }
      toast.success('📩 ' + (data.message || 'Mã OTP đã được gửi đến hộp thư của bạn!'))
      setForgotStatus(data.message || 'Mã OTP đã được gửi đến email của bạn!')
      setForgotStep(2)
    } catch (err) {
      setForgotError(err.message)
    } finally {
      setIsForgotLoading(false)
    }
  }

  // Xác minh OTP và đổi mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotStatus('')

    if (!otp.trim() || !newPassword) {
      setForgotError('Vui lòng điền mã OTP và Mật khẩu mới!')
      return
    }

    if (newPassword.length < 6) {
      setForgotError('Mật khẩu mới phải chứa ít nhất 6 ký tự!')
      return
    }

    setIsForgotLoading(true)
    try {
      const res = await fetch(`${backendUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: otp.trim(),
          newPassword
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi đặt lại mật khẩu. Có thể mã OTP đã hết hạn!')
      }
      toast.success('🎉 Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.')
      setLoginMode('login')
      setForgotStep(1)
      setForgotEmail('')
      setOtp('')
      setNewPassword('')
    } catch (err) {
      setForgotError(err.message)
    } finally {
      setIsForgotLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 sm:p-10 glass-card rounded-[32px] shadow-2xl relative overflow-hidden transition-all duration-300 border border-white/50 bg-white/80 animate-fade-slide hover:shadow-sky-500/10">
      {/* Dynamic ambient background glow */}
      <div className="absolute top-[-30%] left-[-30%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-blue-500/5 to-sky-400/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-30%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-red-500/5 to-amber-500/5 blur-[100px] pointer-events-none" />

      {loginMode === 'login' ? (
        <>
          {/* Brand Header with App Logo */}
          <div className="text-center mb-8 relative">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white border border-slate-200/50 flex items-center justify-center p-1.5 mb-4 shadow-md shadow-sky-500/5 overflow-hidden transition-transform duration-300 hover:scale-105">
              <img src={logoImg} className="w-full h-full object-contain" alt="Safe Flame Logo" />
            </div>
            <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-900 via-blue-800 to-sky-600 bg-clip-text text-transparent">
              Đăng nhập
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-semibold">
              Hệ thống giám sát rò rỉ khí Gas SAFE FLAME
            </p>
          </div>

          {/* General Error alert */}
          {generalError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-150 text-red-700 text-xs sm:text-sm font-semibold flex items-start gap-2.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Main Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6 relative">
            {/* Email Input */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[<>]/g, '')
                    setEmail(cleaned)
                    if (emailError) setEmailError(false)
                  }}
                  placeholder="Nhập email..."
                  className={`w-full pl-9 pr-4 py-3 rounded-2xl border text-sm text-slate-800 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all duration-300 ${emailError
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-slate-200 focus:border-sky-500'
                    }`}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider ml-1">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('forgot')
                    setForgotError('')
                    setForgotStatus('')
                  }}
                  className="text-xs text-sky-600 hover:text-sky-500 transition-colors font-bold cursor-pointer bg-transparent border-0"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError(false)
                  }}
                  placeholder="Nhập mật khẩu..."
                  className={`w-full pl-9 pr-11 py-3 rounded-2xl border text-sm text-slate-800 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all duration-300 ${passwordError
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-slate-200 focus:border-sky-500'
                    }`}
                />
                {/* Toggle show/hide password */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4.5 w-4.5 text-sky-600 focus:ring-sky-500/30 border-slate-300 rounded cursor-pointer transition-all"
              />
              <label htmlFor="remember_me" className="ml-2.5 block text-xs sm:text-sm text-slate-600 font-bold select-none cursor-pointer">
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* Main Sign In button - Gradient Neon Glow */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-sky-500/10 hover:shadow-sky-500/25 hover:translate-y-[-1px] active:translate-y-[0px] active:scale-[0.99] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Đang xác thực thông tin...
                </>
              ) : (
                <>
                  Đăng nhập
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>

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
                  <div id="google-signin-btn" className="w-full max-w-full overflow-hidden"></div>
                </div>
              </>
            )}
          </form>

          {/* Redirect footer */}
          <div className="mt-8 text-center text-xs sm:text-sm text-slate-500 font-semibold relative">
            Chưa có tài khoản?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-sky-650 hover:text-sky-500 font-extrabold cursor-pointer bg-transparent border-0"
            >
              Đăng ký ngay
            </button>
          </div>

          {/* Nút thoát ứng dụng trên Android */}
          {isNative && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => CapacitorApp.exitApp()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 text-xs font-semibold transition-colors cursor-pointer bg-white/60 shadow-2xs active:scale-95"
              >
                <Power className="w-3.5 h-3.5 text-rose-500" />
                Thoát ứng dụng
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Reset password card screen */}
          <div className="text-center mb-8 relative">
            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-900 via-blue-800 to-sky-600 bg-clip-text text-transparent">
              Đặt lại mật khẩu
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-semibold">
              {forgotStep === 1
                ? 'Nhập email của bạn để nhận mã xác nhận OTP'
                : 'Nhập mã xác nhận và mật khẩu mới'}
            </p>
          </div>

          {/* Alerts for OTP flow */}
          {forgotError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-150 text-red-700 text-xs sm:text-sm font-semibold flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{forgotError}</span>
            </div>
          )}

          {forgotStatus && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs sm:text-sm font-semibold flex items-start gap-2.5">
              <span>{forgotStatus}</span>
            </div>
          )}

          {forgotStep === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-6 relative">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value.replace(/[<>]/g, ''))}
                    placeholder="Nhập email..."
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 text-slate-800 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all duration-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isForgotLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isForgotLoading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    Đang gửi mã...
                  </>
                ) : (
                  'Gửi mã xác nhận OTP'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5 relative">
              {/* OTP code Input */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Mã xác minh OTP (6 chữ số)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Nhập mã OTP..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-800 text-center font-bold tracking-widest bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all duration-300"
                />
              </div>

              {/* New Password Input */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-800 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all duration-300"
                />
              </div>

              <button
                type="submit"
                disabled={isForgotLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isForgotLoading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    Đang thiết lập...
                  </>
                ) : (
                  'Đặt lại mật khẩu mới'
                )}
              </button>
            </form>
          )}

          {/* Back to Login button */}
          <div className="mt-8 text-center text-xs sm:text-sm font-semibold relative">
            <button
              onClick={() => {
                setLoginMode('login')
                setForgotStep(1)
                setForgotEmail('')
                setOtp('')
                setNewPassword('')
              }}
              className="text-slate-500 hover:text-slate-700 transition-colors cursor-pointer bg-transparent border-0"
            >
              ← Quay lại Đăng nhập
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Login
