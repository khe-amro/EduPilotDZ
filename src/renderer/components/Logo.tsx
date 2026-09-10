import { useState, useEffect } from 'react'
import appIcon from '../assets/icon.png'

interface LogoProps {
  collapsed: boolean
  size?: number
  schoolName?: string
}

export default function Logo({ collapsed, size = 32, schoolName }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>(schoolName || 'Edupilot')

  useEffect(() => {
    let active = true
    window.schoolApp?.settings?.get?.().then(async (res) => {
      if (!active || !res.success || !res.data) return
      const s = res.data as any
      if (s.schoolNameAr || s.schoolNameFr) {
        setDisplayName(s.schoolNameAr || s.schoolNameFr || 'Edupilot')
      }
      if (s.logoPath) {
        try {
          const imgRes = await window.schoolApp.media.getImageUrl(s.logoPath)
          if (active && imgRes.success && imgRes.data?.url) {
            setLogoUrl(imgRes.data.url)
          }
        } catch {}
      }
    }).catch(() => {})

    return () => { active = false }
  }, [schoolName])

  if (collapsed) {
    return (
      <div
        className="flex items-center justify-center rounded-xl overflow-hidden shadow-xs shrink-0 bg-white/5 p-0.5 border border-white/10"
        style={{ width: size, height: size }}
        title={displayName}
      >
        <img
          src={logoUrl || appIcon}
          alt={displayName}
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="flex items-center justify-center rounded-xl overflow-hidden shadow-xs shrink-0 bg-white/5 p-0.5 border border-white/10"
        style={{ width: size, height: size }}
      >
        <img
          src={logoUrl || appIcon}
          alt={displayName}
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white font-bold text-sm leading-tight truncate" title={displayName}>
          {displayName}
        </p>
        <p className="text-blue-400 font-semibold text-[10px] leading-tight tracking-wider uppercase">
          Commercial 2.0
        </p>
      </div>
    </div>
  )
}
