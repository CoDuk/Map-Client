import { useRef, useEffect, useLayoutEffect, useCallback, useState, memo } from 'react'
import type React from 'react'
import HakdukIcon from '@/assets/hakduk.svg'
import type { BuildingMapCfg, ViewKey } from '@/data/places'

// Vite glob import for all floor plan SVGs (raw)
const svgModules = import.meta.glob<string>('/src/assets/*.svg', {
  query: '?raw',
  import: 'default',
})

type Transform = { scale: number; x: number; y: number; rotation: number }
type PointerMap = Map<number, { x: number; y: number }>

type HotspotRect = { type: 'rect'; x: number; y: number; width: number; height: number }
type HotspotPath = { type: 'path'; d: string }
type HotspotItem = HotspotRect | HotspotPath
type HotspotData = { viewBox: string; items: Record<string, HotspotItem> }

const MIN_SCALE = 0.5
const MAX_SCALE = 5

// Building subId → public/maps folder name
const HOTSPOT_DIRS: Partial<Record<string, string>> = {
  cha: 'chagwan',
  dae: 'daegang',
}

// Module-level cache: avoid re-fetching hotspot JSON on every key-based remount
const hotspotCache = new Map<string, HotspotData | null>()

function getHotspotUrl(subId: string, floorKey: string): string | null {
  const dir = HOTSPOT_DIRS[subId]
  if (!dir) return null
  const fileFloor = floorKey.startsWith('b') ? floorKey : `${floorKey}f`
  return `/maps/${dir}/${fileFloor}.hotspots.tagged.json`
}

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
  const suffix = view === 'locker' ? 'lock' : view === 'amenity' ? 'util' : ''
  return `${subId}map${suffix}${floor}.svg`
}

type Props = {
  cfg: BuildingMapCfg
  floorKey: string
  viewKey: ViewKey
  onRoomClick: (placeId: string) => void
}

const LEGEND_ITEMS: Record<ViewKey, { color?: string; icon?: string; label: string }[]> = {
  basic: [
    { color: '#E7C9D0', label: '강의실' },
    { icon: '♀', label: '여자 화장실' },
    { icon: '♂', label: '남자 화장실' },
    { icon: '↕', label: '계단' },
  ],
  locker: [
    { icon: '☰', label: '사물함' },
  ],
  amenity: [
    { icon: '💧', label: '정수기' },
    { icon: '🥤', label: '음료자판기' },
  ],
}

function FloorMapViewer({ cfg, floorKey, viewKey, onRoomClick }: Props) {
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Initialize from cache synchronously — no async delay on re-navigation
  const [hotspots, setHotspots] = useState<HotspotData | null>(() =>
    hotspotCache.get(`${cfg.subId}-${floorKey}`) ?? null
  )

  // Track the latest touch coordinates for iOS Safari's "click" synthesis that uses last touch
  // position instead of the pointerup position, causing elementFromPoint to miss in some cases.
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)
  const lastHandledTsRef = useRef(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0, rotation: 0 })
  const pointersRef = useRef<PointerMap>(new Map())
  const lastPinchDistRef = useRef<number | null>(null)
  const lastPinchAngleRef = useRef<number | null>(null)
  const hasDraggedRef = useRef(false)
  const ignoreNextClickRef = useRef(false)

  // Load SVG when cfg/floor/view changes
  useEffect(() => {
    const filename = getSvgFilename(cfg.subId, viewKey, floorKey)
    const key = `/src/assets/${filename}`
    const loader = svgModules[key]

    let cancelled = false

    async function loadSvg() {
      setLoading(true)

      if (!loader) {
        if (!cancelled) {
          setSvgContent(null)
          setLoading(false)
        }
        return
      }

      try {
        const svg = await loader()
        if (!cancelled) {
          setSvgContent(svg)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setSvgContent(null)
          setLoading(false)
        }
      }
    }

    loadSvg()

    return () => {
      cancelled = true
    }
  }, [cfg.subId, viewKey, floorKey])

  // Load hotspot JSON when building/floor changes (view-independent)
  useEffect(() => {
    const cacheKey = `${cfg.subId}-${floorKey}`

    // Already initialized from cache via useState lazy initializer — skip fetch
    if (hotspotCache.has(cacheKey)) return

    const url = getHotspotUrl(cfg.subId, floorKey)
    let cancelled = false

    async function load() {
      if (!url) {
        if (!cancelled) { hotspotCache.set(cacheKey, null); setHotspots(null) }
        return
      }
      try {
        const r = await fetch(url)
        const data: HotspotData | null = r.ok ? await r.json() : null
        if (!cancelled) { hotspotCache.set(cacheKey, data); setHotspots(data) }
      } catch {
        if (!cancelled) { hotspotCache.set(cacheKey, null); setHotspots(null) }
      }
    }

    load()
    return () => { cancelled = true }
  }, [cfg.subId, floorKey])

  // Reset pointer state whenever floor/building/view changes to avoid stale pointer entries.
  // Do NOT null svgRef here — useEffect runs after useLayoutEffect, so nulling here would
  // clobber the ref that useLayoutEffect just set for the newly mounted SVG.
  useEffect(() => {
    pointersRef.current.clear()
    lastPinchDistRef.current = null
    lastPinchAngleRef.current = null
    hasDraggedRef.current = false
  }, [cfg.subId, viewKey, floorKey])

  // After SVG content renders, wire up the SVG ref and reset transform.
  // useLayoutEffect runs synchronously after DOM mutations so svgRef is always
  // current before the user can interact with the newly mounted content.
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
    transformRef.current = { scale: 1, x: 0, y: 0, rotation: 0 }
    svg.style.transform = ''
  }, [svgContent, cfg.subId, viewKey, floorKey])

  // Inject transparent hotspot elements into SVG for click detection
  useEffect(() => {
    if (!containerRef.current) return
    const svg = svgRef.current
    if (!svg) return

    // Remove previously injected hotspots
    svg.querySelectorAll('[data-place-id]').forEach(el => el.remove())
    if (!hotspots) return

    for (const [id, shape] of Object.entries(hotspots.items)) {
      const placeId = id.replace('room-', '')
      let el: SVGElement
      if (shape.type === 'rect') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        el.setAttribute('x', String(shape.x))
        el.setAttribute('y', String(shape.y))
        el.setAttribute('width', String(shape.width))
        el.setAttribute('height', String(shape.height))
      } else {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        el.setAttribute('d', shape.d)
      }
      el.setAttribute('data-place-id', placeId)
      // Fully transparent pixels sometimes miss hit-testing on mobile Safari/Chrome — keep a
      // nearly-transparent fill so the geometry remains clickable without altering visuals.
      el.setAttribute('fill', 'rgba(255,255,255,0.001)')
      el.setAttribute('pointer-events', 'all')
      svg.appendChild(el)
    }
  }, [svgContent, hotspots])

  const tryHitPlace = useCallback((clientX: number, clientY: number): boolean => {
    const svg = svgRef.current
    if (!svg) return false

    const now = performance.now()
    if (now - lastHandledTsRef.current < 120) return true // debounce

    // Convert screen coordinates → SVG user-space via combined transform matrix.
    // This accounts for both the SVG's viewBox mapping and any CSS pan/zoom transform,
    // making hit-testing reliable on mobile without relying on elementFromPoint.
    let svgPt: SVGPoint
    try {
      const rawPt = svg.createSVGPoint()
      rawPt.x = clientX
      rawPt.y = clientY
      const ctm = svg.getScreenCTM()
      if (!ctm) return false
      svgPt = rawPt.matrixTransform(ctm.inverse())
    } catch {
      return false
    }

    const hotspotEls = svg.querySelectorAll<SVGGeometryElement>('[data-place-id]')
    for (const el of hotspotEls) {
      try {
        if (el.isPointInFill(svgPt)) {
          const placeId = el.getAttribute('data-place-id')
          if (placeId) {
            lastHandledTsRef.current = now
            onRoomClick(placeId)
            return true
          }
        }
      } catch {
        // isPointInFill not available on this element, skip
      }
    }

    return false
  }, [onRoomClick])

  // Fallback click handler for browsers where pointer events misbehave (some mobile cases).
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const handleClick = (e: MouseEvent) => {
      if (ignoreNextClickRef.current) {
        ignoreNextClickRef.current = false
        return
      }

      const touchPos = lastTouchRef.current
      const cx = touchPos?.x ?? e.clientX
      const cy = touchPos?.y ?? e.clientY

      // Try closest on target, then elementFromPoint as a fallback for composed paths
      const target = e.target as Element | null
      let roomEl = target?.closest('[data-place-id]')
      if (!roomEl) {
        // Use last touch position if available to avoid iOS synthesised click offset issues
        const el = document.elementFromPoint(cx, cy)
        roomEl = el?.closest('[data-place-id]') || null
      }

      if (roomEl) tryHitPlace(cx, cy)
    }

    svg.addEventListener('click', handleClick)
    return () => svg.removeEventListener('click', handleClick)
  }, [tryHitPlace, svgContent, hotspots])

  const applyTransform = useCallback((t: Transform) => {
    // Re-resolve svgRef if null or detached from DOM (happens when floor/building changes
    // cause the container div to unmount/remount with same svgContent string)
    if (!svgRef.current || !svgRef.current.isConnected) {
      svgRef.current = containerRef.current?.querySelector<SVGSVGElement>('svg') ?? null
    }
    const svg = svgRef.current
    if (!svg) return
    svg.style.transformOrigin = '0 0'
    svg.style.transform = `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})`
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Some mobile browsers (older iOS) throw on setPointerCapture; guard to keep handling alive.
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* no-op */ }
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    hasDraggedRef.current = false
    if (e.pointerType === 'touch') {
      lastTouchRef.current = { x: e.clientX, y: e.clientY }
    }
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

    if (e.pointerType === 'touch') {
      lastTouchRef.current = { x: e.clientX, y: e.clientY }
    }

    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) hasDraggedRef.current = true

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const t = transformRef.current
    const container = containerRef.current
    if (!container) return

    if (pointersRef.current.size === 1) {
      transformRef.current = { ...t, x: t.x + dx, y: t.y + dy }
    } else if (pointersRef.current.size === 2) {
      const rect = container.getBoundingClientRect()

      // Scale
      const newDist = getPinchDist(pointersRef.current)
      const oldDist = lastPinchDistRef.current ?? newDist
      const scaleDelta = newDist / oldDist
      lastPinchDistRef.current = newDist

      // Rotation
      const newAngle = getPinchAngle(pointersRef.current)
      const oldAngle = lastPinchAngleRef.current ?? newAngle
      const dAngle = newAngle - oldAngle
      lastPinchAngleRef.current = newAngle

      const center = getPointerCenter(pointersRef.current)
      const cx = center.x - rect.left
      const cy = center.y - rect.top

      const newScale = clamp(t.scale * scaleDelta, MIN_SCALE, MAX_SCALE)
      const scaleFactor = newScale / t.scale

      // Rotate + scale around pinch center
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

  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false
      return
    }
    const touchPos = lastTouchRef.current
    const cx = touchPos?.x ?? e.clientX
    const cy = touchPos?.y ?? e.clientY
    tryHitPlace(cx, cy)
  }, [tryHitPlace])

  const onTouchEndCapture = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Ignore multi-touch end here; pinch/rotate handled by pointer events
    if (e.touches.length > 0) return
    if (e.changedTouches.length !== 1) return
    const t = e.changedTouches[0]
    lastTouchRef.current = { x: t.clientX, y: t.clientY }
    const handled = tryHitPlace(t.clientX, t.clientY)
    if (handled) ignoreNextClickRef.current = true
  }, [tryHitPlace])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const wasTap = !hasDraggedRef.current && pointersRef.current.size === 1
    let handled = false

    if (wasTap) {
      // elementFromPoint bypasses pointer capture target override
      const touchPos = e.pointerType === 'touch' ? lastTouchRef.current : null
      const clientX = touchPos?.x ?? e.clientX
      const clientY = touchPos?.y ?? e.clientY

      handled = tryHitPlace(clientX, clientY)
    }

    // Only suppress the follow-up synthetic click when we already handled the tap here.
    ignoreNextClickRef.current = handled

    pointersRef.current.delete(e.pointerId)
    lastPinchDistRef.current = null
    lastPinchAngleRef.current = null
  }, [tryHitPlace])

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
          className="absolute inset-0 overflow-hidden touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onClick={onClick}
          onTouchEndCapture={onTouchEndCapture}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted floor plan SVG
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <img src={HakdukIcon} alt="준비중" className="w-25 h-auto opacity-60" />
          <p className="text-neutral-300 text-[14px] font-medium">서비스 준비중</p>
        </div>
      )}

      {/* Legend - only shown when SVG is loaded */}
      {svgContent && (
        <div className="absolute top-3 left-3 z-10 bg-white/90 rounded-xl px-3 py-2 flex flex-col gap-1.5 shadow-sm">
          {legendItems.map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              {item.color ? (
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              ) : (
                <span className="w-2.5 text-center text-[10px] shrink-0 text-neutral-300">{item.icon}</span>
              )}
              <span className="text-[11px] text-neutral-300 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(FloorMapViewer)
