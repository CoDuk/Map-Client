import { useRef, useEffect, useLayoutEffect, useCallback, useState, memo } from 'react'
import type React from 'react'
import HakdukIcon from '@/assets/hakduk.svg'
import GirlIcon from '@/assets/girl.svg'
import BoyIcon from '@/assets/boy.svg'
import StairsIcon from '@/assets/stairs.svg'
import DrinkIcon from '@/assets/drink.svg'
import DrinksIcon from '@/assets/drinks.svg'
import type { BuildingMapCfg, ViewKey } from '@/data/places'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/i18n'

// Vite glob import for all floor plan SVGs (raw)
const svgModules = import.meta.glob<string>('/src/assets/*.svg', {
  query: '?raw',
  import: 'default',
})

type Transform = { scale: number; x: number; y: number; rotation: number }
type PointerMap = Map<number, { x: number; y: number }>

const MIN_SCALE = 0.5
const MAX_SCALE = 5

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function getPointerCenter(pointers: PointerMap) {
  const pts = Array.from(pointers.values())
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  }
}

function getPinchDist(pointers: PointerMap) {
  const [a, b] = Array.from(pointers.values())
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function getPinchAngle(pointers: PointerMap) {
  const [a, b] = Array.from(pointers.values())
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)
}

function getSvgFilename(subId: string, view: ViewKey, floor: string): string {
  const suffix = view === 'locker' ? '_1' : view === 'amenity' ? '_2' : ''
  return `${subId}map${floor}${suffix}.svg`
}

type Props = {
  cfg: BuildingMapCfg
  floorKey: string
  viewKey: ViewKey
  onRoomClick: (placeId: string) => void
  onBackgroundClick?: () => void
  focusPlaceId?: string
  highlightPlaceId?: string
}

const LEGEND_ITEMS: Record<ViewKey, { color?: string; borderColor?: string; icon?: string; svgIcon?: string; iconClass?: string; iconClass2?: string; labelKey: string }[]> = {
  basic: [
    { color: '#E7C9D0', labelKey: 'legend.classroom' },
    { svgIcon: GirlIcon, labelKey: 'legend.women' },
    { svgIcon: BoyIcon, labelKey: 'legend.men' },
    { svgIcon: StairsIcon, iconClass: 'w-3 h-3 ml-[-3.5px]', labelKey: 'legend.stairs' },
  ],
  locker: [
    { color: '#E7C9D0', labelKey: 'legend.lounge' },
    { color: '#C2D6F1', borderColor: '#08397A', labelKey: 'legend.locker' },
  ],
  amenity: [
    { svgIcon: DrinkIcon, iconClass2: 'w-3 h-3', labelKey: 'legend.water' },
    { svgIcon: DrinksIcon, iconClass2: 'w-3 h-3', labelKey: 'legend.vending' },
  ],
}

function FloorMapViewer({ cfg, floorKey, viewKey, onRoomClick, onBackgroundClick, focusPlaceId, highlightPlaceId }: Props) {
  const { lang } = useLanguage()
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0, rotation: 0 })
  const pointersRef = useRef<PointerMap>(new Map())
  const pointerStartRef = useRef<PointerMap>(new Map())
  const lastPinchDistRef = useRef<number | null>(null)
  const lastPinchAngleRef = useRef<number | null>(null)
  const hasDraggedRef = useRef(false)
  const highlightedElsRef = useRef<Element[]>([])
  const centeredForRef = useRef<string | undefined>(undefined)

  // Load SVG when cfg/floor/view changes
  useEffect(() => {
    const filename = getSvgFilename(cfg.subId, viewKey, floorKey)
    const key = `/src/assets/${filename}`
    const loader = svgModules[key]
    let cancelled = false

    async function loadSvg() {
      setLoading(true)
      if (!loader) {
        if (!cancelled) { setSvgContent(null); setLoading(false) }
        return
      }
      try {
        const svg = await loader()
        if (!cancelled) { setSvgContent(svg); setLoading(false) }
      } catch {
        if (!cancelled) { setSvgContent(null); setLoading(false) }
      }
    }

    loadSvg()
    return () => { cancelled = true }
  }, [cfg.subId, viewKey, floorKey])

  // Reset pointer state whenever floor/building/view changes
  useEffect(() => {
    pointersRef.current.clear()
    lastPinchDistRef.current = null
    lastPinchAngleRef.current = null
    hasDraggedRef.current = false
  }, [cfg.subId, viewKey, floorKey])

  const applyTransform = useCallback((t: Transform) => {
    if (!svgRef.current || !svgRef.current.isConnected) {
      svgRef.current = containerRef.current?.querySelector<SVGSVGElement>('svg') ?? null
    }
    const svg = svgRef.current
    if (!svg) return
    svg.style.transformOrigin = '0 0'
    svg.style.transform = `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})`
  }, [])

  // Wire up the SVG ref and (re)apply the tracked transform after every
  // render — deliberately with NO dependency array. React replaces this
  // div's children (dangerouslySetInnerHTML) on some re-renders even when
  // svgContent's value is unchanged (e.g. just clicking a room, which only
  // changes highlightPlaceId), which silently drops the inline transform
  // we'd set on the old SVG node. Re-asserting it every commit is what
  // keeps the user's pan/zoom from "snapping back" to identity.
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || !svgContent) {
      svgRef.current = null
      return
    }
    const svg = container.querySelector<SVGSVGElement>('svg')
    if (!svg) return
    svgRef.current = svg
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.transformOrigin = '0 0'
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

    // A genuine, NEW focus target (search flow only) recenters the view —
    // guarded by centeredForRef so this never re-fires just because this
    // effect runs again (e.g. on the resync-only passes below). Tapping a
    // room never sets focusPlaceId, so it can never trigger this branch.
    if (focusPlaceId && focusPlaceId !== centeredForRef.current) {
      // A room can be split across multiple SVG shapes sharing the same
      // data-place-id (e.g. an L-shaped auditorium) — union their boxes so
      // we center on the whole room, not just whichever piece is first.
      const els = container.querySelectorAll(`[data-place-id="${focusPlaceId}"]`)
      if (els.length > 0) {
        // Reset to identity first — required before reading element positions
        svg.style.transform = ''
        transformRef.current = { scale: 1, x: 0, y: 0, rotation: 0 }

        // getBoundingClientRect() forces a synchronous layout flush,
        // so we get positions relative to the identity-transform SVG
        const containerRect = container.getBoundingClientRect()
        const rects = Array.from(els).map(el => el.getBoundingClientRect())
        const left = Math.min(...rects.map(r => r.left))
        const right = Math.max(...rects.map(r => r.right))
        const top = Math.min(...rects.map(r => r.top))
        const bottom = Math.max(...rects.map(r => r.bottom))
        const elCX = (left + right) / 2 - containerRect.left
        const elCY = (top + bottom) / 2 - containerRect.top
        const s = clamp(2.5, MIN_SCALE, MAX_SCALE)
        const tx = containerRect.width  / 2 - elCX * s
        // Anchor toward the upper third rather than dead-center — the detail
        // modal covers up to ~70% of the viewport from the bottom, so a
        // centered focus point often ends up hidden underneath it.
        const ty = containerRect.height * 0.3 - elCY * s
        transformRef.current = { scale: s, x: tx, y: ty, rotation: 0 }
        centeredForRef.current = focusPlaceId
      }
    } else if (!focusPlaceId) {
      centeredForRef.current = undefined
    }

    // Always (re)apply whatever transform is currently tracked — either the
    // focus transform just computed above, or the user's pre-existing
    // pan/zoom. This guarantees the DOM never silently reverts to identity
    // while transformRef still holds a different value.
    applyTransform(transformRef.current)
  })

  // Keep the currently-selected place highlighted on the map — whether it got
  // selected via search focus or a direct tap — for as long as its modal is
  // open. A room can be made of multiple SVG shapes sharing the same
  // data-place-id (e.g. an L-shaped auditorium), so all of them get the
  // class, not just the first match. No dependency array for the same
  // reason as above: the highlighted nodes can get silently swapped out by
  // an unrelated re-render, so we re-verify (cheaply) on every commit
  // instead of trusting a stale ref.
  useLayoutEffect(() => {
    const container = containerRef.current
    const targets = container && svgContent && highlightPlaceId
      ? Array.from(container.querySelectorAll(`[data-place-id="${highlightPlaceId}"]`))
      : []

    const prev = highlightedElsRef.current
    const unchanged = prev.length === targets.length && prev.every((el, i) => el === targets[i])
    if (unchanged) return

    prev.forEach(el => el.classList.remove('place-selected-highlight'))
    targets.forEach(el => el.classList.add('place-selected-highlight'))
    highlightedElsRef.current = targets
  })

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    pointerStartRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    hasDraggedRef.current = false
    if (pointersRef.current.size === 2) {
      lastPinchDistRef.current = getPinchDist(pointersRef.current)
      lastPinchAngleRef.current = getPinchAngle(pointersRef.current)
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return
    const prev = pointersRef.current.get(e.pointerId)!
    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y

    const start = pointerStartRef.current.get(e.pointerId)
    if (start) {
      const totalDx = e.clientX - start.x
      const totalDy = e.clientY - start.y
      if (totalDx * totalDx + totalDy * totalDy > 64) hasDraggedRef.current = true // 8px radius
    }

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const t = transformRef.current
    const container = containerRef.current
    if (!container) return

    if (pointersRef.current.size === 1) {
      transformRef.current = { ...t, x: t.x + dx, y: t.y + dy }
    } else if (pointersRef.current.size === 2) {
      const rect = container.getBoundingClientRect()

      const newDist = getPinchDist(pointersRef.current)
      const oldDist = lastPinchDistRef.current ?? newDist
      const scaleDelta = newDist / oldDist
      lastPinchDistRef.current = newDist

      const newAngle = getPinchAngle(pointersRef.current)
      const oldAngle = lastPinchAngleRef.current ?? newAngle
      const dAngle = newAngle - oldAngle
      lastPinchAngleRef.current = newAngle

      const center = getPointerCenter(pointersRef.current)
      const cx = center.x - rect.left
      const cy = center.y - rect.top

      const newScale = clamp(t.scale * scaleDelta, MIN_SCALE, MAX_SCALE)
      const scaleFactor = newScale / t.scale

      const rad = dAngle * (Math.PI / 180)
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const ddx = (t.x - cx) * scaleFactor
      const ddy = (t.y - cy) * scaleFactor

      transformRef.current = {
        scale: newScale,
        x: cx + ddx * cos - ddy * sin,
        y: cy + ddx * sin + ddy * cos,
        rotation: t.rotation + dAngle,
      }
    }

    applyTransform(transformRef.current)
  }, [applyTransform])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId)
    pointerStartRef.current.delete(e.pointerId)
    lastPinchDistRef.current = null
    lastPinchAngleRef.current = null
  }, [])

  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (hasDraggedRef.current) return
    const els = document.elementsFromPoint(e.clientX, e.clientY)
    const placeEl = els.find(el => el.hasAttribute('data-place-id'))
    const placeId = placeEl?.getAttribute('data-place-id')
    if (placeId) onRoomClick(placeId)
    else onBackgroundClick?.()
  }, [onRoomClick, onBackgroundClick])

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const t = transformRef.current
    const ratio = e.deltaY < 0 ? 1.1 : 0.9
    const newScale = clamp(t.scale * ratio, MIN_SCALE, MAX_SCALE)
    const scaleDiff = newScale / t.scale
    transformRef.current = {
      scale: newScale,
      x: cx - scaleDiff * (cx - t.x),
      y: cy - scaleDiff * (cy - t.y),
      rotation: t.rotation,
    }
    applyTransform(transformRef.current)
  }, [applyTransform])

  const legendItems = LEGEND_ITEMS[viewKey]

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden bg-cream-100">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
        </div>
      ) : svgContent ? (
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-hidden touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
          onWheel={onWheel}
          onDragStart={e => e.preventDefault()}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <img src={HakdukIcon} alt="준비중" className="w-25 h-auto opacity-60" />
          <p className="text-neutral-300 text-[14px] font-medium">{t('map.notReady', lang)}</p>
        </div>
      )}

      {svgContent && (
        <div className="absolute top-3 left-3 z-10 rounded-xl px-4 py-3 flex flex-col gap-1.5 border-[1.5px] border-cream-200 bg-cream-100">
          {legendItems.map(item => (
            <div key={item.labelKey} className="flex items-center gap-1.5">
              {item.color ? (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color, border: `1px solid ${item.borderColor ?? '#50001B'}` }} />
              ) : item.svgIcon ? (
                <img src={item.svgIcon} alt={t(item.labelKey, lang)} className={`${item.iconClass2 ?? item.iconClass ?? 'w-2 h-4'} shrink-0`} />
              ) : (
                <span className="w-2.5 text-center text-[10px] shrink-0 text-neutral-300">{item.icon}</span>
              )}
              <span className="text-[9px] text-neutral-300 font-medium">{t(item.labelKey, lang)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(FloorMapViewer)
