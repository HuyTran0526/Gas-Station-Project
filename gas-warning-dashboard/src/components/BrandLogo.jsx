import { Flame } from 'lucide-react'
import logoIconImg from '../assets/logo-icon.png'

export default function BrandLogo({
  theme = 'light', // 'light' | 'dark'
  size = 'md',     // 'sm' | 'md' | 'lg'
  badge = null,    // Optional badge text e.g. "Admin"
  showStatus = true,
  onClick = null,
  className = ''
}) {
  const isDark = theme === 'dark'

  // Dimensions based on size
  const sizeMap = {
    sm: {
      box: 'w-9 h-9 rounded-xl p-0.5',
      inner: 'rounded-[9px] p-0.5',
      title: 'text-base tracking-wider',
      subtitle: 'text-[9px] tracking-widest',
      flame: 'w-2 h-2',
      dot: 'w-1.5 h-1.5'
    },
    md: {
      box: 'w-10 h-10 rounded-xl p-0.5',
      inner: 'rounded-[10px] p-1',
      title: 'text-lg tracking-wider',
      subtitle: 'text-[10px] tracking-widest',
      flame: 'w-2.5 h-2.5',
      dot: 'w-2 h-2'
    },
    lg: {
      box: 'w-12 h-12 rounded-2xl p-0.5',
      inner: 'rounded-[12px] p-1.5',
      title: 'text-xl tracking-wider',
      subtitle: 'text-[11px] tracking-widest',
      flame: 'w-3 h-3',
      dot: 'w-2 h-2'
    }
  }

  const s = sizeMap[size] || sizeMap.md

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3 select-none transition-all ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-98' : ''
      } ${className}`}
    >
      {/* Flame Icon Badge with Glowing Border */}
      <div className={`${s.box} bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25 flex items-center justify-center shrink-0`}>
        <div className={`w-full h-full bg-stone-950 ${s.inner} flex items-center justify-center overflow-hidden`}>
          <img src={logoIconImg} alt="SAFE FLAME Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-brand font-black uppercase ${s.title} ${isDark ? 'text-white' : 'text-stone-900'}`}>
            SAFE FLAME
          </span>
          {showStatus && (
            <span className="relative flex items-center justify-center">
              <span className={`${s.dot} rounded-full bg-orange-500 animate-ping absolute opacity-75`} />
              <span className={`${s.dot} rounded-full bg-orange-500 relative`} />
            </span>
          )}
          {badge && (
            <span className="ml-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-orange-500 text-white shadow-xs">
              {badge}
            </span>
          )}
        </div>

        <p className={`font-brand font-extrabold uppercase ${s.subtitle} leading-none flex items-center gap-1 mt-1 ${
          isDark ? 'text-orange-400' : 'text-orange-600'
        }`}>
          <Flame className={`${s.flame} ${isDark ? 'fill-orange-400 text-orange-400' : 'fill-orange-600 text-orange-600'} shrink-0`} />
          <span>IoT Gas Safety System</span>
        </p>
      </div>
    </div>
  )
}
