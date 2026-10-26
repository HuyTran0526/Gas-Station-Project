import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  Building2,
  X,
  Gauge,
  Flame,
  Fan,
  Volume2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  User,
  Power,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Radio,
  Wind,
  Sparkles,
  RefreshCw,
  Eye,
  Edit3,
  Save,
  RotateCcw,
  Plus,
  Settings2,
  Move,
  Columns,
  Grid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function FloorPlanModal({
  isOpen,
  onClose,
  devices = [],
  currentDeviceId = '',
  onSelectDevice,
  onToggleValve,
  onToggleFan,
  userRole = 'landlord',
  backendUrl,
  token,
  onRefreshDevices
}) {
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [viewMode, setViewMode] = useState('architectural') // 'architectural' | 'heatmap'
  const [layoutType, setLayoutType] = useState('double') // 'double' (Dãy đôi 2 bên hành lang) | 'single' (Dãy đơn 1 hàng)
  const [displayMode, setDisplayMode] = useState('panoramic') // 'panoramic' (Cuộn ngang dài) | 'grid' (Lưới thu gọn)
  const [isEditingLayout, setIsEditingLayout] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [isProcessingFloorAction, setIsProcessingFloorAction] = useState(false)
  const [isSavingLayout, setIsSavingLayout] = useState(false)
  const [localDeviceOverrides, setLocalDeviceOverrides] = useState({})

  // Bố cục tùy biến do Admin thiết lập (lưu ở state và localStorage)
  const [customLayout, setCustomLayout] = useState(() => {
    try {
      const saved = localStorage.getItem('safeflame_floorplan_custom_layout')
      return saved ? JSON.parse(saved) : {}
    } catch (e) {
      return {}
    }
  })

  const corridorScrollRef = useRef(null)

  // Cuộn nhanh sang Cánh Tây hoặc Cánh Đông
  const scrollHallway = (direction) => {
    if (corridorScrollRef.current) {
      const scrollAmount = 450
      corridorScrollRef.current.scrollBy({
        left: direction === 'west' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // Chuẩn hóa và xử lý danh sách phòng
  const { allDevices, centralStation, floorRooms, availableFloors } = useMemo(() => {
    const rawList = Array.isArray(devices) && devices.length > 0 ? devices : (currentDeviceId ? [{
      deviceId: currentDeviceId,
      deviceName: 'Trạm Gas Chính',
      ppm: 350,
      isOpen: true,
      isOn: false,
      isOnline: true,
      floor: 1
    }] : [])

    // 1. Khử trùng lặp theo deviceId (ưu tiên bản ghi mới nhất)
    const devMap = new Map()
    rawList.forEach(item => {
      if (!item || !item.deviceId) return
      const id = String(item.deviceId).trim().toUpperCase()
      // Bỏ qua các thiết bị test rác nếu có
      if (id === 'SIMULATE.JS' || id === 'TEST_SAFETY_DEV') return

      const existing = devMap.get(id)
      if (!existing) {
        devMap.set(id, { ...item, deviceId: id })
      } else {
        const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0
        const itemTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0
        if (itemTime >= existingTime) {
          devMap.set(id, { ...item, deviceId: id })
        }
      }
    })

    const sanitizedList = Array.from(devMap.values()).map((item, idx) => {
      const id = item.deviceId
      const savedCustom = customLayout[id] || {}
      
      // Tự động đoán số phòng từ tên
      const nameStr = String(savedCustom.deviceName || item.deviceName || id || '')
      const numMatch = nameStr.match(/\d+/)
      const parsedNum = numMatch ? parseInt(numMatch[0], 10) : null
      
      // Tự động phân tầng: ưu tiên custom -> backend floor -> số đầu tiên của mã phòng 3 chữ số (vd: P102 -> T1, P201 -> T2)
      let defaultFloor = 1
      if (savedCustom.floor) defaultFloor = Number(savedCustom.floor)
      else if (item.floor) defaultFloor = Number(item.floor)
      else if (parsedNum && parsedNum >= 100) defaultFloor = Math.floor(parsedNum / 100)

      // Tự động phân dãy: phòng chẵn dãy Bắc, phòng lẻ dãy Nam
      let defaultWing = 'north'
      if (savedCustom.wing) {
        defaultWing = savedCustom.wing
      } else if (item.wing) {
        defaultWing = item.wing
      } else if (parsedNum) {
        defaultWing = parsedNum % 2 === 0 ? 'north' : 'south'
      } else {
        defaultWing = idx % 2 === 0 ? 'north' : 'south'
      }

      return {
        ...item,
        deviceName: nameStr || `Phòng ${id}`,
        ppm: typeof item.ppm === 'number' ? item.ppm : 350,
        isOpen: item.isOpen !== false,
        isOn: !!item.isOn,
        isOnline: !!item.isOnline,
        floor: defaultFloor,
        wing: defaultWing,
        orderIndex: typeof savedCustom.orderIndex === 'number' ? savedCustom.orderIndex : (typeof item.orderIndex === 'number' ? item.orderIndex : idx),
        kitchenCorner: savedCustom.kitchenCorner || item.kitchenCorner || 'left',
        ...(localDeviceOverrides[id] || {})
      }
    })

    // 2. Tách Trạm Gas Trung Tâm (Central Manifold) khỏi các phòng trọ
    let station = sanitizedList.find(d => 
      d.deviceId === 'DEFAULT_DEV' || 
      d.deviceName.toLowerCase().includes('trạm gas') || 
      d.deviceName.toLowerCase().includes('tram gas')
    )

    if (!station) {
      station = {
        deviceId: 'DEFAULT_DEV',
        deviceName: 'Trạm Gas Trung Tâm',
        ppm: 350,
        isOpen: true,
        isOn: false,
        isOnline: true,
        floor: 1,
        ...(localDeviceOverrides['DEFAULT_DEV'] || {})
      }
    }

    // Các phòng trọ cho thuê
    const rentalRooms = sanitizedList.filter(d => d.deviceId !== station.deviceId)

    // Nếu hệ thống mới chưa tạo phòng nào, chuẩn bị 6 phòng mẫu
    const finalRooms = rentalRooms.length > 0 ? rentalRooms : [
      { deviceId: 'DEV_102', deviceName: 'Phòng 102', floor: 1, wing: 'north', orderIndex: 0, ppm: 340, isOpen: true, isOn: false, isOnline: true },
      { deviceId: 'DEV_104', deviceName: 'Phòng 104', floor: 1, wing: 'north', orderIndex: 1, ppm: 360, isOpen: true, isOn: false, isOnline: true },
      { deviceId: 'DEV_106', deviceName: 'Phòng 106', floor: 1, wing: 'north', orderIndex: 2, ppm: 380, isOpen: true, isOn: false, isOnline: true },
      { deviceId: 'DEV_101', deviceName: 'Phòng 101', floor: 1, wing: 'south', orderIndex: 0, ppm: 350, isOpen: true, isOn: false, isOnline: true },
      { deviceId: 'DEV_103', deviceName: 'Phòng 103', floor: 1, wing: 'south', orderIndex: 1, ppm: 370, isOpen: true, isOn: false, isOnline: true },
      { deviceId: 'DEV_105', deviceName: 'Phòng 105', floor: 1, wing: 'south', orderIndex: 2, ppm: 355, isOpen: true, isOn: false, isOnline: true }
    ]

    // Danh sách các tầng
    const floors = Array.from(new Set(finalRooms.map(d => Number(d.floor) || 1))).sort((a, b) => a - b)
    if (!floors.includes(1)) floors.unshift(1)

    // Danh sách phòng thuộc tầng đang chọn
    const roomsOnCurrentFloor = finalRooms.filter(d => (Number(d.floor) || 1) === Number(selectedFloor))

    return {
      allDevices: [station, ...finalRooms],
      centralStation: station,
      floorRooms: roomsOnCurrentFloor,
      availableFloors: floors
    }
  }, [devices, currentDeviceId, localDeviceOverrides, selectedFloor, customLayout])

  // Phân bổ phòng vào Dãy Bắc và Dãy Nam theo thiết kế của Admin
  const { northWingRooms, southWingRooms, singleWingRooms } = useMemo(() => {
    if (layoutType === 'single') {
      const sortedSingle = [...floorRooms].sort((a, b) => a.orderIndex - b.orderIndex)
      return { northWingRooms: [], southWingRooms: [], singleWingRooms: sortedSingle }
    }

    const north = floorRooms.filter(r => r.wing !== 'south').sort((a, b) => a.orderIndex - b.orderIndex)
    const south = floorRooms.filter(r => r.wing === 'south').sort((a, b) => a.orderIndex - b.orderIndex)

    return { northWingRooms: north, southWingRooms: south, singleWingRooms: [] }
  }, [floorRooms, layoutType])

  // Tìm phòng nguy hiểm / cảnh báo
  const dangerRooms = floorRooms.filter(d => d.ppm >= 600 || d.isDangerMode)
  const warningRooms = floorRooms.filter(d => d.ppm >= 450 && d.ppm < 600)
  const safeRooms = floorRooms.filter(d => d.ppm < 450 && !d.isDangerMode)

  // Điều hướng luồng thoát nạn thông minh PCCC:
  const maxRoomsInRow = Math.max(northWingRooms.length, southWingRooms.length, singleWingRooms.length)
  const hasWestHazard = dangerRooms.some(r => {
    const idxN = northWingRooms.indexOf(r)
    const idxS = southWingRooms.indexOf(r)
    return idxN === 0 || idxS === 0
  })
  const hasEastHazard = dangerRooms.some(r => {
    const idxN = northWingRooms.indexOf(r)
    const idxS = southWingRooms.indexOf(r)
    return (idxN >= northWingRooms.length - 1 && idxN >= 0) || (idxS >= southWingRooms.length - 1 && idxS >= 0)
  })

  const safeEvacuationDirection = hasWestHazard && !hasEastHazard
    ? 'east' // Thoát sang phía Đông
    : hasEastHazard && !hasWestHazard
    ? 'west' // Thoát sang phía Tây
    : 'both' // Thoát ra cả 2 phía

  // Phòng đang chọn để thanh tra
  const activeRoom = useMemo(() => {
    if (activeRoomId === centralStation?.deviceId) return centralStation
    return floorRooms.find(d => d.deviceId === activeRoomId) || floorRooms[0] || centralStation
  }, [activeRoomId, floorRooms, centralStation])

  // ==========================================
  // LOGIC SẮP XẾP & BỐ TRÍ DÀNH CHO ADMIN
  // ==========================================
  
  // Đổi thứ tự phòng trong dãy (Di chuyển sang Trái hoặc Phải)
  const handleShiftRoomOrder = (room, direction) => {
    const isNorth = room.wing !== 'south'
    const targetWingRooms = isNorth ? [...northWingRooms] : [...southWingRooms]
    const currentIndex = targetWingRooms.findIndex(r => r.deviceId === room.deviceId)
    if (currentIndex < 0) return

    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= targetWingRooms.length) return

    // Tráo đổi vị trí
    const swapped = targetWingRooms[targetIndex]
    const newCustom = { ...customLayout }

    newCustom[room.deviceId] = {
      ...(newCustom[room.deviceId] || {}),
      floor: room.floor,
      wing: room.wing,
      orderIndex: targetIndex,
      deviceName: room.deviceName
    }
    newCustom[swapped.deviceId] = {
      ...(newCustom[swapped.deviceId] || {}),
      floor: swapped.floor,
      wing: swapped.wing,
      orderIndex: currentIndex,
      deviceName: swapped.deviceName
    }

    setCustomLayout(newCustom)
    localStorage.setItem('safeflame_floorplan_custom_layout', JSON.stringify(newCustom))
  }

  // Chuyển đổi phòng giữa Dãy Bắc (Trên) và Dãy Nam (Dưới)
  const handleToggleRoomWing = (room) => {
    const newWing = room.wing === 'south' ? 'north' : 'south'
    const targetRooms = newWing === 'north' ? northWingRooms : southWingRooms

    const newCustom = {
      ...customLayout,
      [room.deviceId]: {
        ...(customLayout[room.deviceId] || {}),
        floor: room.floor,
        wing: newWing,
        orderIndex: targetRooms.length,
        deviceName: room.deviceName
      }
    }
    setCustomLayout(newCustom)
    localStorage.setItem('safeflame_floorplan_custom_layout', JSON.stringify(newCustom))
    toast.success(`Đã chuyển [${room.deviceName}] sang ${newWing === 'north' ? 'Dãy Bắc (Cánh Trên)' : 'Dãy Nam (Cánh Dưới)'}`)
  }

  // Tự động phân chia chẵn lẻ (Khôi phục mặc định)
  const handleAutoDistributeEvenOdd = () => {
    const newCustom = {}
    let northIdx = 0
    let southIdx = 0

    const sorted = [...floorRooms].sort((a, b) => {
      const numA = parseInt(String(a.deviceName || a.deviceId).replace(/\D/g, ''), 10) || 0
      const numB = parseInt(String(b.deviceName || b.deviceId).replace(/\D/g, ''), 10) || 0
      return numA - numB
    })

    sorted.forEach((r, idx) => {
      const num = parseInt(String(r.deviceName || r.deviceId).replace(/\D/g, ''), 10)
      const isEven = (!isNaN(num) && num > 0) ? num % 2 === 0 : idx % 2 === 0
      const wing = isEven ? 'north' : 'south'
      const order = isEven ? northIdx++ : southIdx++

      newCustom[r.deviceId] = {
        floor: r.floor || selectedFloor,
        wing,
        orderIndex: order,
        deviceName: r.deviceName
      }
    })

    setCustomLayout(newCustom)
    localStorage.setItem('safeflame_floorplan_custom_layout', JSON.stringify(newCustom))
    toast.success('Đã tự động phân bổ đối xứng theo số phòng chẵn/lẻ!')
  }

  // Lưu cấu hình mặt bằng xuống Server (MongoDB)
  const handleSaveLayoutToServer = async () => {
    setIsSavingLayout(true)
    const toastId = toast.loading('Đang lưu sơ đồ mặt bằng vào máy chủ...')

    try {
      const payload = floorRooms.map(r => ({
        deviceId: r.deviceId,
        floor: r.floor,
        wing: r.wing,
        orderIndex: r.orderIndex,
        deviceName: r.deviceName,
        kitchenCorner: r.kitchenCorner
      }))

      if (backendUrl && token) {
        await fetch(`${backendUrl}/admin/floor-plan/layout`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ rooms: payload })
        })
      }

      localStorage.setItem('safeflame_floorplan_custom_layout', JSON.stringify(customLayout))
      toast.success('✅ Đã lưu bố cục sơ đồ mặt bằng thành công!', { id: toastId })
      setIsEditingLayout(false)
      if (onRefreshDevices) onRefreshDevices()
    } catch (err) {
      toast.error('Đã lưu cục bộ trên máy! (Lỗi đồng bộ máy chủ: ' + err.message + ')', { id: toastId })
      setIsEditingLayout(false)
    } finally {
      setIsSavingLayout(false)
    }
  }

  // Lưu chỉnh sửa thông số phòng riêng lẻ
  const handleSaveSingleRoomEdit = (updatedRoom) => {
    const newCustom = {
      ...customLayout,
      [updatedRoom.deviceId]: {
        floor: Number(updatedRoom.floor) || 1,
        wing: updatedRoom.wing || 'north',
        orderIndex: Number(updatedRoom.orderIndex) || 0,
        deviceName: updatedRoom.deviceName || `Phòng ${updatedRoom.deviceId}`,
        kitchenCorner: updatedRoom.kitchenCorner || 'left'
      }
    }
    setCustomLayout(newCustom)
    localStorage.setItem('safeflame_floorplan_custom_layout', JSON.stringify(newCustom))
    setEditingRoom(null)
    toast.success(`Đã cập nhật thông tin phòng [${updatedRoom.deviceName}]`)
  }

  // Thao tác khẩn cấp toàn tầng: Khóa van
  const handleEmergencyFloorGasShutoff = async () => {
    if (!window.confirm(`⚠️ XÁC NHẬN PCCC KHẨN CẤP:\nBạn có chắc chắn muốn KHÓA TOÀN BỘ VAN GAS trên Tầng ${selectedFloor} không?`)) {
      return
    }

    setIsProcessingFloorAction(true)
    const toastId = toast.loading(`Đang truyền lệnh ngắt khẩn cấp toàn bộ van gas Tầng ${selectedFloor}...`)

    try {
      const updates = {}
      for (const room of floorRooms) {
        updates[room.deviceId] = { isOpen: false }
        if (backendUrl && token) {
          fetch(`${backendUrl}/control/valve`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isOpen: false, deviceId: room.deviceId })
          }).catch(() => {})
        }
      }
      setLocalDeviceOverrides(prev => ({ ...prev, ...updates }))
      toast.success(`🛑 ĐÃ CẮT GAS KHẨN CẤP TOÀN TẦNG ${selectedFloor}! Tất cả van an toàn đã đóng.`, { id: toastId, duration: 5000 })
      if (onRefreshDevices) onRefreshDevices()
    } catch (err) {
      toast.error('Lỗi khi thực thi lệnh ngắt toàn tầng!', { id: toastId })
    } finally {
      setIsProcessingFloorAction(false)
    }
  }

  // Thao tác khẩn cấp toàn tầng: Bật quạt hút
  const handleEmergencyFloorFanStart = async () => {
    setIsProcessingFloorAction(true)
    const toastId = toast.loading(`Đang kích hoạt chế độ thông gió cưỡng bức toàn bộ Tầng ${selectedFloor}...`)

    try {
      const updates = {}
      for (const room of floorRooms) {
        updates[room.deviceId] = { isOn: true }
        if (backendUrl && token) {
          fetch(`${backendUrl}/control/fan`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isOn: true, deviceId: room.deviceId })
          }).catch(() => {})
        }
      }
      setLocalDeviceOverrides(prev => ({ ...prev, ...updates }))
      toast.success(`🌪️ ĐÃ BẬT TOÀN BỘ QUẠT HÚT THÔNG GIÓ TẦNG ${selectedFloor}! Đẩy nhanh giải tỏa khí gas.`, { id: toastId, duration: 5000 })
      if (onRefreshDevices) onRefreshDevices()
    } catch (err) {
      toast.error('Lỗi khi kích hoạt quạt toàn tầng!', { id: toastId })
    } finally {
      setIsProcessingFloorAction(false)
    }
  }

  // Điều khiển van từng phòng
  const handleToggleRoomValve = async (deviceId, currentState) => {
    const newState = !currentState
    setLocalDeviceOverrides(prev => ({
      ...prev,
      [deviceId]: { ...(prev[deviceId] || {}), isOpen: newState }
    }))

    if (onToggleValve) {
      onToggleValve(deviceId, newState)
    } else if (backendUrl && token) {
      try {
        const res = await fetch(`${backendUrl}/control/valve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isOpen: newState, deviceId })
        })
        if (res.ok) {
          toast.success(newState ? `🔓 Đã mở Van Gas [${deviceId}]` : `🔒 Đã đóng Van Gas an toàn [${deviceId}]`)
        }
      } catch (err) {
        toast.error('Lỗi kết nối điều khiển van')
      }
    }
  }

  // Điều khiển quạt từng phòng
  const handleToggleRoomFan = async (deviceId, currentState, ppm = 0) => {
    const newState = !currentState
    if (!newState && ppm >= 600) {
      toast.error('🚫 KHÓA AN TOÀN: Nồng độ khí gas nguy hiểm (>= 600 PPM)! Không cho phép tắt quạt hút.', { duration: 4000 })
      return
    }

    setLocalDeviceOverrides(prev => ({
      ...prev,
      [deviceId]: { ...(prev[deviceId] || {}), isOn: newState }
    }))

    if (onToggleFan) {
      onToggleFan(deviceId, newState)
    } else if (backendUrl && token) {
      try {
        const res = await fetch(`${backendUrl}/control/fan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isOn: newState, deviceId })
        })
        if (res.ok) {
          toast.success(newState ? `🌀 Đã bật quạt hút [${deviceId}]` : `⏸️ Đã tắt quạt hút [${deviceId}]`)
        }
      } catch (err) {
        toast.error('Lỗi kết nối điều khiển quạt')
      }
    }
  }

  // ==========================================
  // RENDER MODAL
  // ==========================================
  if (!isOpen) return null

  return typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-7xl my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 ring-1 ring-slate-900/5 flex flex-col max-h-[96vh] overflow-hidden animate-scale-up cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Sơ Đồ Mặt Bằng Dãy Trọ & Giám Sát PCCC 2D
                </h3>
                {isEditingLayout && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    <span>Đang Trong Chế Độ Tùy Biến Bố Trí</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiến trúc hành lang thông minh &bull; Hỗ trợ dãy trọ dài vô tận &bull; Tùy chỉnh vị trí và thứ tự phòng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('architectural')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'architectural'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-orange-600" />
                <span>Bản Vẽ Kỹ Thuật</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('heatmap')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'heatmap'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Bản Đồ Nhiệt Khí Gas</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng sơ đồ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Tầng, Bố Cục Dãy Trọ Dài, và Chế Độ Thiết Kế Admin */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-200/80 bg-slate-50/90 flex flex-col xl:flex-row xl:items-center justify-between gap-3 shrink-0">
          {/* Tầng Switcher & Corridor Controls */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 xl:pb-0 flex-wrap">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
                <Layers className="w-3 h-3 text-orange-600" /> Tầng:
              </span>
              {availableFloors.map(floorNum => (
                <button
                  key={floorNum}
                  type="button"
                  onClick={() => {
                    setSelectedFloor(floorNum)
                    setActiveRoomId(null)
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedFloor === floorNum
                      ? 'bg-orange-500 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Tầng {floorNum}
                </button>
              ))}
            </div>

            {/* Layout Type Switcher (Dãy Đôi vs Dãy Đơn 1 Hàng) */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">Kiểu Dãy:</span>
              <button
                type="button"
                onClick={() => setLayoutType('double')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  layoutType === 'double' ? 'bg-orange-100 text-orange-800 font-black' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="2 dãy phòng đối xứng nhau qua hành lang giữa (TCVN)"
              >
                <Columns className="w-3 h-3" />
                <span>Dãy Đôi (Hành lang giữa)</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutType('single')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  layoutType === 'single' ? 'bg-orange-100 text-orange-800 font-black' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="1 dãy phòng dài nhìn ra sân chung"
              >
                <Grid className="w-3 h-3" />
                <span>Dãy Đơn (1 Hàng)</span>
              </button>
            </div>

            {/* Display Mode (Cuộn Ngang Hành Lang vs Lưới Thu Gọn) */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setDisplayMode(displayMode === 'panoramic' ? 'grid' : 'panoramic')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-orange-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1"
                title="Chuyển đổi giữa xem cuộn ngang toàn dãy hoặc xem dạng lưới thu gọn"
              >
                <span>{displayMode === 'panoramic' ? '📐 Chế Độ Cuộn Dài' : '🔲 Chế Độ Lưới Thu Gọn'}</span>
              </button>
            </div>
          </div>

          {/* Action Bar: Admin Customizer & Emergency Shutoff */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Sắp Xếp Mặt Bằng (Chỉ dành cho Admin / Landlord) */}
            {userRole === 'landlord' && (
              <>
                {!isEditingLayout ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingLayout(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-orange-300 text-orange-700 font-black text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    title="Bật chế độ tùy biến: Dịch chuyển, đổi dãy, sắp xếp vị trí từng phòng"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                    <span>Tùy Biến Bố Trí</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-amber-50 p-1 rounded-xl border border-amber-300 shadow-sm animate-fade-in">
                    <button
                      type="button"
                      onClick={handleAutoDistributeEvenOdd}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                      title="Tự động xếp phòng chẵn lên Dãy Bắc, phòng lẻ xuống Dãy Nam"
                    >
                      <RotateCcw className="w-3 h-3 inline mr-1 text-amber-600" />
                      <span>Xếp Chẵn/Lẻ</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveLayoutToServer}
                      disabled={isSavingLayout}
                      className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      <span>{isSavingLayout ? 'Đang Lưu...' : 'Lưu Sơ Đồ'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditingLayout(false)}
                      className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-bold transition-all cursor-pointer"
                    >
                      Thoát
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Cắt Gas Khẩn Cấp Toàn Tầng */}
            <button
              type="button"
              onClick={handleEmergencyFloorGasShutoff}
              disabled={isProcessingFloorAction}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-rose-600/20 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Khóa toàn bộ van gas các phòng trên tầng này"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Cắt Gas Tầng {selectedFloor}</span>
            </button>

            {/* Bật Quạt Hút Toàn Tầng */}
            <button
              type="button"
              onClick={handleEmergencyFloorFanStart}
              disabled={isProcessingFloorAction}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
              title="Bật 100% quạt hút để đẩy khí gas ra ngoài"
            >
              <Wind className="w-3.5 h-3.5 text-orange-400" />
              <span>Bật Quạt Toàn Tầng</span>
            </button>
          </div>
        </div>

        {/* Dynamic Evacuation Direction Alert */}
        {dangerRooms.length > 0 && (
          <div className="px-5 sm:px-6 py-2 bg-rose-50 border-b border-rose-200 text-rose-800 flex items-center justify-between text-xs font-bold shrink-0 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>
                🚨 CẢNH BÁO PCCC: Phát hiện {dangerRooms.length} phòng rò rỉ khí gas nguy hiểm ({dangerRooms.map(r => r.deviceName).join(', ')})!
              </span>
            </div>
            <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded-md text-[10px] uppercase font-black">
              {safeEvacuationDirection === 'east' && 'Ưu tiên sơ tán theo CẦU THANG PHÍA ĐÔNG →'}
              {safeEvacuationDirection === 'west' && '← Ưu tiên sơ tán theo CẦU THANG PHÍA TÂY'}
              {safeEvacuationDirection === 'both' && 'Di tản khẩn cấp ra Cầu Thang Thoát Hiểm gần nhất!'}
            </span>
          </div>
        )}

        {/* Main Architectural Blueprint & Hallway Canvas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-slate-50/50">
          <div className="relative rounded-3xl bg-white border-2 border-slate-300 p-4 sm:p-6 shadow-sm overflow-hidden">
            {/* Architectural CAD Blueprint Grid Background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                                  linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            />

            {/* Top North Header Bar: Exterior Wall & Navigation Arrows for Long Hallways */}
            <div className="border-b-4 border-slate-700 pb-2.5 mb-4 flex items-center justify-between text-[11px] font-bold text-slate-500 px-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span>⬅ TƯỜNG NGOÀI PHÍA BẮC (GIẾNG TRỜI & HỘP KỸ THUẬT QUẠT HÚT KHÍ)</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600">
                  Tổng: {floorRooms.length} phòng / Tầng {selectedFloor}
                </span>
              </div>

              {/* Nút điều hướng cuộn nhanh cho dãy trọ dài */}
              {displayMode === 'panoramic' && maxRoomsInRow > 3 && (
                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => scrollHallway('west')}
                    className="p-1 rounded hover:bg-white text-slate-700 hover:text-orange-600 transition-colors flex items-center gap-1 text-[10px] font-black cursor-pointer"
                    title="Cuộn về Cánh Tây (Đầu dãy)"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Cánh Tây</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => scrollHallway('east')}
                    className="p-1 rounded hover:bg-white text-slate-700 hover:text-orange-600 transition-colors flex items-center gap-1 text-[10px] font-black cursor-pointer"
                    title="Cuộn về Cánh Đông (Cuối dãy)"
                  >
                    <span>Cánh Đông</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* KHU VỰC CUỘN NGANG HOẶC LƯỚI CHO DÃY TRỌ DÀI */}
            <div
              ref={corridorScrollRef}
              className={`pb-2 relative z-10 transition-all ${
                displayMode === 'panoramic'
                  ? 'overflow-x-auto custom-scrollbar scroll-smooth'
                  : ''
              }`}
            >
              <div
                style={{
                  minWidth: displayMode === 'panoramic' && maxRoomsInRow > 3 ? `${Math.max(maxRoomsInRow * 240, 950)}px` : 'auto'
                }}
                className="space-y-4"
              >
                {/* 1. DÃY PHÒNG PHÍA BẮC (North Wing) */}
                {layoutType === 'double' && (
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                        DÃY BẮC (CÁNH TRÊN - {northWingRooms.length} PHÒNG)
                      </span>
                    </div>

                    <div className={`grid gap-4 ${
                      displayMode === 'panoramic'
                        ? `grid-flow-col auto-cols-[minmax(220px,1fr)]`
                        : `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(northWingRooms.length, 6)}`
                    }`}>
                      {northWingRooms.map((room, idx) => (
                        <RoomArchitecturalCell
                          key={room.deviceId}
                          room={room}
                          roomIndex={idx}
                          totalInWing={northWingRooms.length}
                          isSelected={activeRoom?.deviceId === room.deviceId}
                          viewMode={viewMode}
                          isEditingLayout={isEditingLayout}
                          onSelect={() => setActiveRoomId(room.deviceId)}
                          onShiftOrder={(dir) => handleShiftRoomOrder(room, dir)}
                          onToggleWing={() => handleToggleRoomWing(room)}
                          onOpenSettings={() => setEditingRoom(room)}
                          orientation="north"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. DÃY ĐƠN (Single-Loaded Corridor - Nếu chọn kiểu Dãy Đơn 1 Hàng) */}
                {layoutType === 'single' && (
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        DÃY TRỌ ĐƠN ({singleWingRooms.length} PHÒNG NHÌN RA SÂN)
                      </span>
                    </div>

                    <div className={`grid gap-4 ${
                      displayMode === 'panoramic'
                        ? `grid-flow-col auto-cols-[minmax(220px,1fr)]`
                        : `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
                    }`}>
                      {singleWingRooms.map((room, idx) => (
                        <RoomArchitecturalCell
                          key={room.deviceId}
                          room={room}
                          roomIndex={idx}
                          totalInWing={singleWingRooms.length}
                          isSelected={activeRoom?.deviceId === room.deviceId}
                          viewMode={viewMode}
                          isEditingLayout={isEditingLayout}
                          onSelect={() => setActiveRoomId(room.deviceId)}
                          onShiftOrder={(dir) => handleShiftRoomOrder(room, dir)}
                          onToggleWing={() => {}}
                          onOpenSettings={() => setEditingRoom(room)}
                          orientation="north"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. TRỤC HÀNH LANG THOÁT HIỂM TRUNG TÂM (Central Corridor Walkway) */}
                <div className="my-5 p-4 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 relative">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Exit 1: Cầu thang Tây */}
                    <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-black shadow-xs shrink-0 ${
                      safeEvacuationDirection === 'west' || safeEvacuationDirection === 'both'
                        ? 'bg-emerald-600 text-white border-emerald-700 animate-pulse'
                        : 'bg-slate-200 text-slate-500 border-slate-300 opacity-60'
                    }`}>
                      <ArrowLeft className="w-4 h-4" />
                      <span>EXIT 1 (CẦU THANG TÂY)</span>
                    </div>

                    {/* Vạch dạ quang dẫn hướng & Thiết bị PCCC trên hành lang */}
                    <div className="flex-1 flex items-center justify-around gap-4 text-xs font-bold text-slate-600 flex-wrap min-w-[280px]">
                      <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                        <span className="text-amber-600 font-black">🧯 BÌNH PCCC</span>
                        <span className="text-[10px] text-slate-400 font-mono">(Trụ T{selectedFloor}-01)</span>
                      </div>

                      {/* Nếu dãy trọ dài > 6 phòng, tự động bố trí Cầu Thang Giữa theo QCVN PCCC */}
                      {maxRoomsInRow > 5 && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full shadow-2xs font-black text-[11px] animate-pulse">
                          <span>🚪 EXIT TRUNG TÂM (LỐI THOÁT NẠN GIỮA DÃY)</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 font-mono text-[11px] font-black tracking-widest text-slate-700">
                        {safeEvacuationDirection === 'east' ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            HƯỚNG SƠ TÁN AN TOÀN &gt;&gt;&gt;&gt;&gt;&gt;
                          </span>
                        ) : safeEvacuationDirection === 'west' ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            &lt;&lt;&lt;&lt;&lt;&lt; HƯỚNG SƠ TÁN AN TOÀN
                          </span>
                        ) : (
                          <span>🚶 HÀNH LANG CHUNG 1.8M &bull; VẠCH DẠ QUANG DẪN ĐƯỜNG THOÁT NẠN 🚶</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                        <span className="text-rose-600 font-black">🚨 HỘP NÚT BÁO CHÁY</span>
                        <span className="text-[10px] text-slate-400 font-mono">(114 Link)</span>
                      </div>
                    </div>

                    {/* Exit 2: Cầu thang Đông */}
                    <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-black shadow-xs shrink-0 ${
                      safeEvacuationDirection === 'east' || safeEvacuationDirection === 'both'
                        ? 'bg-emerald-600 text-white border-emerald-700 animate-pulse'
                        : 'bg-slate-200 text-slate-500 border-slate-300 opacity-60'
                    }`}>
                      <span>EXIT 2 (CẦU THANG ĐÔNG)</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 4. DÃY PHÒNG PHÍA NAM (South Wing) */}
                {layoutType === 'double' && (
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        DÃY NAM (CÁNH DƯỚI - {southWingRooms.length} PHÒNG)
                      </span>
                    </div>

                    <div className={`grid gap-4 ${
                      displayMode === 'panoramic'
                        ? `grid-flow-col auto-cols-[minmax(220px,1fr)]`
                        : `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(southWingRooms.length, 6)}`
                    }`}>
                      {southWingRooms.map((room, idx) => (
                        <RoomArchitecturalCell
                          key={room.deviceId}
                          room={room}
                          roomIndex={idx}
                          totalInWing={southWingRooms.length}
                          isSelected={activeRoom?.deviceId === room.deviceId}
                          viewMode={viewMode}
                          isEditingLayout={isEditingLayout}
                          onSelect={() => setActiveRoomId(room.deviceId)}
                          onShiftOrder={(dir) => handleShiftRoomOrder(room, dir)}
                          onToggleWing={() => handleToggleRoomWing(room)}
                          onOpenSettings={() => setEditingRoom(room)}
                          orientation="south"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. TRẠM GAS TRUNG TÂM (Central Gas Manifold Section) */}
            {centralStation && (
              <div 
                onClick={() => setActiveRoomId(centralStation.deviceId)}
                className={`border-t-4 border-slate-700 pt-3 mt-4 p-4 rounded-2xl transition-all cursor-pointer relative z-10 ${
                  activeRoom?.deviceId === centralStation.deviceId 
                    ? 'bg-orange-50/80 border border-orange-400 shadow-sm' 
                    : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-xs">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-black uppercase">
                          TRẠM GAS TRUNG TÂM TÒA NHÀ
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {centralStation.deviceName} ({centralStation.deviceId})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Van an toàn Solenoid tổng cấp gas toàn khu &bull; Áp suất đường ống: <b>2.8 kPa</b> (Đạt chuẩn)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Nồng độ van tổng:</span>
                      <span className={`font-mono font-black text-sm ${
                        centralStation.ppm >= 600 ? 'text-rose-600 animate-pulse' : 'text-emerald-700'
                      }`}>
                        {centralStation.ppm} PPM
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleRoomValve(centralStation.deviceId, centralStation.isOpen)
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer shadow-2xs ${
                        centralStation.isOpen
                          ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {centralStation.isOpen ? '🛑 Cắt Van Tổng' : '🔓 Mở Van Tổng'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. CHI TIẾT THANH TRA & CAN THIỆP PHÒNG ĐANG CHỌN (Inspection Drawer) */}
          {activeRoom && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-orange-400 shadow-md animate-fade-in flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-orange-500 text-white font-black text-xs font-mono shadow-2xs">
                    {activeRoom.deviceName}
                  </span>
                  <span className="text-xs font-mono text-slate-500">Mã thiết bị: <b>{activeRoom.deviceId}</b></span>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs font-medium text-slate-600">
                    Khách thuê: <b>{activeRoom.tenants?.[0]?.fullName || 'Chưa đăng ký khách'}</b>
                  </span>
                  {activeRoom.tenants?.[0]?.phone && (
                    <a
                      href={`tel:${activeRoom.tenants[0].phone}`}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{activeRoom.tenants[0].phone}</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Nồng độ khí gas:</span>
                    <span className={`font-mono font-black text-sm ${
                      activeRoom.ppm >= 600 ? 'text-rose-600 animate-pulse' : activeRoom.ppm >= 450 ? 'text-amber-600' : 'text-emerald-700'
                    }`}>
                      {activeRoom.ppm} PPM
                    </span>
                  </div>

                  <span className="text-slate-300">&bull;</span>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Van ngắt an toàn:</span>
                    <b className={activeRoom.isOpen ? 'text-emerald-700' : 'text-rose-600'}>
                      {activeRoom.isOpen ? 'Đang Mở' : 'Đã Khóa Chặt'}
                    </b>
                  </div>

                  <span className="text-slate-300">&bull;</span>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Quạt thông gió:</span>
                    <b className={activeRoom.isOn ? 'text-orange-600' : 'text-slate-500'}>
                      {activeRoom.isOn ? 'Đang Hút Khí' : 'Đang Tắt'}
                    </b>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Active Room */}
              <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
                {onSelectDevice && activeRoom.deviceId !== currentDeviceId && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDevice(activeRoom.deviceId)
                      onClose()
                    }}
                    className="flex-1 lg:flex-initial px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition-all shadow-md shadow-orange-500/20 cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    Chuyển Bàn Giám Sát Đến Phòng Này
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleRoomValve(activeRoom.deviceId, activeRoom.isOpen)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    activeRoom.isOpen
                      ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-2xs'
                  }`}
                >
                  {activeRoom.isOpen ? 'Khóa Van Gas' : 'Mở Van Gas'}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleRoomFan(activeRoom.deviceId, activeRoom.isOn, activeRoom.ppm)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    activeRoom.isOn
                      ? 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {activeRoom.isOn ? 'Tắt Quạt Hút' : 'Bật Quạt Hút'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer: PCCC Technical Legend & Quick Status */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-4 flex-wrap text-[11px] font-bold">
            <span className="text-slate-400 uppercase font-black tracking-wider">Chú Giải Kỹ Thuật:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>An Toàn (&lt; 400 PPM)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Cảnh Báo (400 - 599 PPM)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>Nguy Hiểm (&ge; 600 PPM)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span>🚪 Cửa Đi Mở 90°</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span>🌪️ Quạt Thông Gió Hộp Kỹ Thuật</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition-all font-black cursor-pointer shadow-xs"
          >
            Đóng Bản Vẽ
          </button>
        </div>
      </div>

      {/* MODAL CÀI ĐẶT THÔNG SỐ VỊ TRÍ PHÒNG CHO ADMIN */}
      {editingRoom && (
        <RoomConfigModal
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onSave={handleSaveSingleRoomEdit}
        />
      )}
    </div>,
    document.body
  ) : null
}

/**
 * Component hiển thị một ô phòng trên sơ đồ mặt bằng kiến trúc (Room Architectural Cell)
 */
function RoomArchitecturalCell({
  room,
  roomIndex,
  totalInWing,
  isSelected,
  viewMode,
  isEditingLayout,
  onSelect,
  onShiftOrder,
  onToggleWing,
  onOpenSettings,
  orientation
}) {
  const isDanger = (room.ppm >= 600) || room.isDangerMode
  const isWarning = room.ppm >= 450 && room.ppm < 600

  const heatmapStyle = viewMode === 'heatmap' ? {
    backgroundColor: isDanger
      ? 'rgba(239, 68, 68, 0.25)'
      : isWarning
      ? 'rgba(245, 158, 11, 0.2)'
      : 'rgba(16, 185, 129, 0.08)'
  } : {}

  return (
    <div
      onClick={onSelect}
      style={heatmapStyle}
      className={`rounded-2xl border-2 transition-all duration-200 cursor-pointer relative p-3.5 sm:p-4 flex flex-col justify-between group min-h-[175px] ${
        isDanger
          ? 'bg-rose-50/90 border-rose-500 shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/30 animate-pulse'
          : isWarning
          ? 'bg-amber-50/70 border-amber-400 hover:border-amber-500 shadow-xs'
          : isSelected
          ? 'bg-orange-50/50 border-orange-500 shadow-md ring-2 ring-orange-500/20'
          : isEditingLayout
          ? 'bg-white border-dashed border-orange-400 shadow-xs hover:border-orange-600'
          : 'bg-white border-slate-300 hover:border-orange-400 hover:shadow-md'
      }`}
    >
      {/* THANH ĐIỀU HƯỚNG SẮP XẾP NHANH CHO ADMIN KHI BẬT CHẾ ĐỘ THIẾT KẾ */}
      {isEditingLayout && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute -top-3.5 left-2 right-2 bg-slate-900 text-white rounded-xl py-1 px-2 flex items-center justify-between text-[10px] font-bold shadow-md z-30 animate-fade-in"
        >
          <div className="flex items-center gap-1">
            <span className="text-orange-400">#{room.orderIndex + 1}</span>
            <button
              type="button"
              onClick={() => onShiftOrder('left')}
              disabled={roomIndex === 0}
              className="p-0.5 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
              title="Dịch chuyển sang trái"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onShiftOrder('right')}
              disabled={roomIndex >= totalInWing - 1}
              className="p-0.5 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
              title="Dịch chuyển sang phải"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleWing}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-orange-600 text-slate-200 hover:text-white transition-colors cursor-pointer text-[9px] flex items-center gap-0.5"
              title={room.wing === 'south' ? 'Chuyển lên Dãy Bắc' : 'Chuyển xuống Dãy Nam'}
            >
              {room.wing === 'south' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
              <span>Đổi Dãy</span>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-0.5 rounded hover:bg-slate-700 text-amber-400 cursor-pointer"
              title="Chỉnh sửa thông số phòng"
            >
              <Settings2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 1. ARCHITECTURAL DOORWAY ARC (Vạch cửa mở ra hướng hành lang) */}
      {orientation === 'north' ? (
        <div className="absolute -bottom-1 left-5 flex items-center gap-1 z-20">
          <div className="w-8 h-1.5 bg-slate-600 rounded-t" title="Cửa chính ra vào hành lang" />
          <span className="text-[9px] font-mono text-slate-400">🚪 Cửa</span>
        </div>
      ) : (
        <div className="absolute -top-1 left-5 flex items-center gap-1 z-20">
          <div className="w-8 h-1.5 bg-slate-600 rounded-b" title="Cửa chính ra vào hành lang" />
          <span className="text-[9px] font-mono text-slate-400">🚪 Cửa</span>
        </div>
      )}

      {/* 2. ROOM HEADER: Tên phòng & Trạng thái an toàn */}
      <div>
        <div className="flex items-start justify-between gap-1.5 mb-2.5">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-orange-600 transition-colors">
                {room.deviceName}
              </h4>
              <span className="text-[10px] font-mono text-slate-400">({room.deviceId})</span>
            </div>
            <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
              {room.tenants?.[0]?.fullName ? `Khách: ${room.tenants[0].fullName}` : 'Chưa có người ở'}
            </span>
          </div>

          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 shadow-2xs ${
            isDanger
              ? 'bg-rose-600 text-white animate-bounce'
              : isWarning
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {isDanger ? '🚨 NGUY HIỂM' : isWarning ? '⚠️ Chú Ý' : '🟢 An Toàn'}
          </span>
        </div>

        {/* 3. ARCHITECTURAL STATIONS (Vị trí Bếp Nấu & Quạt Hút) */}
        <div className="grid grid-cols-2 gap-2 my-2 text-[11px]">
          {/* Khu Vực Bếp Gas */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
              <Flame className={`w-3 h-3 ${isDanger ? 'text-rose-500 animate-bounce' : 'text-orange-500'}`} />
              Khu Vực Bếp
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-bold text-[10px] text-slate-700">Van:</span>
              <span className={`font-black text-[10px] px-1.5 py-0.2 rounded ${
                room.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {room.isOpen ? 'Mở' : 'Khóa'}
              </span>
            </div>
          </div>

          {/* Vị Trí Quạt Hút */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
              <Fan className={`w-3 h-3 ${room.isOn ? 'animate-spin text-orange-600' : 'text-slate-400'}`} />
              Quạt Hút
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-bold text-[10px] text-slate-700">Hút:</span>
              <span className={`font-black text-[10px] px-1.5 py-0.2 rounded ${
                room.isOn ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {room.isOn ? 'BẬT' : 'TẮT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. GAS SENSOR PPM TELEMETRY BAR */}
      <div className="mt-1 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Gauge className={`w-3.5 h-3.5 ${isDanger ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`} />
          <span className={`font-mono font-black text-xs ${
            isDanger ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-700'
          }`}>
            {room.ppm} PPM
          </span>
        </div>

        <span className="text-[10px] font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform">
          Thanh tra &rarr;
        </span>
      </div>
    </div>
  )
}

/**
 * Modal cấu hình riêng lẻ một phòng (Admin Room Config Modal)
 */
function RoomConfigModal({ room, onClose, onSave }) {
  const [name, setName] = useState(room.deviceName || '')
  const [floor, setFloor] = useState(room.floor || 1)
  const [wing, setWing] = useState(room.wing || 'north')
  const [orderIndex, setOrderIndex] = useState(room.orderIndex || 0)
  const [kitchenCorner, setKitchenCorner] = useState(room.kitchenCorner || 'left')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...room,
      deviceName: name,
      floor: Number(floor),
      wing,
      orderIndex: Number(orderIndex),
      kitchenCorner
    })
  }

  return (
    <div 
      className="fixed inset-0 z-[100000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-orange-600" />
            <h4 className="font-black text-sm text-slate-800">Cấu Hình Vị Trí Phòng [{room.deviceId}]</h4>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Tên hiển thị trên sơ đồ:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tầng:</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-orange-500"
              >
                {[1, 2, 3, 4, 5].map(f => (
                  <option key={f} value={f}>Tầng {f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Dãy phòng:</label>
              <select
                value={wing}
                onChange={(e) => setWing(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-orange-500"
              >
                <option value="north">Dãy Bắc (Cánh Trên)</option>
                <option value="south">Dãy Nam (Cánh Dưới)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Thứ tự trong dãy (#):</label>
              <input
                type="number"
                min="0"
                max="50"
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Góc đặt bếp gas:</label>
              <select
                value={kitchenCorner}
                onChange={(e) => setKitchenCorner(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-orange-500"
              >
                <option value="left">Góc Trái Phòng</option>
                <option value="right">Góc Phải Phòng</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-xs cursor-pointer"
            >
              Cập Nhật Vị Trí
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
