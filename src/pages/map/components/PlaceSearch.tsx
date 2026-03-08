import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  searchPlaces,
  searchBuildings,
  getBuildingLabel,
  getBuildingMapCfg,
  getPlaceNavigation,
} from '@/data/places'
import type { Place, BuildingResult } from '@/data/places'

const SUGGESTIONS = ['인대', '차미리사관', 'B202', '학식당', '프린터', '샤워실', '세탁기', '흡구', '음쓰']

type Props = {
  onClose: () => void
  onSelectPlace: (place: Place) => void
}

export default function PlaceSearch({ onClose, onSelectPlace }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmed = query.trim()
  const buildingResults = trimmed ? searchBuildings(query) : []
  const placeResults = trimmed ? searchPlaces(query) : []
  const hasResults = buildingResults.length > 0 || placeResults.length > 0

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handlePlaceClick(place: Place) {
    const nav = getPlaceNavigation(place)
    if (nav) {
      navigate(nav.url, { state: { placeId: place.id, initialFloor: nav.floorKey, initialView: nav.viewKey } })
    } else {
      onSelectPlace(place)
    }
    onClose()
  }

  function handleBuildingClick(br: BuildingResult) {
    if (getBuildingMapCfg(br.id)) {
      // 층별 지도가 있는 건물: 해당 플로어맵 페이지로 이동
      const url = br.sub
        ? `/map?building=${br.id}&sub=${br.sub}`
        : `/map?building=${br.id}`
      navigate(url)
    } else {
      // 층별 지도 없는 건물: 전체 캠퍼스 지도(MainPage)로 이동
      navigate('/main')
    }
    onClose()
  }

  return (
    <div className="shrink-0 relative">
      {/* 인라인 검색 바 — 탭 영역을 대체 */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2 flex-1 px-4 py-2 rounded-full border border-neutral-100 bg-cream-0">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key !== 'Enter') return
              if (buildingResults.length > 0) handleBuildingClick(buildingResults[0])
              else if (placeResults.length > 0) handlePlaceClick(placeResults[0])
            }}
            placeholder="장소를 입력해주세요.  ex) 인대, 차124"
            className="flex-1 text-[14px] bg-transparent outline-none text-neutral-500 placeholder:text-neutral-200 min-w-0"
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="#50001B" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="#50001B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[13px] font-medium text-neutral-300"
        >
          취소
        </button>
      </div>

      {/* 플로팅 카드 */}
      <div className="absolute left-4 right-4 top-full z-30 bg-cream-0 rounded-2xl border border-neutral-100 shadow-md overflow-hidden">
        {!trimmed ? (
          /* 추천 검색어 */
          <div className="px-5 py-4">
            <p className="text-[13px] font-semibold text-neutral-400 mb-3">추천검색어</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQuery(s)}
                  className="px-3.5 py-1.5 bg-cream-100 rounded-full text-[13px] text-neutral-300 font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : !hasResults ? (
          <div className="py-6 text-center">
            <p className="text-neutral-100 text-[14px]">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <ul className="py-2 max-h-64 overflow-y-auto no-scrollbar">
            {/* 건물 결과 */}
            {buildingResults.map(br => (
              <li key={`b-${br.id}-${br.sub ?? ''}`}>
                <button
                  type="button"
                  onClick={() => handleBuildingClick(br)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-cream-200 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary-dark shrink-0 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="9" width="18" height="13" rx="1" stroke="white" strokeWidth="1.8" />
                      <path d="M9 22V13h6v9" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                      <path d="M1 9l11-7 11 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-neutral-500 truncate">{br.label}</p>
                    <p className="text-[12px] text-neutral-100 mt-0.5">건물</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-100">
                    <path d="M9 18l6-6-6-6" stroke="#C5C5C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </li>
            ))}

            {/* 장소 결과 */}
            {placeResults.map(place => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => handlePlaceClick(place)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-cream-200 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-100 shrink-0 flex items-center justify-center">
                    <span className="text-[10px] text-primary-dark font-bold">{getBuildingLabel(place).slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-neutral-500 truncate">
                      {place.name}{place.aliases && place.aliases.length > 0 && ` · ${place.aliases[0]}`}
                    </p>
                    <p className="text-[12px] text-neutral-100 mt-0.5">
                      {getBuildingLabel(place)}{place.floor ? ` · ${place.floor}` : ''}
                    </p>
                  </div>
                  {place.floor && (
                    <span className="shrink-0 px-2 py-0.5 bg-primary-dark text-white text-[11px] font-semibold rounded-full">
                      {place.floor}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
