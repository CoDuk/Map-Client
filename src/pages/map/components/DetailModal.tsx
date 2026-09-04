import { useState, useEffect, useRef } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import type { Place } from '@/data/places'
import HakdukIcon from '@/assets/hakduk.svg'
import CloseIcon from '@/assets/close.svg'
import ShareIcon from '@/assets/share.svg'
import { useLanguage } from '@/contexts/LanguageContext'
import { SHEET_PEEK_HEIGHT, setFloatingBottomRaised } from '@/constants/layout'
import { sharePlace } from '@/utils/share'
import { t, translatePlaceName } from '@/i18n'

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

// Slides a cloned edge image into view on wrap, then snaps back without
// animating so the perceived slide direction stays consistent both ways.
// `stepDir` carries the caller's intent (+1 next / -1 prev / 0 jump) since,
// for a 2-image carousel, the index values alone can't tell a wrap from a
// plain adjacent step (0 -> 1 IS 0 -> length-1).
function useLoopTrack(index: number, length: number, stepDir: 1 | -1 | 0) {
  const [track, setTrack] = useState(index + 1)
  const [animate, setAnimate] = useState(true)
  const [prevIndex, setPrevIndex] = useState(index)

  if (prevIndex !== index) {
    setPrevIndex(index)
    setAnimate(true)
    if (stepDir === 1) {
      setTrack(t => t + 1)
    } else if (stepDir === -1) {
      setTrack(t => t - 1)
    } else {
      setTrack(index + 1)
    }
  }

  function handleTransitionEnd() {
    if (track === length + 1) {
      setAnimate(false)
      setTrack(1)
    } else if (track === 0) {
      setAnimate(false)
      setTrack(length)
    }
  }

  return { track, animate, handleTransitionEnd }
}

// How much of the sheet stays on screen when collapsed — big enough to still
// be grabbable above an iOS home indicator / browser toolbar. Shared so the
// controls floating over the map can clear it.
const PEEK_HEIGHT = SHEET_PEEK_HEIGHT
const SNAP_MS = 250
// Movement past this (px) means the finger travelled, so it wasn't a tap.
const TAP_SLOP = 8
// px per ms; past this a flick wins over the midpoint rule, so a short fast
// drag settles the way it was thrown instead of springing back.
const FLICK_VELOCITY = 0.5

/**
 * Drag-to-collapse for the bottom sheet, ported from the native app: the sheet
 * slides down until only PEEK_HEIGHT shows, and settles to whichever end is
 * nearer on release.
 *
 * The offset lives in refs and is written straight to `style.transform` rather
 * than going through state: a setState per pointermove re-renders this whole
 * (large) component on every frame, which is what makes the sheet stutter and
 * lag behind the finger on iOS.
 */
function useDraggableSheet(place: Place | null) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const maxCollapseRef = useRef(0)
  const collapsedRef = useRef(false)
  const draggingRef = useRef(false)
  // True once a gesture has actually moved the sheet, so the tap handlers
  // underneath (e.g. the photo opening the lightbox) can ignore the click
  // that follows a drag.
  const movedRef = useRef(false)

  useEffect(() => {
    const sheet = sheetRef.current
    // No sheet on screen — the floating controls go back to their own resting
    // position, and so must they whenever this sheet goes away.
    if (!sheet) {
      setFloatingBottomRaised(false)
      return
    }

    function apply(y: number, animate: boolean) {
      sheet!.style.transition = animate ? `transform ${SNAP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none'
      sheet!.style.transform = `translate3d(0, ${y}px, 0)`
    }

    // A newly opened place starts expanded.
    collapsedRef.current = false
    offsetRef.current = 0
    apply(0, false)
    setFloatingBottomRaised(false)

    // Content height changes as menus expand, so the collapsed resting point
    // has to be recomputed rather than measured once.
    const observer = new ResizeObserver(() => {
      maxCollapseRef.current = Math.max(sheet.offsetHeight - PEEK_HEIGHT, 0)
      if (draggingRef.current) return
      const y = collapsedRef.current ? maxCollapseRef.current : 0
      offsetRef.current = y
      apply(y, false)
    })
    observer.observe(sheet)
    return () => {
      observer.disconnect()
      setFloatingBottomRaised(false)
    }
  }, [place])

  useEffect(() => {
    const sheet = sheetRef.current
    const handle = handleRef.current
    const content = contentRef.current
    if (!sheet || !handle) return

    let startY = 0
    let startOffset = 0
    let lastY = 0
    let lastT = 0
    let velocity = 0

    function begin(clientY: number, t: number) {
      draggingRef.current = true
      startY = lastY = clientY
      lastT = t
      velocity = 0
      startOffset = offsetRef.current
      sheet!.style.transition = 'none'
    }

    function move(clientY: number, t: number) {
      const dt = t - lastT
      if (dt > 0) velocity = (clientY - lastY) / dt
      lastY = clientY
      lastT = t
      const y = Math.min(Math.max(startOffset + (clientY - startY), 0), maxCollapseRef.current)
      if (y !== offsetRef.current) movedRef.current = true
      offsetRef.current = y
      sheet!.style.transform = `translate3d(0, ${y}px, 0)`
    }

    function end() {
      if (!draggingRef.current) return
      draggingRef.current = false
      const max = maxCollapseRef.current
      const collapse = Math.abs(velocity) > FLICK_VELOCITY ? velocity > 0 : offsetRef.current > max / 2
      const target = collapse ? max : 0
      collapsedRef.current = collapse
      offsetRef.current = target
      // Only on settle, so the floating controls make one move per gesture
      // instead of tracking every frame of the drag.
      setFloatingBottomRaised(collapse)
      sheet!.style.transition = `transform ${SNAP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
      sheet!.style.transform = `translate3d(0, ${target}px, 0)`
    }

    // Mouse only: touches go through the touch listeners below, so a single
    // finger isn't processed twice. Dragging with a mouse works from the
    // handle strip, which is what the cursor affordance points at.
    function onPointerDown(e: PointerEvent) {
      if (!e.isPrimary || e.pointerType === 'touch') return
      movedRef.current = false
      handle!.setPointerCapture(e.pointerId)
      begin(e.clientY, e.timeStamp)
    }
    function onPointerMove(e: PointerEvent) {
      if (!draggingRef.current || e.pointerType === 'touch') return
      e.preventDefault()
      move(e.clientY, e.timeStamp)
    }
    function onPointerEnd(e: PointerEvent) {
      if (e.pointerType === 'touch') return
      if (handle!.hasPointerCapture(e.pointerId)) handle!.releasePointerCapture(e.pointerId)
      end()
    }

    // Touch: listening on the whole sheet means a drag can start anywhere on
    // it, not just the handle. A vertical drag the content can't consume
    // moves the sheet — pulling down from the top collapses it, and any
    // vertical drag re-expands it while collapsed. Touch (not pointer)
    // events, because only a non-passive touchmove can actually stop iOS
    // from scrolling instead.
    let takeover: boolean | null = null
    let touchStartX = 0
    let touchStartY = 0

    function onTouchStart(e: TouchEvent) {
      takeover = null
      movedRef.current = false
      if (e.touches.length !== 1) return
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 1) return
      const y = e.touches[0].clientY
      if (takeover === null) {
        const dy = y - touchStartY
        const dx = e.touches[0].clientX - touchStartX
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        // Horizontal gestures belong to the image carousel, not the sheet.
        const vertical = Math.abs(dy) > Math.abs(dx)
        const atTop = !content || content.scrollTop <= 0
        takeover = vertical && (collapsedRef.current || (dy > 0 && atTop))
        if (!takeover) return
        begin(y, e.timeStamp)
      }
      if (!takeover) return
      e.preventDefault()
      move(y, e.timeStamp)
    }

    function onTouchEnd() {
      if (takeover) end()
      takeover = null
    }

    handle.addEventListener('pointerdown', onPointerDown)
    handle.addEventListener('pointermove', onPointerMove, { passive: false })
    handle.addEventListener('pointerup', onPointerEnd)
    handle.addEventListener('pointercancel', onPointerEnd)
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove', onTouchMove, { passive: false })
    sheet.addEventListener('touchend', onTouchEnd)
    sheet.addEventListener('touchcancel', onTouchEnd)
    return () => {
      handle.removeEventListener('pointerdown', onPointerDown)
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', onPointerEnd)
      handle.removeEventListener('pointercancel', onPointerEnd)
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove', onTouchMove)
      sheet.removeEventListener('touchend', onTouchEnd)
      sheet.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [place])

  return { sheetRef, handleRef, contentRef, movedRef }
}

type Props = {
  place: Place | null
  onClose: () => void
  showBackdrop?: boolean
  initialExpandedMenuKey?: string
}

export default function DetailModal({ place, onClose, showBackdrop, initialExpandedMenuKey }: Props) {
  const { lang } = useLanguage()
  const [imgIndex, setImgIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())
  // Shown only when the link went to the clipboard: a share sheet is its own
  // confirmation, a silent clipboard write is not.
  const [copied, setCopied] = useState(false)
  const swipeTouchX = useRef(0)
  const swipeTouchY = useRef(0)
  // A tap only counts as a tap if the finger stayed put: a carousel swipe or
  // a sheet drag that happens to end over the photo must not open the preview.
  const gestureMovedRef = useRef(false)
  const [stepDir, setStepDir] = useState<1 | -1 | 0>(0)
  const imagesLength = place?.images.length ?? 0
  const inlineTrack = useLoopTrack(imgIndex, imagesLength, stepDir)
  const previewTrack = useLoopTrack(imgIndex, imagesLength, stepDir)
  const { sheetRef, handleRef, contentRef, movedRef: sheetMovedRef } = useDraggableSheet(place)

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
      setStepDir(0)
      setImgIndex(0)
      setPreviewOpen(false)
      setExpandedMenus(initialExpandedMenuKey ? new Set([initialExpandedMenuKey]) : new Set())
      setMenuData(null)
      setCopied(false)
    }, 0)
    return () => clearTimeout(id)
  }, [place, initialExpandedMenuKey])

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

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

  const images = place.images

  function goNext() {
    setStepDir(1)
    setImgIndex(i => (i + 1) % images.length)
  }
  function goPrev() {
    setStepDir(-1)
    setImgIndex(i => (i - 1 + images.length) % images.length)
  }
  function jumpTo(i: number) {
    setStepDir(0)
    setImgIndex(i)
  }

  function onMediaTouchStart(e: ReactTouchEvent) {
    swipeTouchX.current = e.touches[0].clientX
    swipeTouchY.current = e.touches[0].clientY
    gestureMovedRef.current = false
  }

  function onMediaTouchEnd(e: ReactTouchEvent) {
    const dx = e.changedTouches[0].clientX - swipeTouchX.current
    const dy = e.changedTouches[0].clientY - swipeTouchY.current
    if (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) gestureMovedRef.current = true
    if (Math.abs(dx) < 40) return
    if (dx < 0) goNext()
    else goPrev()
  }

  async function handleShare() {
    if (!place) return
    const outcome = await sharePlace(place, translatePlaceName(place.name, lang))
    setCopied(outcome === 'copied')
  }

  // The sheet drag wins over the tap, so a drag or swipe that happens to end
  // on the photo doesn't also open the preview.
  function isTap() {
    return !gestureMovedRef.current && !sheetMovedRef.current
  }

  const hasContent = place.images.length > 0 || place.notes.length > 0 || (place.directory?.length ?? 0) > 0 || !!place.menuUrl

  const shortNotes = place.notes.filter(n => !n.startsWith('※') && n.length <= 50)
  const longNotes = place.notes.filter(n => n.startsWith('※') || n.length > 50)

  return (
    <>
      {showBackdrop && (
        <div className="fixed inset-0 z-40" onClick={onClose} />
      )}
      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-cream-0 rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] pb-(--sab) will-change-transform"
      >
        {/* Drag handle — pull down to peek at the map, up to expand.
            touch-none hands the gesture to us instead of Safari's scroller. */}
        <div ref={handleRef} className="h-7 w-full touch-none select-none cursor-grab active:cursor-grabbing" />

        {/* dvh tracks Safari's collapsing toolbar; plain vh measures the
            taller "toolbar hidden" viewport and overflows the screen. */}
        <div
          ref={contentRef}
          className="px-5 pb-6 max-h-[70vh] supports-[height:100dvh]:max-h-[70dvh] overflow-y-auto overscroll-contain no-scrollbar"
        >
          {/* Title + tags */}
          {place.name && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <h2 className="text-[20px] font-bold text-neutral-500">
                {translatePlaceName(place.name, lang)}
              </h2>
              {place.floor && (
                <span className="px-2.5 py-0.5 bg-primary text-white text-[12px] font-semibold rounded-full">
                  {place.floor}
                </span>
              )}
              {place.category && (
                <span className="px-2.5 py-0.5 border border-primary text-primary text-[12px] font-semibold rounded-full">
                  {translatePlaceName(place.category, lang)}
                </span>
              )}
              <button
                type="button"
                aria-label={t('detail.share', lang)}
                onClick={handleShare}
                className="ml-auto shrink-0 flex items-center gap-1.5 p-1"
              >
                {copied && (
                  <span className="text-[12px] font-medium text-primary-dark whitespace-nowrap">
                    {t('detail.linkCopied', lang)}
                  </span>
                )}
                <img src={ShareIcon} alt="" className="w-5 h-5" />
              </button>
            </div>
          )}

          {!hasContent ? (
            /* 서비스 준비중 */
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <img src={HakdukIcon} alt="준비중" className="w-[120px] h-auto" />
              <p className="text-neutral-300 text-[14px] font-medium text-center">{t('detail.comingSoon', lang)}</p>
            </div>
          ) : (
            <>
              {/* Image carousel */}
              {place.images.length > 0 && (
                <div className="mb-4">
                  <div
                    className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-cream-200 cursor-pointer"
                    onClick={() => { if (isTap()) setPreviewOpen(true) }}
                    onTouchStart={onMediaTouchStart}
                    onTouchEnd={onMediaTouchEnd}
                  >
                    <div
                      className={`flex h-full ${inlineTrack.animate ? 'transition-transform duration-300 ease-out' : ''}`}
                      style={{ transform: `translateX(-${inlineTrack.track * 100}%)` }}
                      onTransitionEnd={inlineTrack.handleTransitionEnd}
                    >
                      {/* The wrap clone sits at slot 0, so without an explicit
                          priority the browser would fetch an off-screen image
                          before the one actually on screen. */}
                      {[place.images[place.images.length - 1], ...place.images, place.images[0]].map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={place.name}
                          decoding="async"
                          fetchPriority={i === inlineTrack.track ? 'high' : 'low'}
                          className="w-full h-full object-cover shrink-0"
                        />
                      ))}
                    </div>
                    {place.images.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                        {place.images.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => jumpTo(i)}
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
                          onClick={() => jumpTo(i)}
                          className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                            i === imgIndex ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          <img src={src} alt="" decoding="async" fetchPriority="low" className="w-full h-full object-cover" />
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
                            {translatePlaceName(room, lang)}
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
                        {t('detail.restaurant', lang)}
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
                          {t('detail.todayMenu', lang)} {translatePlaceName(r.label, lang)}
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
                            {translatePlaceName(note, lang)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {shortNotes.map((note, i) => (
                      <span key={i} className="px-2.5 rounded-full border border-neutral-300 text-[10px] text-neutral-300 font-normal">
                        {translatePlaceName(note, lang)}
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
                      {translatePlaceName(note, lang)}
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
          onClick={() => { if (isTap()) setPreviewOpen(false) }}
          onTouchStart={onMediaTouchStart}
          onTouchEnd={onMediaTouchEnd}
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
          <div className="w-full h-[80vh] overflow-hidden">
            <div
              className={`flex h-full ${previewTrack.animate ? 'transition-transform duration-300 ease-out' : ''}`}
              style={{ transform: `translateX(-${previewTrack.track * 100}%)` }}
              onTransitionEnd={previewTrack.handleTransitionEnd}
            >
              {[place.images[place.images.length - 1], ...place.images, place.images[0]].map((src, i) => (
                <div key={i} className="w-full h-full shrink-0 flex items-center justify-center">
                  <img
                    src={src}
                    alt={place.name}
                    decoding="async"
                    fetchPriority={i === previewTrack.track ? 'high' : 'low'}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Prev / Next */}
          {place.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); goPrev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white text-xl"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); goNext() }}
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
                    onClick={e => { e.stopPropagation(); jumpTo(i) }}
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
