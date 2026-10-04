import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo)
  }

  handleReset = () => {
    localStorage.clear()
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px', background: '#f8fafc' }}>
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', maxWidth: '450px', width: '100%', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <h2 style={{ color: '#ef4444', fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>⚠️ Đã xảy ra lỗi giao diện</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              {this.state.error?.message || 'Có lỗi không xác định xảy ra trong ứng dụng.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()} 
                style={{ padding: '10px 20px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🔄 Tải lại trang
              </button>
              <button 
                onClick={this.handleReset} 
                style={{ padding: '10px 20px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🧹 Xóa Cache & Đăng nhập lại
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          duration: 4000, 
          style: { background: '#ffffff', color: '#1e293b', fontSize: '14px', borderRadius: '16px', fontWeight: 'bold', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' } 
        }} 
      />
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
