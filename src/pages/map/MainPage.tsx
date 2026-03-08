import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CategoryTabs from './components/CategoryTabs'
import CampusMap from './components/CampusMap'
import DetailModal from './components/DetailModal'
import PlaceSearch from './components/PlaceSearch'
import { PLACES, BUILDINGS, getBuildingMapCfg } from '@/data/places'
import type { Place } from '@/data/places'

export default function MainPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeBuilding, setActiveBuilding] = useState('전체')

  useEffect(() => {
    localStorage.setItem('lastMapPath', location.pathname + location.search)
  }, [location])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isSearchMode, setIsSearchMode] = useState(false)

  function handleBuildingSelect(id: string) {
    if (id === '전체') {
      setActiveBuilding('전체')
    } else if (id === 'main') {
      // 대학본부: 모달로 상세 정보 표시
      const place = PLACES.find(p => p.id === 'main_office')
      setSelectedPlace(place ?? { id: 'main_office', name: '대학본부', floor: null, category: null, images: [], notes: [] })
    } else if (getBuildingMapCfg(id)) {
      // 층별 지도가 있는 건물: 해당 건물 페이지로 이동
      navigate(`/map?building=${id}`)
    } else {
      // 그 외 건물: 서비스 준비중 모달 표시 (건물명 표시)
      const buildingInfo = BUILDINGS.find(b => b.id === id)
      setSelectedPlace({ id, name: buildingInfo?.label ?? '', floor: null, category: null, images: [], notes: [] })
    }
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
        onEmptyClick={() => setSelectedPlace(null)}
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
        showBackdrop
      />
    </div>
  )
}
