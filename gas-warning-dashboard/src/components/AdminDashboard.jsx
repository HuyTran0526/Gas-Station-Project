import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  Building2,
  Cpu,
  Users,
  ShieldAlert,
  ShieldCheck,
  Plus,
  RefreshCw,
  Activity,
  Edit2,
  Trash2,
  UserPlus,
  Home,
  CheckCircle2,
  XCircle,
  Fan,
  Volume2,
  VolumeX,
  Gauge,
  UserCheck,
  Search,
  ArrowRight,
  Phone,
  Mail,
  Loader2,
  X,
  AlertTriangle,
  Radio,
  BarChart2,
  Copy,
  Check,
  Globe,
  Share2,
  Smartphone,
  Monitor,
  ClipboardList,
  FileText,
  MapPin,
  Layers,
  Send
} from 'lucide-react'
import FloorPlanModal from './FloorPlanModal'
import IncidentBlackboxModal from './IncidentBlackboxModal'

export default function AdminDashboard({ currentUser, token, backendUrl, onSwitchToMonitor, onRefreshDevices }) {
  const [activeTab, setActiveTab] = useState('devices') // 'devices' | 'tenants' | 'orders' | 'traffic'
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false)
  const [isBlackboxOpen, setIsBlackboxOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [stats, setStats] = useState({ totalRooms: 0, onlineRooms: 0, dangerRooms: 0, totalTenants: 0 })
  const [devices, setDevices] = useState([])
  const [tenants, setTenants] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  // Traffic Analytics state
  const [analytics, setAnalytics] = useState({
    totalClicks: 0,
    facebookClicks: 0,
    tiktokClicks: 0,
    directClicks: 0,
    mobileClicks: 0,
    desktopClicks: 0,
    recentLogs: []
  })
  const [copiedLink, setCopiedLink] = useState(null)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)

  // Modals state
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState(null)
  const [deviceForm, setDeviceForm] = useState({ deviceId: '', deviceName: '', location: 'Khu vực bếp' })

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [tenantForm, setTenantForm] = useState({ fullName: '', email: '', password: '', phone: '', deviceId: '' })

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assigningTenant, setAssigningTenant] = useState(null)
  const [assignDeviceId, setAssignDeviceId] = useState('')

  // Tải dữ liệu tổng quan
  const fetchOverviewData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${backendUrl}/admin/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Không thể tải dữ liệu quản trị')
      const data = await res.json()
      setStats(data.stats || { totalRooms: 0, onlineRooms: 0, dangerRooms: 0, totalTenants: 0 })
      setDevices(data.devices || [])
      setTenants(data.tenants || [])
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Lỗi khi tải dữ liệu trang quản trị')
    } finally {
      setIsLoading(false)
    }
  }

  // Tải dữ liệu Traffic Analytics
  const fetchAnalytics = async () => {
    setIsAnalyticsLoading(true)
    try {
      const res = await fetch(`${backendUrl}/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Lỗi khi tải analytics:', err)
    } finally {
      setIsAnalyticsLoading(false)
    }
  }

  // Tải danh sách đơn đăng ký khảo sát từ Landing Page
  const fetchOrders = async () => {
    setIsOrdersLoading(true)
    try {
      const res = await fetch(`${backendUrl}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.warn('Lỗi tải orders:', err)
    } finally {
      setIsOrdersLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${backendUrl}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success('Cập nhật trạng thái thành công!')
        fetchOrders()
      }
    } catch (err) {
      toast.error('Lỗi cập nhật đơn hàng')
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn xóa đơn đăng ký này?')) return
    try {
      const res = await fetch(`${backendUrl}/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success('Đã xóa đơn đăng ký')
        fetchOrders()
      }
    } catch (err) {
      toast.error('Lỗi xóa đơn')
    }
  }

  useEffect(() => {
    fetchOverviewData()
    fetchAnalytics()
    fetchOrders()
  }, [backendUrl, token])

  const handleCopyLink = (url, key) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url)
    }
    setCopiedLink(key)
    toast.success('Đã sao chép link chiến dịch!')
    setTimeout(() => setCopiedLink(null), 2500)
  }

  // --- XỬ LÝ PHÒNG / THIẾT BỊ ---
  const handleOpenAddDevice = () => {
    setEditingDevice(null)
    setDeviceForm({ deviceId: '', deviceName: '', location: 'Khu vực bếp' })
    setIsDeviceModalOpen(true)
  }

  const handleOpenEditDevice = (dev) => {
    setEditingDevice(dev)
    setDeviceForm({ deviceId: dev.deviceId, deviceName: dev.deviceName, location: dev.location || 'Khu vực bếp' })
    setIsDeviceModalOpen(true)
  }

  const handleSaveDevice = async (e) => {
    e.preventDefault()
    if (!deviceForm.deviceId || !deviceForm.deviceName) {
      toast.error('Vui lòng nhập đầy đủ Mã thiết bị và Tên phòng!')
      return
    }

    setIsActionLoading(true)
    try {
      const isEdit = !!editingDevice
      const url = isEdit
        ? `${backendUrl}/admin/devices/${editingDevice.deviceId}`
        : `${backendUrl}/admin/devices`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(deviceForm)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Không thể lưu thông tin phòng!')

      toast.success(data.message || 'Lưu thông tin phòng thành công!')
      setIsDeviceModalOpen(false)
      fetchOverviewData()
      if (onRefreshDevices) onRefreshDevices()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteDevice = async (dev) => {
    if (dev.deviceId === 'DEFAULT_DEV') {
      toast.error('Không thể xóa Trạm gas chính mặc định!')
      return
    }
    if (!window.confirm(`Bạn có chắc muốn xóa phòng [${dev.deviceName} (${dev.deviceId})]? Hành động này không thể hoàn tác.`)) {
      return
    }

    setIsActionLoading(true)
    try {
      const res = await fetch(`${backendUrl}/admin/devices/${dev.deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Xóa thiết bị thất bại')

      toast.success(data.message || 'Đã xóa phòng thành công!')
      fetchOverviewData()
      if (onRefreshDevices) onRefreshDevices()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // --- XỬ LÝ NGƯỜI THUÊ ---
  const handleOpenAddTenant = () => {
    setEditingTenant(null)
    setTenantForm({ fullName: '', email: '', password: '', phone: '', deviceId: devices[0]?.deviceId || 'DEFAULT_DEV' })
    setIsTenantModalOpen(true)
  }

  const handleOpenEditTenant = (tenant) => {
    setEditingTenant(tenant)
    setTenantForm({
      fullName: tenant.fullName || '',
      email: tenant.email || '',
      password: '', // Để trống nếu không đổi
      phone: tenant.phone || '',
      deviceId: tenant.assignedDeviceId || devices[0]?.deviceId || 'DEFAULT_DEV'
    })
    setIsTenantModalOpen(true)
  }

  const handleSaveTenant = async (e) => {
    e.preventDefault()
    if (!tenantForm.fullName || !tenantForm.email) {
      toast.error('Vui lòng điền đủ Họ tên và Email!')
      return
    }

    const isEdit = !!editingTenant
    if (!isEdit && !tenantForm.password) {
      toast.error('Vui lòng nhập Mật khẩu cho tài khoản mới!')
      return
    }

    if (tenantForm.password && tenantForm.password.length < 6) {
      toast.error('Mật khẩu phải chứa ít nhất 6 ký tự!')
      return
    }

    setIsActionLoading(true)
    try {
      const tenantId = editingTenant?._id || editingTenant?.id
      const url = isEdit
        ? `${backendUrl}/admin/tenants/${tenantId}`
        : `${backendUrl}/admin/tenants`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tenantForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || (isEdit ? 'Cập nhật thông tin thất bại' : 'Tạo người thuê thất bại'))

      toast.success(data.message || (isEdit ? 'Đã cập nhật thông tin khách thuê thành công!' : 'Tạo tài khoản người thuê thành công!'))
      setIsTenantModalOpen(false)
      setEditingTenant(null)
      fetchOverviewData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleOpenAssignModal = (tenant) => {
    setAssigningTenant(tenant)
    setAssignDeviceId(tenant.assignedDeviceId || devices[0]?.deviceId || 'DEFAULT_DEV')
    setIsAssignModalOpen(true)
  }

  const handleSaveAssign = async (e) => {
    e.preventDefault()
    if (!assignDeviceId) {
      toast.error('Vui lòng chọn phòng để gán!')
      return
    }

    setIsActionLoading(true)
    try {
      const targetDev = devices.find(d => d.deviceId === assignDeviceId)
      const res = await fetch(`${backendUrl}/admin/tenants/${assigningTenant._id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceId: assignDeviceId,
          roomName: targetDev ? targetDev.deviceName : `Phòng ${assignDeviceId}`
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gán phòng thất bại')

      toast.success(data.message || 'Đã gán phòng thành công!')
      setIsAssignModalOpen(false)
      fetchOverviewData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRevokeTenant = async (tenant) => {
    if (!window.confirm(`Xác nhận thu hồi phòng của khách [${tenant.fullName}] (Khách trả phòng)?`)) {
      return
    }
    setIsActionLoading(true)
    try {
      const res = await fetch(`${backendUrl}/admin/tenants/${tenant._id}/revoke`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Thu hồi phòng thất bại')

      toast.success(data.message || 'Đã thu hồi phòng thành công!')
      fetchOverviewData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteTenant = async (tenant) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản [${tenant.fullName} (${tenant.email})]?`)) {
      return
    }
    setIsActionLoading(true)
    try {
      const res = await fetch(`${backendUrl}/admin/tenants/${tenant._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Xóa người thuê thất bại')

      toast.success(data.message || 'Đã xóa người thuê thành công!')
      fetchOverviewData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Filter search
  const filteredDevices = devices.filter(d => 
    d.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.location && d.location.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredTenants = tenants.filter(t => 
    t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.roomName && t.roomName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.phone && t.phone.includes(searchQuery))
  )

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Header Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/60 bg-white/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-40%] right-[-10%] w-72 h-72 rounded-full bg-orange-500/10 blur-[80px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
          <div>
            <div className="font-brand inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-black uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Bảng Điều Khiển Quản Trị Trọ</span>
            </div>
            <h2 className="font-brand text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-stone-900 via-orange-800 to-orange-500 bg-clip-text text-transparent">
              Quản Lý Khu Trọ Safe Flame
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Giám sát trạng thái IoT, quản lý danh sách phòng, phân quyền người thuê và can thiệp khẩn cấp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onSwitchToMonitor('DEFAULT_DEV', 'Trạm Gas Chính')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>Giám Sát Trực Tiếp</span>
            </button>
            <button
              onClick={fetchOverviewData}
              disabled={isLoading}
              className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-orange-600 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Cards Thống kê */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng Phòng</span>
              <span className="text-lg sm:text-2xl font-black text-slate-800">{stats.totalRooms}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">ESP32 Online</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-600">{stats.onlineRooms}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Cảnh Báo Gas</span>
              <span className="text-lg sm:text-2xl font-black text-rose-600">{stats.dangerRooms}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Người Thuê</span>
              <span className="text-lg sm:text-2xl font-black text-indigo-600">{stats.totalTenants}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs Switch */}
        <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs select-none">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'devices'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Phòng & Thiết Bị ({devices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'tenants'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Người Thuê ({tenants.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('orders'); fetchOrders(); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Đơn Đăng Ký ({orders.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('traffic'); fetchAnalytics(); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'traffic'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Chiến Dịch ({analytics.totalClicks})</span>
          </button>
        </div>

        {/* Global Action Buttons: Sơ đồ mặt bằng 2D & Hộp Đen Sự Cố */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsFloorPlanOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Layers className="w-4 h-4 text-orange-600" />
            <span>Sơ Đồ Mặt Bằng 2D</span>
          </button>

          <button
            onClick={() => setIsBlackboxOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <FileText className="w-4 h-4 text-orange-400" />
            <span>Hộp Đen Sự Cố PCCC</span>
          </button>
        </div>

        {/* Search input & Add Button */}
        {activeTab === 'traffic' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              disabled={isAnalyticsLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyticsLoading ? 'animate-spin text-orange-600' : 'text-slate-500'}`} />
              <span>Cập Nhật Số Liệu</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'devices' ? 'Tìm phòng, mã ID...' : 'Tìm người thuê, email...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>

            {activeTab === 'devices' ? (
              <button
                onClick={handleOpenAddDevice}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Phòng</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAddTenant}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm Khách</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: DANH SÁCH PHÒNG & THIẾT BỊ */}
      {activeTab === 'devices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDevices.length > 0 ? (
            filteredDevices.map((dev) => {
              const isDanger = dev.isDangerMode || dev.ppm >= 600
              const isWarning = dev.ppm >= 400 && dev.ppm < 600

              return (
                <div
                  key={dev.deviceId}
                  className={`glass-card p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    isDanger
                      ? 'border-red-300 bg-red-50/40 shadow-red-500/10'
                      : 'border-white/80 bg-white/85 hover:shadow-lg hover:border-orange-400'
                  }`}
                >
                  {/* Top Bar of Card */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">{dev.deviceName}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px] font-bold">
                            {dev.deviceId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{dev.location || 'Khu vực bếp'}</p>
                      </div>

                      {/* Online Status */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
                          dev.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${dev.isOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                        {dev.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    {/* Gas PPM Indicator */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge className={`w-5 h-5 ${isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`} />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">Nồng độ Gas</span>
                          <span className={`text-base font-black ${isDanger ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {dev.ppm} PPM
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase ${
                          isDanger
                            ? 'bg-red-100 text-red-700 animate-pulse'
                            : isWarning
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isDanger ? '🚨 NGUY HIỂM' : isWarning ? '⚠️ Chú Ý' : '🟢 An Toàn'}
                      </span>
                    </div>

                    {/* Actuator Status Pills */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                      <div className={`p-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 ${
                        dev.isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-rose-50 text-rose-700 border border-rose-150'
                      }`}>
                        <span>{dev.isOpen ? '🔓 Mở Van' : '🔒 Khóa Van'}</span>
                      </div>
                      <div className={`p-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 ${
                        dev.isOn ? 'bg-orange-50 text-orange-700 border border-orange-150' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className="flex items-center gap-1">
                          <Fan className={`w-3.5 h-3.5 ${dev.isOn ? 'animate-spin' : ''}`} />
                          {dev.isOn ? 'Quạt Bật' : 'Quạt Tắt'}
                        </span>
                      </div>
                      <div className={`p-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 ${
                        !dev.isBuzzerMuted ? 'bg-red-50 text-red-700 border border-red-150 animate-pulse' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span>{!dev.isBuzzerMuted ? '🔔 Còi Kêu' : '🔕 Còi Tắt'}</span>
                      </div>
                    </div>

                    {/* Tenant Info */}
                    <div className="text-xs text-slate-600 mb-4 p-2.5 rounded-xl bg-orange-50/50 border border-orange-100">
                      <span className="text-[10px] font-extrabold text-orange-800 uppercase block mb-1">Người thuê phòng:</span>
                      {dev.tenants && dev.tenants.length > 0 ? (
                        <div className="space-y-0.5">
                          {dev.tenants.map(t => (
                            <div key={t.id} className="font-bold text-slate-800 flex items-center justify-between">
                              <span>👤 {t.fullName}</span>
                              <span className="text-[11px] text-slate-500 font-mono">{t.phone || t.email}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa có người thuê phòng này</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSwitchToMonitor(dev.deviceId, dev.deviceName)}
                      className="flex-1 py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="Chuyển sang trang Home để điều khiển trực tiếp phòng này"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Giám Sát & Điều Khiển</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditDevice(dev)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
                      title="Chỉnh sửa thông tin phòng"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {dev.deviceId !== 'DEFAULT_DEV' && (
                      <button
                        onClick={() => handleDeleteDevice(dev)}
                        className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-all cursor-pointer"
                        title="Xóa phòng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full p-8 text-center glass-card rounded-3xl border border-slate-200 text-slate-500">
              <Cpu className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-bold">Không tìm thấy thiết bị phòng nào phù hợp.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUẢN LÝ NGƯỜI THUÊ TRỌ */}
      {activeTab === 'tenants' && (
        <div className="glass-card rounded-3xl border border-white/80 bg-white/85 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Người Thuê</th>
                  <th className="py-4 px-6">Liên Hệ</th>
                  <th className="py-4 px-6">Phòng Đang Ở</th>
                  <th className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                            {tenant.fullName ? tenant.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block">{tenant.fullName}</span>
                            <span className="text-[11px] text-slate-400">Tham gia: {new Date(tenant.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{tenant.email}</span>
                          </div>
                          {tenant.phone && (
                            <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{tenant.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs font-bold">
                          <Home className="w-3.5 h-3.5 text-orange-600" />
                          <span>{tenant.roomName || 'Phòng ' + tenant.assignedDeviceId}</span>
                          <span className="text-[10px] text-orange-500 font-mono font-semibold">({tenant.assignedDeviceId || 'N/A'})</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditTenant(tenant)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Chỉnh sửa thông tin khách thuê (Họ tên, SĐT, Email, Đặt lại mật khẩu)"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-orange-600" />
                            <span>Sửa</span>
                          </button>

                          <button
                            onClick={() => handleOpenAssignModal(tenant)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 font-bold text-xs transition-all cursor-pointer"
                            title="Đổi phòng hoặc gán phòng cho khách"
                          >
                            Đổi Phòng
                          </button>

                          <button
                            onClick={() => handleRevokeTenant(tenant)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 font-bold text-xs transition-all cursor-pointer"
                            title="Khách trả phòng (Thu hồi phòng)"
                          >
                            Trả Phòng
                          </button>

                          <button
                            onClick={() => handleDeleteTenant(tenant)}
                            className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 transition-all cursor-pointer"
                            title="Xóa tài khoản khách này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      Không tìm thấy người thuê nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: THỐNG KÊ CHIẾN DỊCH & TRAFFIC FB / TIKTOK */}
      {activeTab === 'traffic' && (
        <div className="space-y-6 animate-fade-slide">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Facebook Card */}
            <div className="p-5 rounded-2xl bg-white border border-blue-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 block">
                  Click Từ Facebook
                </span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  {analytics.facebookClicks}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">
                  Chiến dịch Bài viết / Ads FB
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Share2 className="w-6 h-6" />
              </div>
            </div>

            {/* TikTok Card */}
            <div className="p-5 rounded-2xl bg-white border border-rose-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 block">
                  Click Từ TikTok
                </span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  {analytics.tiktokClicks}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">
                  Link Bio / Video TikTok
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Radio className="w-6 h-6" />
              </div>
            </div>

            {/* Direct / Others Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Trực Tiếp / Khác
                </span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  {analytics.directClicks}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">
                  Gõ URL trực tiếp hoặc nguồn khác
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                <Globe className="w-6 h-6" />
              </div>
            </div>

            {/* Total Clicks Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100 block">
                  Tổng Lượt Click Vào Web
                </span>
                <span className="text-3xl font-black mt-1 block">
                  {analytics.totalClicks}
                </span>
                <span className="text-[11px] text-blue-100 font-semibold mt-0.5 block">
                  📱 Mobile: {analytics.mobileClicks} | 💻 PC: {analytics.desktopClicks}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <BarChart2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* UTM Campaign Links Ready to Copy */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  🔗 Link Chiến Dịch Gắn Vào Mạng Xã Hội (Sẵn Sàng Sử Dụng)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chỉ cần copy đường link dưới đây để dán vào bài viết Facebook hoặc Bio TikTok. Hệ thống sẽ tự động đo lường lượt click!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Facebook Link Box */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-700 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-blue-600" />
                    <span>Facebook (Chính thức)</span>
                  </span>
                  <button
                    onClick={() => handleCopyLink('https://safeflame.vercel.app/?utm_source=facebook&utm_medium=social&utm_campaign=safeflame', 'fb')}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink === 'fb' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink === 'fb' ? 'Đã chép!' : 'Copy Link'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-blue-200 font-mono text-[11px] text-blue-900 break-all select-all">
                  https://safeflame.vercel.app/?utm_source=facebook&utm_medium=social&utm_campaign=safeflame
                </div>
              </div>

              {/* TikTok Link Box */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-rose-600" />
                    <span>TikTok (Bio / Video)</span>
                  </span>
                  <button
                    onClick={() => handleCopyLink('https://safeflame.vercel.app/?utm_source=tiktok&utm_medium=social&utm_campaign=safeflame', 'tiktok')}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink === 'tiktok' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink === 'tiktok' ? 'Đã chép!' : 'Copy Link'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-rose-200 font-mono text-[11px] text-rose-900 break-all select-all">
                  https://safeflame.vercel.app/?utm_source=tiktok&utm_medium=social&utm_campaign=safeflame
                </div>
              </div>

              {/* Direct / Others Link Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-slate-600" />
                    <span>Trực Tiếp / Khác (Direct)</span>
                  </span>
                  <button
                    onClick={() => handleCopyLink('https://safeflame.vercel.app/?utm_source=direct', 'direct')}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink === 'direct' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink === 'direct' ? 'Đã chép!' : 'Copy Link'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-slate-800 break-all select-all">
                  https://safeflame.vercel.app/?utm_source=direct
                </div>
              </div>
            </div>
          </div>

          {/* Recent Clicks Log Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-800">
                  ⏱️ Lịch Sử Lượt Click Gần Nhất (Thời Gian Thực)
                </h4>
                <p className="text-xs text-slate-400">Hiển thị 20 lượt truy cập mới nhất vào hệ thống</p>
              </div>
              <button
                onClick={fetchAnalytics}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyticsLoading ? 'animate-spin' : ''}`} />
                <span>Cập nhật</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Nguồn Truy Cập</th>
                    <th className="py-3 px-4">Thiết Bị</th>
                    <th className="py-3 px-4">Trang Đích</th>
                    <th className="py-3 px-4">Địa Chỉ IP</th>
                    <th className="py-3 px-4 text-right">Thời Gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {analytics.recentLogs && analytics.recentLogs.length > 0 ? (
                    analytics.recentLogs.map((log) => {
                      const isFb = log.source === 'facebook'
                      const isTt = log.source === 'tiktok'
                      return (
                        <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-bold">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              isFb
                                ? 'bg-blue-100 text-blue-700'
                                : isTt
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isFb ? '🔵 Facebook' : isTt ? '🎵 TikTok' : '🌐 ' + log.source}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                              {log.device === 'mobile' ? (
                                <>
                                  <Smartphone className="w-3.5 h-3.5 text-orange-500" />
                                  <span>Điện thoại</span>
                                </>
                              ) : (
                                <>
                                  <Monitor className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Máy tính</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {log.path || '/'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            {log.ip ? log.ip.replace('::ffff:', '') : '127.0.0.1'}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-500">
                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        Chưa có lượt click nào được ghi nhận. Hãy chia sẻ link để bắt đầu theo dõi!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUẢN LÝ ĐƠN ĐĂNG KÝ KHẢO SÁT & ĐẶT CỌC (LEADS TỪ LANDING PAGE) */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fade-slide">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
              <div>
                <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-orange-600" />
                  Danh Sách Khách Hàng Đăng Ký Khảo Sát & Lắp Đặt
                </h4>
                <p className="text-xs text-slate-400">
                  Thu thập từ Công cụ Tính Dự Toán và Form Đăng Ký trên Landing Page SafeFlame
                </p>
              </div>

              <button
                onClick={fetchOrders}
                disabled={isOrdersLoading}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isOrdersLoading ? 'animate-spin' : ''}`} />
                <span>Cập nhật</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Số Điện Thoại & Email</th>
                    <th className="py-3 px-4">Địa Chỉ Khu Trọ</th>
                    <th className="py-3 px-4 text-center">Số Phòng & Gói</th>
                    <th className="py-3 px-4 text-right">Dự Toán Chi Phí</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {orders && orders.length > 0 ? (
                    orders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {ord.fullName}
                        </td>
                        <td className="py-3.5 px-4">
                          <a href={`tel:${ord.phone}`} className="font-mono font-bold text-orange-600 hover:underline block">
                            📞 {ord.phone}
                          </a>
                          {ord.email && (
                            <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                              {ord.email}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700 max-w-[200px] truncate" title={ord.address}>
                          {ord.address}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-extrabold text-slate-900 block">{ord.roomsCount} phòng</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase inline-block bg-slate-100 text-slate-600">
                            {ord.packageType === 'basic' ? 'Cơ Bản' : ord.packageType === 'pro' ? 'Tiêu Chuẩn' : 'Tòa Nhà'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                          {ord.estimatedCost ? ord.estimatedCost.toLocaleString('vi-VN') + ' đ' : 'Chưa định'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <select
                            value={ord.status || 'pending'}
                            onChange={(e) => handleUpdateOrderStatus(ord._id, e.target.value)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase cursor-pointer border ${
                              ord.status === 'installed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ord.status === 'contacted'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : ord.status === 'cancelled'
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <option value="pending">Chờ tư vấn</option>
                            <option value="contacted">Đã liên hệ</option>
                            <option value="installed">Đã hoàn tất</option>
                            <option value="cancelled">Đã hủy</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteOrder(ord._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa đơn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 italic">
                        Chưa có khách hàng nào đăng ký khảo sát lắp đặt.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SƠ ĐỒ MẶT BẰNG 2D */}
      <FloorPlanModal
        isOpen={isFloorPlanOpen}
        onClose={() => setIsFloorPlanOpen(false)}
        devices={devices}
        currentDeviceId=""
        userRole="landlord"
        backendUrl={backendUrl}
        token={token}
        onRefreshDevices={fetchOverviewData}
        onSelectDevice={(id) => {
          const dev = devices.find(d => d.deviceId === id)
          if (onSwitchToMonitor) onSwitchToMonitor(id, dev?.deviceName || id)
        }}
      />

      {/* MODAL HỘP ĐEN SỰ CỐ PCCC */}
      <IncidentBlackboxModal
        isOpen={isBlackboxOpen}
        onClose={() => setIsBlackboxOpen(false)}
        backendUrl={backendUrl}
        token={token}
      />

      {/* MODAL THÊM / SỬA PHÒNG */}
      {isDeviceModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in cursor-pointer"
          onClick={() => setIsDeviceModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 ring-1 ring-slate-900/5 relative animate-scale-up cursor-default overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {editingDevice ? 'Chỉnh Sửa Thông Tin Phòng' : 'Thêm Phòng Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingDevice ? 'Cập nhật cấu hình cảm biến và vị trí' : 'Khai báo phòng và nạp mã thiết bị ESP32'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeviceModalOpen(false)}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Mã Thiết Bị (Device ID) *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingDevice}
                  value={deviceForm.deviceId}
                  onChange={(e) => setDeviceForm({ ...deviceForm, deviceId: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  placeholder="VD: P101, DEV_101"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                />
                {!editingDevice && (
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Mã này dùng để nạp vào mạch ESP32 hoặc phân biệt phòng.</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Tên Phòng Hiển Thị *
                </label>
                <input
                  type="text"
                  required
                  value={deviceForm.deviceName}
                  onChange={(e) => setDeviceForm({ ...deviceForm, deviceName: e.target.value })}
                  placeholder="VD: Phòng 101 - Tầng 1"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Vị Trí Cảm Biến
                </label>
                <input
                  type="text"
                  value={deviceForm.location}
                  onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
                  placeholder="VD: Khu vực bếp, Gần bình gas"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingDevice ? 'Cập Nhật' : 'Tạo Phòng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL THÊM / SỬA NGƯỜI THUÊ */}
      {isTenantModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in cursor-pointer"
          onClick={() => {
            setIsTenantModalOpen(false)
            setEditingTenant(null)
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 ring-1 ring-slate-900/5 relative animate-scale-up cursor-default overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                  {editingTenant ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {editingTenant ? 'Chỉnh Sửa Khách Thuê' : 'Tạo Tài Khoản Khách Thuê'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingTenant ? 'Cập nhật thông tin hoặc chuyển phòng' : 'Cấp tài khoản đăng nhập cho khách'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsTenantModalOpen(false)
                  setEditingTenant(null)
                }}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-4 overflow-y-auto pr-0.5 flex-1">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={tenantForm.fullName}
                  onChange={(e) => setTenantForm({ ...tenantForm, fullName: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Địa chỉ Email (Đăng nhập) *
                </label>
                <input
                  type="email"
                  required
                  value={tenantForm.email}
                  onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                  placeholder="khachthue@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  {editingTenant ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu ban đầu *'}
                </label>
                <input
                  type="password"
                  required={!editingTenant}
                  value={tenantForm.password}
                  onChange={(e) => setTenantForm({ ...tenantForm, password: e.target.value })}
                  placeholder={editingTenant ? 'Nhập mật khẩu mới nếu muốn đổi cho khách...' : 'Tối thiểu 6 ký tự'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                />
                {editingTenant && (
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    Chủ trọ có thể đặt lại mật khẩu cho khách tại đây nếu khách quên mật khẩu.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="text"
                  value={tenantForm.phone}
                  onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                  placeholder="VD: 0987654321"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  {editingTenant ? 'Chuyển / Gán Phòng' : 'Gán Vào Phòng'}
                </label>
                <select
                  value={tenantForm.deviceId}
                  onChange={(e) => setTenantForm({ ...tenantForm, deviceId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all cursor-pointer bg-white"
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.deviceName} ({d.deviceId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsTenantModalOpen(false)
                    setEditingTenant(null)
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTenant ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL GÁN / ĐỔI PHÒNG */}
      {isAssignModalOpen && assigningTenant && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in cursor-pointer"
          onClick={() => setIsAssignModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 ring-1 ring-slate-900/5 relative animate-scale-up cursor-default overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Đổi Phòng Cho Khách Thuê</h3>
                  <p className="text-xs text-slate-500 font-medium">Khách: <b>{assigningTenant.fullName}</b> ({assigningTenant.email})</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssign} className="space-y-4 overflow-y-auto pr-0.5 flex-1">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Chọn Phòng Muốn Chuyển Đến:
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {devices.map((d) => (
                    <label
                      key={d.deviceId}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        assignDeviceId === d.deviceId
                          ? 'bg-orange-50/80 border-orange-500 text-orange-950 font-bold shadow-xs ring-1 ring-orange-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="assignRoom"
                          value={d.deviceId}
                          checked={assignDeviceId === d.deviceId}
                          onChange={() => setAssignDeviceId(d.deviceId)}
                          className="accent-orange-600"
                        />
                        <div>
                          <span className="text-sm block font-bold text-slate-800">{d.deviceName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Mã: {d.deviceId} | {d.location}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${d.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {d.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác Nhận Gán Phòng</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
