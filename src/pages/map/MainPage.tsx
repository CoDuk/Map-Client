import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import BuildingNavBar from './components/BuildingNavBar'
import CampusMap from './components/CampusMap'
import DetailModal from './components/DetailModal'
import { PLACES, BUILDINGS, getBuildingMapCfg, getPlacesByBuilding, getBuildingIdForPlace } from '@/data/places'
import type { Place } from '@/data/places'

export default function MainPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [focusBuildingId, setFocusBuildingId] = useState<string | undefined>()
  const [highlightBuildingId, setHighlightBuildingId] = useState<string | undefined>()

  // 검색에서 navigate('/main', { state: { placeId } }) 로 넘어왔을 때 모달 표시.
  // A shared link carries the same place in the query string instead
  // (`/main?place=lib`) — router state is gone the moment the URL is copied
  // into another app, so the link has to stand on its own.
  useEffect(() => {
    const s = location.state as { placeId?: string } | null
    const placeId = s?.placeId ?? new URLSearchParams(location.search).get('place')
    if (!placeId) return
    const place = PLACES.find(p => p.id === placeId)
    const building = BUILDINGS.find(b => b.id === placeId)
    setSelectedPlace(
      place ?? { id: placeId, name: building?.label ?? placeId, floor: null, category: null, images: [], notes: [] }
    )
    const buildingId = getBuildingIdForPlace(placeId)
    setFocusBuildingId(buildingId)
    setHighlightBuildingId(buildingId)
    // Only the state is cleared; the query string stays so the address bar
    // remains the link, and a reload still lands on the same place.
    if (s?.placeId) navigate(location.pathname + location.search, { replace: true, state: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  function handleCloseDetail() {
    setSelectedPlace(null)
    setFocusBuildingId(undefined)
    setHighlightBuildingId(undefined)
  }

  function handleBuildingSelect(id: string) {
    if (id === '전체') {
      // 전체 지도 유지
    } else if (id === 'main') {
      // 대학본부: 모달로 상세 정보 표시
      const place = PLACES.find(p => p.id === 'main_office')
      setSelectedPlace(place ?? { id: 'main_office', name: '대학본부', floor: null, category: null, images: [], notes: [] })
      setHighlightBuildingId('main')
    } else if (getBuildingMapCfg(id)) {
      // 층별 지도가 있는 건물: 해당 건물 페이지로 이동
      navigate(`/map?building=${id}`)
    } else {
      // 그 외 건물: 서비스 준비중 모달 표시 (건물명 표시)
      const buildingInfo = BUILDINGS.find(b => b.id === id)
      const places = getPlacesByBuilding(id)
      setSelectedPlace(places[0] ?? { id, name: buildingInfo?.label ?? '', floor: null, category: null, images: [], notes: [] })
      setHighlightBuildingId(id)
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
        onEmptyClick={handleCloseDetail}
        focusBuildingId={focusBuildingId}
        highlightBuildingId={highlightBuildingId}
      />

      <DetailModal
        place={selectedPlace}
        onClose={handleCloseDetail}
      />
    </div>
  )
}
