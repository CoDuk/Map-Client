import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import BuildingNavBar from './components/BuildingNavBar'
import FloorMapViewer from './components/FloorMapViewer'
import FloorViewToolbar from './components/FloorViewToolbar'
import DetailModal from './components/DetailModal'
import {
  PLACES,
  BUILDING_MAP_CONFIG,
  getBuildingMapCfg,
  getFloorViews,
} from '@/data/places'
import type { Place, ViewKey, BuildingMapCfg } from '@/data/places'

export default function MapPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const buildingId = searchParams.get('building') || 'cha'
  const subParam = searchParams.get('sub') || ''

  const cfg = getBuildingMapCfg(buildingId) ?? BUILDING_MAP_CONFIG[0]

  // For 자연관 (nat), resolve active sub-config
  const activeCfg: BuildingMapCfg = cfg.subs
    ? (cfg.subs.find(s => s.id === subParam) ?? cfg.subs[0])
    : cfg

  const [activeFloor, setActiveFloor] = useState(activeCfg.floors[0]?.key ?? '1')
  const [activeView, setActiveView] = useState<ViewKey>('basic')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [focusPlaceId, setFocusPlaceId] = useState<string | undefined>()

  useEffect(() => {
    localStorage.setItem('lastMapPath', location.pathname + location.search)
  }, [location])

  // Reset floor/view when building/sub changes
  useEffect(() => {
    setActiveFloor(activeCfg.floors[0]?.key ?? '1')
    setActiveView('basic')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.id, activeCfg.id])

  // Consume navigation state from place search (navigate to correct floor + show modal)
  useEffect(() => {
    const s = location.state as { placeId?: string; initialFloor?: string; initialView?: ViewKey } | null
    if (!s?.placeId) return
    if (s.initialFloor) setActiveFloor(s.initialFloor)
    if (s.initialView) setActiveView(s.initialView)
    const place = PLACES.find(p => p.id === s.placeId)
    setSelectedPlace(place ?? { id: s.placeId, name: '', floor: null, category: null, images: [], notes: [] })
    setFocusPlaceId(s.placeId)
    // Clear state so it doesn't re-apply on back/forward navigation
    navigate(location.pathname + location.search, { replace: true, state: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  // Validate floor/view inline — prevents stale state on first render after building switch
  const safeFloor = activeCfg.floors.some(f => f.key === activeFloor)
    ? activeFloor
    : activeCfg.floors[0]?.key ?? '1'
  const availableViews = getFloorViews(activeCfg, safeFloor)
  const safeView: ViewKey = availableViews.includes(activeView) ? activeView : 'basic'

  function handleFloorChange(floor: string) {
    setActiveFloor(floor)
    // If current view is not available on new floor, reset to basic
    if (!getFloorViews(activeCfg, floor).includes(safeView)) {
      setActiveView('basic')
    }
  }

  function handleBuildingChange(id: string) {
    if (id === '전체') navigate('/main')
    else navigate(`/map?building=${id}`)
  }

  const handleRoomClick = useCallback((placeId: string) => {
    setFocusPlaceId(undefined) // 직접 탭한 경우엔 포커스 해제
    const place = PLACES.find(p => p.id === placeId)
    // Show modal even when no data — DetailModal shows "서비스 준비중" for empty content
    setSelectedPlace(place ?? { id: placeId, name: '', floor: null, category: null, images: [], notes: [] })
  }, [])

  const activeSub = activeCfg.id

  return (
    <div className="h-[calc(100dvh-61px-var(--sat))] flex flex-col overflow-hidden">
      {/* 건물 카테고리 탭 + 자연관 서브탭 + 검색 */}
      <BuildingNavBar
        active={cfg.id}
        onChange={handleBuildingChange}
        activeSub={activeSub}
        onSelectPlace={setSelectedPlace}
      />

      {/* 평면도 뷰어 */}
      <FloorMapViewer
        key={`${cfg.id}-${activeCfg.subId}-${safeFloor}-${safeView}`}
        cfg={activeCfg}
        floorKey={safeFloor}
        viewKey={safeView}
        onRoomClick={handleRoomClick}
        focusPlaceId={focusPlaceId}
      />

      {/* 하단 툴바: 뷰 아이콘 + 층 선택 */}
      <FloorViewToolbar
        cfg={activeCfg}
        activeFloor={safeFloor}
        activeView={safeView}
        availableViews={availableViews}
        onFloorChange={handleFloorChange}
        onViewChange={setActiveView}
      />

      <DetailModal place={selectedPlace} onClose={() => { setSelectedPlace(null); setFocusPlaceId(undefined) }} showBackdrop />
    </div>
  )
}
