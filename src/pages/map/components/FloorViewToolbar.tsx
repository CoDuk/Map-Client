import type { BuildingMapCfg, ViewKey } from '@/data/places'

type Props = {
  cfg: BuildingMapCfg
  activeFloor: string
  activeView: ViewKey
  availableViews: ViewKey[]
  onFloorChange: (floor: string) => void
  onViewChange: (view: ViewKey) => void
}

type ViewDef = { key: ViewKey; label: string; icon: React.ReactNode }

const VIEW_DEFS: ViewDef[] = [
  {
    key: 'basic',
    label: '기본 지도',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="12" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="2" y="12" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="12" y="12" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    key: 'locker',
    label: '사물함',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="7" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="12" y="3" width="7" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="6.5" cy="11" r="1" fill="currentColor" />
        <circle cx="15.5" cy="11" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: 'amenity',
    label: '정수기/자판기',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 3C11 3 6 8.5 6 12.5a5 5 0 0010 0C16 8.5 11 3 11 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function FloorViewToolbar({
  cfg,
  activeFloor,
  activeView,
  availableViews,
  onFloorChange,
  onViewChange,
}: Props) {
  const visibleViews = VIEW_DEFS.filter(v => availableViews.includes(v.key))

  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-cream-0 border-t border-neutral-50">
      {/* 뷰 아이콘 */}
      <div className="flex gap-2">
        {visibleViews.map(v => (
          <button
            key={v.key}
            type="button"
            aria-label={v.label}
            onClick={() => onViewChange(v.key)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
              activeView === v.key
                ? 'bg-primary-dark text-white'
                : 'bg-cream-200 text-neutral-300'
            }`}
          >
            {v.icon}
          </button>
        ))}
      </div>

      {/* 층 버튼 */}
      <div className="flex gap-1.5">
        {cfg.floors.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => onFloorChange(f.key)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
              activeFloor === f.key
                ? 'bg-primary-dark text-white'
                : 'bg-cream-200 text-neutral-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
