import { useState, useEffect } from 'react'
import type { Place } from '@/data/places'
import HakdukIcon from '@/assets/hakduk.svg'
import CloseIcon from '@/assets/close.svg'

type DayMenu = { date: string; menu: string[] }
type WeekMenu = { mon: DayMenu; tue: DayMenu; wed: DayMenu; thu: DayMenu; fri: DayMenu }
type MenuData = {
  week: { dates: string[] }
  data: Record<string, WeekMenu>
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const
const DAY_LABELS = ['월', '화', '수', '목', '금']

function cleanMenu(items: string[]): string[] {
  return items.map(s => s.replace(/^"|"$/g, '').trim()).filter(Boolean)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

type Props = {
  place: Place | null
  onClose: () => void
  showBackdrop?: boolean
  initialExpandedMenuKey?: string
}

export default function DetailModal({ place, onClose, showBackdrop, initialExpandedMenuKey }: Props) {
  const [imgIndex, setImgIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  function toggleMenu(key: string) {
    setExpandedMenus(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  useEffect(() => {
    const id = setTimeout(() => {
      setImgIndex(0)
      setPreviewOpen(false)
      setExpandedMenus(initialExpandedMenuKey ? new Set([initialExpandedMenuKey]) : new Set())
      setMenuData(null)
    }, 0)
    return () => clearTimeout(id)
  }, [place, initialExpandedMenuKey])

  useEffect(() => {
    if (!place?.menuUrl) return
    let cancelled = false
    fetch(place.menuUrl)
      .then(r => r.json())
      .then(data => { if (!cancelled) setMenuData(data) })
      .catch(() => { if (!cancelled) setMenuData(null) })
    return () => { cancelled = true }
  }, [place?.menuUrl])

  if (!place) return null

  const hasContent = place.images.length > 0 || place.notes.length > 0 || (place.directory?.length ?? 0) > 0 || !!place.menuUrl

  const shortNotes = place.notes.filter(n => !n.startsWith('※') && n.length <= 50)
  const longNotes = place.notes.filter(n => n.startsWith('※') || n.length > 25)

  return (
    <>
      {showBackdrop && (
        <div className="fixed inset-0 z-40" onClick={onClose} />
      )}
      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-cream-0 rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] pb-(--sab)">
        {/* Handle bar — tap to close */}
        <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center"
        >
          <img src={CloseIcon} alt="닫기" className="w-5 h-5" />
        </button>

        <div className="px-5 pb-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          {/* Title + tags */}
          {place.name && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <h2 className="text-[20px] font-bold text-neutral-500">
                {place.name}
                {place.aliases && place.aliases.length > 0 && (
                  <span> · {place.aliases[0]}</span>
                )}
              </h2>
              {place.floor && (
                <span className="px-2.5 py-0.5 bg-primary text-white text-[12px] font-semibold rounded-full">
                  {place.floor}
                </span>
              )}
              {place.category && (
                <span className="px-2.5 py-0.5 border border-primary text-primary text-[12px] font-semibold rounded-full">
                  {place.category}
                </span>
              )}
            </div>
          )}

          {!hasContent ? (
            /* 서비스 준비중 */
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <img src={HakdukIcon} alt="준비중" className="w-[120px] h-auto" />
              <p className="text-neutral-300 text-[14px] font-medium text-center">서비스 제공 예정입니다.</p>
            </div>
          ) : (
            <>
              {/* Image carousel */}
              {place.images.length > 0 && (
                <div className="mb-4">
                  <div
                    className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-cream-200 cursor-pointer"
                    onClick={() => setPreviewOpen(true)}
                  >
                    <img
                      src={place.images[imgIndex]}
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                    {place.images.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                        {place.images.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setImgIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              i === imgIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {place.images.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                      {place.images.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setImgIndex(i)}
                          className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                            i === imgIndex ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Directory (층별 안내) */}
              {place.directory && place.directory.length > 0 && (
                <div className="flex flex-col gap-3 mb-4">
                  {place.directory.map(({ floor, rooms }) => (
                    <div key={floor} className="flex gap-3 items-start">
                      <span className="shrink-0 px-2 rounded-[20px] bg-primary text-cream-100 text-[12px] font-normal flex items-center justify-center">
                        {floor}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rooms.map(room => (
                          <span key={room} className="px-2.5 rounded-full border border-primary text-[10px] text-primary font-normal">
                            {room}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes + menu buttons */}
              {(shortNotes.length > 0 || place.restaurants) && (
                place.restaurants ? (
                  <div className="flex flex-col gap-2 mb-3">
                    {/* Row 1: 식당 태그 + 오늘의 메뉴 버튼들 */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 rounded-full bg-primary text-cream-100 text-[12px] font-medium shrink-0">
                        식당
                      </span>
                      {place.restaurants.map(r => (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => toggleMenu(r.key)}
                          className={`px-2.5 rounded-full border text-[12px] font-medium flex items-center gap-1 transition-colors ${
                            expandedMenus.has(r.key)
                              ? 'bg-primary border-primary text-cream-100'
                              : 'border-primary text-primary'
                          }`}
                        >
                          오늘의 {r.label}
                          <span className={`transition-transform inline-block ${expandedMenus.has(r.key) ? 'rotate-90' : ''}`}>›</span>
                        </button>
                      ))}
                    </div>
                    {/* Row 2: 식당 너비만큼 공백(고정 컬럼) + 벤더 태그들(자체 flex-wrap) */}
                    {place.vendors && place.vendors.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="px-2.5 py-0.5 text-[12px] font-medium opacity-0 pointer-events-none shrink-0" aria-hidden="true">
                          식당
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {place.vendors.map((vendor, i) => (
                            <span key={i} className="px-2.5 rounded-full border border-primary text-[12px] text-primary font-medium">
                              {vendor.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {shortNotes.filter(n => n !== '식당' && !(place.vendors?.some(v => v.name === n))).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {shortNotes.filter(n => n !== '식당' && !(place.vendors?.some(v => v.name === n))).map((note, i) => (
                          <span key={i} className="px-2.5 rounded-full border border-neutral-300 text-[10px] text-neutral-300 font-normal">
                            {note}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {shortNotes.map((note, i) => (
                      <span key={i} className="px-2.5 rounded-full border border-neutral-300 text-[10px] text-neutral-300 font-normal">
                        {note}
                      </span>
                    ))}
                  </div>
                )
              )}

              {/* Menu table */}
              {place.restaurants?.map(r => {
                const todayDayIdx = new Date().getDay() // 0=일, 1=월 ... 5=금, 6=토
                const todayColIdx = todayDayIdx >= 1 && todayDayIdx <= 5 ? todayDayIdx - 1 : -1
                return expandedMenus.has(r.key) && menuData && (
                  <div key={r.key} className="mb-4 overflow-x-auto no-scrollbar">
                    <table className="w-full table-fixed text-center border-collapse text-[11px]">
                      <thead>
                        <tr>
                          {DAY_KEYS.map((day, i) => (
                            <th key={day} className={`py-1.5 font-semibold border-b border-primary rounded-t-md ${i === todayColIdx ? 'bg-primary/20 text-primary' : 'text-neutral-500'}`}>
                              {DAY_LABELS[i]}<br />
                              <span className={`text-[10px] font-normal ${i === todayColIdx ? 'text-primary/70' : 'text-neutral-100'}`}>
                                {menuData.week.dates[i] ? formatDate(menuData.week.dates[i]) : ''}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const maxRows = Math.max(...DAY_KEYS.map(d => cleanMenu(menuData.data[r.key]?.[d]?.menu ?? []).length))
                          return Array.from({ length: maxRows }).map((_, row) => (
                            <tr key={row}>
                              {DAY_KEYS.map((day, i) => {
                                const items = cleanMenu(menuData.data[r.key]?.[day]?.menu ?? [])
                                const isLast = row === maxRows - 1
                                return (
                                  <td key={day} className={`py-1 px-0.5 align-top leading-snug ${isLast ? 'pb-2' : ''} ${i === todayColIdx ? `bg-primary/20 text-primary font-medium${isLast ? ' rounded-b-md' : ''}` : 'text-neutral-300'}`}>
                                    {items[row] ?? ''}
                                  </td>
                                )
                              })}
                            </tr>
                          ))
                        })()}
                      </tbody>
                    </table>
                  </div>
                )
              })}


              {/* Long notes */}
              {longNotes.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {longNotes.map((note, i) => (
                    <li key={i} className="text-[14px] text-neutral-300 font-medium">
                      {note}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
      {/* Image lightbox preview */}
      {previewOpen && place.images.length > 0 && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center"
          onClick={() => setPreviewOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center"
          >
            <img src={CloseIcon} alt="닫기" className="w-6 h-6 brightness-0 invert" />
          </button>

          {/* Image */}
          <img
            src={place.images[imgIndex]}
            alt={place.name}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />

          {/* Prev / Next */}
          {place.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setImgIndex(i => (i - 1 + place.images.length) % place.images.length) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white text-xl"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setImgIndex(i => (i + 1) % place.images.length) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white text-xl"
              >
                ›
              </button>
              {/* Dots */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
                {place.images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={e => { e.stopPropagation(); setImgIndex(i) }}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
