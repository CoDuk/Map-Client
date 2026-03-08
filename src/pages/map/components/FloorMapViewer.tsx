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

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0, rotation: 0 })
  const pointersRef = useRef<PointerMap>(new Map())
  const lastPinchDistRef = useRef<number | null>(null)
  const lastPinchAngleRef = useRef<number | null>(null)
  const hasDraggedRef = useRef(false)

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

  // After SVG content renders, wire up the SVG ref and reset transform
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

  const applyTransform = useCallback((t: Transform) => {
    if (!svgRef.current || !svgRef.current.isConnected) {
      svgRef.current = containerRef.current?.querySelector<SVGSVGElement>('svg') ?? null
    }
    const svg = svgRef.current
    if (!svg) return
    svg.style.transformOrigin = '0 0'
    svg.style.transform = `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})`
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
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

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true

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
    const wasTap = !hasDraggedRef.current && pointersRef.current.size === 1

    if (wasTap) {
      // elementsFromPoint returns all elements at the point regardless of pointer-events,
      // so decorative SVG paths on top don't block clicks on room rects below
      const els = document.elementsFromPoint(e.clientX, e.clientY)
      const placeEl = els.find(el => el.hasAttribute('data-place-id'))
      const placeId = placeEl?.getAttribute('data-place-id')
      if (placeId) onRoomClick(placeId)
    }

    pointersRef.current.delete(e.pointerId)
    lastPinchDistRef.current = null
    lastPinchAngleRef.current = null
  }, [onRoomClick])

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
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted floor plan SVG
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <img src={HakdukIcon} alt="준비중" className="w-25 h-auto opacity-60" />
          <p className="text-neutral-300 text-[14px] font-medium">서비스 준비중</p>
        </div>
      )}

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
