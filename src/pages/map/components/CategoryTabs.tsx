import { useRef, useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { BUILDINGS } from '@/data/places'
import SearchIcon from '@/assets/search.svg?react'

type Props = {
  active: string
  onChange: (id: string) => void
  onSearchClick?: () => void
  hideAll?: boolean
}

export default function CategoryTabs({ active, onChange, onSearchClick, hideAll }: Props) {
  const { pathname } = useLocation()
  const bgColor = pathname === '/main' ? 'bg-cream-500' : 'bg-cream-100'

  const items = useMemo(
    () => hideAll
      ? BUILDINGS.filter(b => b.id !== '전체' && !b.noTab)
      : BUILDINGS.filter(b => !b.noTab),
    [hideAll]
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    const activeIdx = items.findIndex(b => b.id === active)
    const btn = buttonRefs.current[activeIdx]
    const container = containerRef.current
    if (!btn || !container) return

    setSliderStyle({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [active, items])

  return (
    <div className={`flex items-center gap-3 px-4 py-3 shrink-0 ${bgColor}`}>
      <div ref={containerRef} className="relative flex items-center justify-between px-1.5 py-1.5 rounded-[10px] border-[1.5px] border-cream-200 bg-cream-0 flex-1 overflow-hidden">
        {/* Sliding background */}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-[5px] bg-cream-200 transition-all duration-300 ease-in-out pointer-events-none"
          style={{ left: sliderStyle.left, width: sliderStyle.width }}
        />
        {items.map((building, i) => (
          <button
            key={building.id}
            ref={el => { buttonRefs.current[i] = el }}
            type="button"
            onClick={() => onChange(building.id)}
            className={`relative shrink px-2 py-1 rounded-[10px] text-[9px] font-semibold transition-colors z-10 whitespace-nowrap min-w-0 ${
              active === building.id ? 'text-primary-dark' : 'text-neutral-300'
            }`}
          >
            {building.label}
          </button>
        ))}
      </div>

      {onSearchClick && (
        <button
          type="button"
          onClick={onSearchClick}
          className="shrink-0 w-8 h-8 bg-cream-200 rounded-full flex items-center justify-center"
        >
          <SearchIcon />
        </button>
      )}
    </div>
  )
}
