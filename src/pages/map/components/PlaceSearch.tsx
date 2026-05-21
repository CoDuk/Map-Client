import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  searchPlaces,
  searchBuildings,
  searchDirectoryRooms,
  searchVendors,
  searchMenus,
  getBuildingLabel,
  getBuildingMapCfg,
  getPlaceNavigation,
  BUILDINGS,
} from '@/data/places'
import type { Place, BuildingResult, DirectoryRoomResult, VendorResult, MenuResult } from '@/data/places'
import NextIcon from '@/assets/next.svg?react'
import SearchIcon from '@/assets/search.svg?react'
import LogoIcon from '@/assets/logo.svg?react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t, translatePlaceName, buildingLabel } from '@/i18n'

const SUGGESTIONS: Record<string, string[]> = {
  ko: ['인대', '차미리사관', 'B202', '학식당', '프린터', '샤워실', '세탁기', '흡구', '음쓰'],
  en: ['Humanities', 'Cha Hall', 'B202', 'Cafeteria', 'Printer', 'Shower', 'Laundry', 'Smoking', 'Food waste'],
  zh: ['인대', '차미리사관', 'B202', '食堂', '打印机', '淋浴', '洗衣机', '吸烟区', '厨余'],
  ja: ['인대', '차미리사관', 'B202', '食堂', 'プリンター', 'シャワー', 'ランドリー', '喫煙', 'ゴミ'],
}

const BUILDING_SHORT: Record<string, string> = {
  '인문사회관': '인대',
  '차미리사관': '차관',
  '자연관': '자대',
  '학생회관': '학관',
  '대강의동': '대강의동',
  '대학본부': '대학본부',
}

function getBuildingShort(place: Place) {
  const label = getBuildingLabel(place)
  return BUILDING_SHORT[label] ?? label.slice(0, 2)
}

type Props = {
  onClose: () => void
  onSelectPlace: (place: Place) => void
}

export default function PlaceSearch({ onClose, onSelectPlace }: Props) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmed = query.trim()
  const buildingResults = trimmed ? searchBuildings(query) : []
  const placeResults = trimmed ? searchPlaces(query) : []
  const directoryResults = trimmed ? searchDirectoryRooms(query) : []
  const vendorResults = trimmed ? searchVendors(query) : []
  const menuResults = trimmed ? searchMenus(query) : []
  const hasResults = buildingResults.length > 0 || placeResults.length > 0 || directoryResults.length > 0 || vendorResults.length > 0 || menuResults.length > 0

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleDirectoryRoomClick(dr: DirectoryRoomResult) {
    navigate('/main', { state: { placeId: dr.place.id } })
    onClose()
  }

  function handleVendorClick(vr: VendorResult) {
    handlePlaceClick(vr.place)
  }

  function handleMenuClick(mr: MenuResult) {
    const nav = getPlaceNavigation(mr.place)
    if (nav) {
      navigate(nav.url, { state: { placeId: mr.place.id, initialFloor: nav.floorKey, initialView: nav.viewKey, initialExpandedMenuKey: mr.key } })
    } else if (mr.place.floor === null) {
      navigate('/main', { state: { placeId: mr.place.id, initialExpandedMenuKey: mr.key } })
    }
    onClose()
  }

  function handlePlaceClick(place: Place) {
    const nav = getPlaceNavigation(place)
    if (nav) {
      navigate(nav.url, { state: { placeId: place.id, initialFloor: nav.floorKey, initialView: nav.viewKey } })
    } else if (place.floor === null) {
      navigate('/main', { state: { placeId: place.id } })
    } else {
      onSelectPlace(place)
    }
    onClose()
  }

  function handleBuildingClick(br: BuildingResult) {
    if (getBuildingMapCfg(br.id)) {
      const url = br.sub
        ? `/map?building=${br.id}&sub=${br.sub}`
        : `/map?building=${br.id}`
      navigate(url)
    } else {
      const placeId = br.id === 'main'
        ? 'main_office'
        : BUILDINGS.find(b => b.id === br.id)?.placeId
      navigate('/main', placeId ? { state: { placeId } } : undefined)
    }
    onClose()
  }

  return (
    <div className="shrink-0 relative">
      <div className="fixed inset-0 z-20 bg-black/30" onClick={onClose} />

      <div className="relative z-30 flex items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2 flex-1 px-4 py-2 rounded-[10px] border border-cream-300 bg-cream-0">
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
            placeholder={t('search.placeholder', lang)}
            className="flex-1 text-[14px] bg-transparent outline-none text-neutral-500 placeholder:text-neutral-200 min-w-0"
          />
          <SearchIcon />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[13px] font-medium text-primary-dark"
        >
          {t('search.cancel', lang)}
        </button>
      </div>

      {/* 플로팅 카드 */}
      <div className="absolute left-3 right-3 top-full z-30 bg-cream-0 rounded-[10px] border border-cream-300 shadow-md overflow-hidden">
        {!trimmed ? (
          /* 추천 검색어 */
          <div className="px-5 py-4">
            <p className="text-[13px] font-semibold text-primary-dark mb-3">{t('search.suggestions', lang)}</p>
            <div className="flex flex-wrap gap-2">
              {(SUGGESTIONS[lang] ?? SUGGESTIONS.ko).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQuery(s)}
                  className="px-3.5 py-1.5 bg-cream-200 rounded-full text-[13px] text-primary-dark font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : !hasResults ? (
          <div className="py-6 text-center">
            <p className="text-neutral-100 text-[14px]">{t('search.noResults', lang)}</p>
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
                  <LogoIcon className="w-9 h-9" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-neutral-300 truncate">{br.sub ? translatePlaceName(br.label, lang) : (buildingLabel(br.id, lang) || translatePlaceName(br.label, lang))}</p>
                  </div>
                    <NextIcon className='mr-2'/>
                </button>
              </li>
            ))}

            {/* 장소 결과 */}
            {placeResults.map(place => {
              const q = trimmed.toLowerCase()
              const directMatch =
                place.name.toLowerCase().includes(q) ||
                (place.floor?.toLowerCase().includes(q) ?? false) ||
                (place.category?.toLowerCase().includes(q) ?? false)
              const matchAlias = !directMatch ? place.aliases?.find(a => a.toLowerCase().includes(q)) : undefined
              const matchNote = !directMatch && !matchAlias ? place.notes.find(n => n.toLowerCase().includes(q)) : undefined
              const matchHint = matchAlias ? (place.notes[0] ?? undefined) : matchNote
              return (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => handlePlaceClick(place)}
                    className="w-full flex items-center gap-3 px-4 py-3 active:bg-cream-200 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-100 shrink-0 flex items-center justify-center">
                      <span className="text-[10px] text-primary-dark font-bold w-[2em] text-center break-all leading-tight">{getBuildingShort(place)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-neutral-300 truncate">
                        {translatePlaceName(place.name, lang)}
                      </p>
                      <p className="text-[12px] text-primary-dark mt-0.5 truncate">
                        {buildingLabel(place.id.replace(/\d.*/, '').replace(/[A-Z].*/, ''), lang) || translatePlaceName(getBuildingLabel(place), lang)}{place.floor ? ` · ${place.floor}` : ''}{matchHint ? <> · <span className="text-neutral-300">{translatePlaceName(matchHint, lang)}</span></> : null}
                      </p>
                    </div>
                    {place.floor && (
                      <span className="shrink-0 px-2 py-0.5 bg-primary-dark text-white text-[11px] font-semibold rounded-full">
                        {place.floor}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}

            {/* 디렉토리 룸 결과 */}
            {directoryResults.map((dr, i) => (
              <li key={`dr-${i}`}>
                <button
                  type="button"
                  onClick={() => handleDirectoryRoomClick(dr)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-cream-200 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-100 shrink-0 flex items-center justify-center">
                    <span className="text-[10px] text-primary-dark font-bold w-[2em] text-center break-all leading-tight">{getBuildingShort(dr.place)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-neutral-300 truncate">{dr.room}</p>
                    <p className="text-[12px] text-primary-dark mt-0.5">
                      {getBuildingLabel(dr.place)} · {dr.floor}
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 bg-primary-dark text-white text-[11px] font-semibold rounded-full">
                    {dr.floor}
                  </span>
                </button>
              </li>
            ))}

            {/* 식당 입점 업체 결과 */}
            {vendorResults.map((vr, i) => (
              <li key={`vr-${i}`}>
                <button
                  type="button"
                  onClick={() => handleVendorClick(vr)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-cream-200 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-100 shrink-0 flex items-center justify-center">
                    <span className="text-[10px] text-primary-dark font-bold w-[2em] text-center break-all leading-tight">{getBuildingShort(vr.place)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-neutral-300 truncate">{vr.vendor}</p>
                    <p className="text-[12px] text-primary-dark mt-0.5">
                      {translatePlaceName(vr.place.name, lang)}{vr.place.floor ? ` · ${vr.place.floor}` : ''}
                    </p>
                  </div>
                  {vr.place.floor && (
                    <span className="shrink-0 px-2 py-0.5 bg-primary-dark text-white text-[11px] font-semibold rounded-full">
                      {vr.place.floor}
                    </span>
                  )}
                </button>
              </li>
            ))}

            {/* 오늘의 메뉴 결과 */}
            {menuResults.map((mr, i) => (
              <li key={`mr-${i}`}>
                <button
                  type="button"
                  onClick={() => handleMenuClick(mr)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-cream-200 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-100 shrink-0 flex items-center justify-center">
                    <span className="text-[10px] text-primary-dark font-bold w-[2em] text-center break-all leading-tight">{getBuildingShort(mr.place)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-neutral-300 truncate">{mr.label}</p>
                    <p className="text-[12px] text-primary-dark mt-0.5">
                      {translatePlaceName(mr.place.name, lang)}{mr.place.floor ? ` · ${mr.place.floor}` : ''}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
