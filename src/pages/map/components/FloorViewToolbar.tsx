import { useRef, useEffect, useState, useMemo } from 'react'
import type { BuildingMapCfg, ViewKey } from '@/data/places'
import LectureIcon from '@/assets/lecture.svg'
import LockerIcon from '@/assets/locker.svg'
import InformationIcon from '@/assets/information.svg'
import { FLOATING_BOTTOM_VAR } from '@/constants/layout'

type Props = {
  cfg: BuildingMapCfg
  activeFloor: string
  activeView: ViewKey
  availableViews: ViewKey[]
  onFloorChange: (floor: string) => void
  onViewChange: (view: ViewKey) => void
}

type ViewDef = { key: ViewKey; label: string; icon: string }

const VIEW_DEFS: ViewDef[] = [
  { key: 'basic', label: '기본 지도', icon: LectureIcon },
  { key: 'locker', label: '사물함', icon: LockerIcon },
  { key: 'amenity', label: '정수기/자판기', icon: InformationIcon },
]

export default function FloorViewToolbar({
  cfg,
  activeFloor,
  activeView,
  availableViews,
  onFloorChange,
  onViewChange,
}: Props) {
  const visibleViews = useMemo(
    () => VIEW_DEFS.filter(v => availableViews.includes(v.key)),
    [availableViews]
  )

  const viewContainerRef = useRef<HTMLDivElement>(null)
  const viewBtnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [viewSlider, setViewSlider] = useState({ left: 0, width: 0 })

  const floorContainerRef = useRef<HTMLDivElement>(null)
  const floorBtnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [floorSlider, setFloorSlider] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const idx = visibleViews.findIndex(v => v.key === activeView)
    const btn = viewBtnRefs.current[idx]
    if (!btn) return
    setViewSlider({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [activeView, visibleViews])

  useEffect(() => {
    const idx = cfg.floors.findIndex(f => f.key === activeFloor)
    const btn = floorBtnRefs.current[idx]
    if (!btn) return
    setFloorSlider({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [activeFloor, cfg.floors])

  // Rests at its own position, and lifts only while the detail sheet sits
  // collapsed over it (the sheet sets the variable).
  return (
    <div
      className="shrink-0 flex flex-col w-fit gap-2.5 absolute left-5 transition-[bottom] duration-[250ms] ease-out"
      style={{ bottom: `var(${FLOATING_BOTTOM_VAR}, 48px)` }}
    >
      {/* 뷰 아이콘 */}
      <div
        ref={viewContainerRef}
        className="relative inline-flex w-fit items-center gap-1 px-1.5 py-1.5 rounded-full border-[1.5px] border-cream-200 bg-cream-0"
      >
        <div
          className="absolute top-1.5 bottom-1.5 rounded-full bg-cream-200 transition-all duration-300 ease-in-out z-0"
          style={{ left: viewSlider.left, width: viewSlider.width, pointerEvents: 'none' }}
        />
        {visibleViews.map((v, i) => (
          <button
            key={v.key}
            ref={el => { viewBtnRefs.current[i] = el }}
            type="button"
            aria-label={v.label}
            onClick={() => onViewChange(v.key)}
            className="relative z-10 p-1 flex items-center justify-center rounded-full"
          >
            <img
              src={v.icon}
              alt={v.label}
              className={`w-6 h-6 transition-opacity ${activeView === v.key ? 'opacity-100' : 'opacity-30'}`}
            />
          </button>
        ))}
      </div>

      {/* 층 버튼 */}
      <div
        ref={floorContainerRef}
        className="relative w-fit flex items-center gap-0.5 px-1.5 py-1.5 rounded-full border-[1.5px] border-cream-200 bg-cream-0"
      >
        <div
          className="absolute top-1.5 bottom-1.5 rounded-full bg-cream-200 transition-all duration-300 ease-in-out z-0"
          style={{ left: floorSlider.left, width: floorSlider.width, pointerEvents: 'none' }}
        />
        {cfg.floors.map((f, i) => (
          <button
            key={f.key}
            ref={el => { floorBtnRefs.current[i] = el }}
            type="button"
            onClick={() => onFloorChange(f.key)}
            className={`relative z-10 px-2 py-1 rounded-full text-[13px] font-semibold transition-colors ${
              activeFloor === f.key ? 'text-primary-dark' : 'text-neutral-300 opacity-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
