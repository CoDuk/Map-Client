import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CategoryTabs from './CategoryTabs'
import PlaceSearch from './PlaceSearch'
import { getBuildingMapCfg } from '@/data/places'
import type { Place } from '@/data/places'

type Props = {
  active: string
  onChange: (id: string) => void
  activeSub?: string
  onSelectPlace: (place: Place) => void
  onSearchOpen?: () => void
}

export default function BuildingNavBar({ active, onChange, activeSub, onSelectPlace, onSearchOpen }: Props) {
  const navigate = useNavigate()
  const [isSearchMode, setIsSearchMode] = useState(false)
  const cfg = getBuildingMapCfg(active)

  if (isSearchMode) {
    return (
      <PlaceSearch
        onClose={() => setIsSearchMode(false)}
        onSelectPlace={onSelectPlace}
      />
    )
  }

  return (
    <>
      <CategoryTabs
        active={active}
        onChange={onChange}
        onSearchClick={() => { onSearchOpen?.(); setIsSearchMode(true) }}
      />

      {cfg?.subs && (
        <div className="flex gap-2 px-4 pt-1 pb-2 overflow-x-auto no-scrollbar shrink-0">
          {cfg.subs.map(sub => (
            <button
              key={sub.id}
              type="button"
              onClick={() => navigate(`/map?building=${active}&sub=${sub.id}`)}
              className={`shrink-0 px-4 py-1 rounded-full text-[12px] font-semibold transition-colors ${
                activeSub === sub.id
                  ? 'bg-primary-dark text-white'
                  : 'bg-cream-200 text-neutral-300'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
