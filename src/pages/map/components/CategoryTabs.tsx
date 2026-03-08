import { useRef, useEffect, useState, useMemo } from 'react'
import { BUILDINGS } from '@/data/places'

type Props = {
  active: string
  onChange: (id: string) => void
  onSearchClick?: () => void
  hideAll?: boolean
}

export default function CategoryTabs({ active, onChange, onSearchClick, hideAll }: Props) {
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
    <div className="flex items-center gap-3 px-4 py-3 shrink-0">
      <div ref={containerRef} className="relative flex items-center gap-1 px-1.5 py-1.5 rounded-full border border-neutral-100 bg-cream-0 flex-1 overflow-hidden">
        {/* Sliding background */}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-full bg-cream-200 transition-all duration-300 ease-in-out pointer-events-none"
          style={{ left: sliderStyle.left, width: sliderStyle.width }}
        />
        {items.map((building, i) => (
          <button
            key={building.id}
            ref={el => { buttonRefs.current[i] = el }}
            type="button"
            onClick={() => onChange(building.id)}
            className={`relative shrink px-3 py-1 rounded-full text-[12px] font-semibold transition-colors z-10 whitespace-nowrap min-w-0 ${
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
          className="shrink-0 w-10 h-10 bg-cream-0 border border-neutral-100 rounded-full flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-label="검색">
            <circle cx="11" cy="11" r="7" stroke="#50001B" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="#50001B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
