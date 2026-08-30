import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import BuildingNavBar from './components/BuildingNavBar'
import CampusMap from './components/CampusMap'
import DetailModal from './components/DetailModal'
import { PLACES, BUILDINGS, getBuildingMapCfg, getPlacesByBuilding } from '@/data/places'
import type { Place } from '@/data/places'

export default function MainPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [focusBuildingId, setFocusBuildingId] = useState<string | undefined>()

  useEffect(() => {
    localStorage.setItem('lastMapPath', location.pathname + location.search)
  }, [location])

  // 검색에서 navigate('/main', { state: { placeId } }) 로 넘어왔을 때 모달 표시
  useEffect(() => {
    const s = location.state as { placeId?: string } | null
    if (!s?.placeId) return
    const place = PLACES.find(p => p.id === s.placeId)
    const building = BUILDINGS.find(b => b.id === s.placeId)
    setSelectedPlace(
      place ?? { id: s.placeId, name: building?.label ?? s.placeId, floor: null, category: null, images: [], notes: [] }
    )
    // 'main_office'는 BUILDINGS에서 'main' id로 매핑
    const buildingId = s.placeId === 'main_office' ? 'main' : s.placeId
    setFocusBuildingId(buildingId)
    navigate(location.pathname, { replace: true, state: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  function handleCloseDetail() {
    setSelectedPlace(null)
    setFocusBuildingId(undefined)
  }

  function handleBuildingSelect(id: string) {
    if (id === '전체') {
      // 전체 지도 유지
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
      const places = getPlacesByBuilding(id)
      setSelectedPlace(places[0] ?? { id, name: buildingInfo?.label ?? '', floor: null, category: null, images: [], notes: [] })
    }
  }

  return (
    <div className="h-[calc(100dvh-61px-var(--sat))] flex flex-col overflow-hidden relative">
      <BuildingNavBar
        active="전체"
        onChange={handleBuildingSelect}
        onSelectPlace={setSelectedPlace}
        onSearchOpen={handleCloseDetail}
      />

      <CampusMap
        onBuildingClick={id => handleBuildingSelect(id)}
        onEmptyClick={() => setSelectedPlace(null)}
        focusBuildingId={focusBuildingId}
      />

      <DetailModal
        place={selectedPlace}
        onClose={handleCloseDetail}
        showBackdrop
      />
    </div>
  )
}
