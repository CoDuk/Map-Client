import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CategoryTabs from './components/CategoryTabs'
import CampusMap from './components/CampusMap'
import DetailModal from './components/DetailModal'
import PlaceSearch from './components/PlaceSearch'
import type { Place } from '@/data/places'

export default function MainPage() {
  const navigate = useNavigate()
  const [activeBuilding, setActiveBuilding] = useState('전체')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isSearchMode, setIsSearchMode] = useState(false)

  function handleBuildingSelect(id: string) {
    if (id === '전체') setActiveBuilding('전체')
    else navigate(`/map?building=${id}`)
  }

  return (
    <div className="h-[calc(100dvh-61px-var(--sat))] flex flex-col overflow-hidden relative">
      {!isSearchMode && (
        <CategoryTabs active={activeBuilding} onChange={handleBuildingSelect} />
      )}

      <CampusMap
        activeBuilding={activeBuilding}
        onBuildingClick={id => handleBuildingSelect(id)}
        onSearchClick={() => setIsSearchMode(true)}
      />

      {isSearchMode && (
        <PlaceSearch
          onClose={() => setIsSearchMode(false)}
          onSelectPlace={place => setSelectedPlace(place)}
        />
      )}

      <DetailModal
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
      />
    </div>
  )
}
