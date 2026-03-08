import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import CategoryTabs from './components/CategoryTabs'
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

  useEffect(() => {
    localStorage.setItem('lastMapPath', location.pathname + location.search)
  }, [location])

  // Reset floor/view when building/sub changes
  useEffect(() => {
    setActiveFloor(activeCfg.floors[0]?.key ?? '1')
    setActiveView('basic')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.id, activeCfg.id])

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
    const place = PLACES.find(p => p.id === placeId)
    // Show modal even when no data — DetailModal shows "서비스 준비중" for empty content
    setSelectedPlace(place ?? { id: placeId, name: '', floor: null, category: null, images: [], notes: [] })
  }, [])

  const activeSub = activeCfg.id

  return (
    <div className="h-[calc(100dvh-61px-var(--sat))] flex flex-col overflow-hidden">
      {/* 건물 카테고리 탭 */}
      <CategoryTabs
        active={cfg.id}
        onChange={handleBuildingChange}
      />

      {/* 자연관 서브탭 (A동/B동/C동) */}
      {cfg.subs && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar shrink-0 border-b border-neutral-50 bg-cream-0">
          {cfg.subs.map(sub => (
            <button
              key={sub.id}
              type="button"
              onClick={() => navigate(`/map?building=nat&sub=${sub.id}`)}
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

      {/* 평면도 뷰어 */}
      <FloorMapViewer
        key={`${activeCfg.subId}-${safeFloor}-${safeView}`}
        cfg={activeCfg}
        floorKey={safeFloor}
        viewKey={safeView}
        onRoomClick={handleRoomClick}
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

      <DetailModal place={selectedPlace} onClose={() => setSelectedPlace(null)} showBackdrop />
    </div>
  )
}
