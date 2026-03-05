import { useState, useRef, useEffect } from 'react'
import { searchPlaces, getBuildingLabel } from '@/data/places'
import type { Place } from '@/data/places'
import CloseIcon from '@/assets/close.svg'
import SearchIcon from '@/assets/nextB.svg'

const SUGGESTIONS = ['차미리사관', '강의실', '정수기', '소파', '프린터', '자판기']

type Props = {
  onClose: () => void
  onSelectPlace: (place: Place) => void
}

export default function PlaceSearch({ onClose, onSelectPlace }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.trim() ? searchPlaces(query) : []

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-cream-100">
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-cream-0 shadow-sm shrink-0">
        <img src={SearchIcon} alt="검색" className="w-5 h-5 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="장소를 검색해보세요"
          className="flex-1 text-[15px] bg-transparent outline-none text-neutral-500 placeholder:text-neutral-100"
        />
        <button type="button" onClick={onClose} className="shrink-0">
          <img src={CloseIcon} alt="닫기" className="w-5 h-5" />
        </button>
      </div>

      {!query.trim() ? (
        /* Suggestions */
        <div className="px-4 pt-4">
          <p className="text-[12px] text-neutral-100 font-medium mb-2.5">추천 검색어</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="px-3.5 py-1.5 bg-white border border-neutral-100 rounded-full text-[13px] text-neutral-300 font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-neutral-100 text-[14px]">검색 결과가 없습니다.</p>
        </div>
      ) : (
        /* Results */
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <ul className="py-2">
            {results.map(place => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPlace(place)
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cream-200 active:bg-cream-200 transition-colors text-left"
                >
                  {/* Icon placeholder */}
                  <div className="w-10 h-10 rounded-xl bg-rose-200 shrink-0 flex items-center justify-center">
                    <span className="text-[10px] text-rose-300 font-bold">{getBuildingLabel(place).slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-neutral-500 truncate">{place.name}</p>
                    <p className="text-[12px] text-neutral-100 mt-0.5">
                      {getBuildingLabel(place)}{place.floor ? ` | ${place.floor}` : ''}
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
        </div>
      )}
    </div>
  )
}
