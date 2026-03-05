import { useRef, useEffect, useCallback } from 'react'
import type React from 'react'
import mapSvg from '@/assets/mapAll.svg?raw'
import { BUILDINGS } from '@/data/places'

type Props = {
  activeBuilding: string
  onBuildingClick: (buildingId: string) => void
  onSearchClick: () => void
}

type Transform = { scale: number; x: number; y: number; rotation: number }
type PointerMap = Map<number, { x: number; y: number }>

const MIN_SCALE = 0.6
const MAX_SCALE = 4

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function getPointerCenter(pointers: PointerMap) {
  const pts = Array.from(pointers.values())
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length }
}

function getPinchDist(pointers: PointerMap) {
  const [a, b] = Array.from(pointers.values())
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function getPinchAngle(pointers: PointerMap) {
  const [a, b] = Array.from(pointers.values())
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)
}

export default function CampusMap({ activeBuilding, onBuildingClick, onSearchClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0, rotation: 0 })

  const pointersRef = useRef<PointerMap>(new Map())
  const lastPinchDistRef = useRef<number | null>(null)
  const lastPinchAngleRef = useRef<number | null>(null)
  const hasDraggedRef = useRef(false)

  const applyTransform = useCallback((t: Transform) => {
    const svg = svgRef.current
    if (!svg) return
    svg.style.transformOrigin = '0 0'
    svg.style.transform = `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})`
  }, [])

  const updateHighlight = useCallback((buildingId: string) => {
    const svg = svgRef.current
    if (!svg) return
    const elements = svg.querySelectorAll<SVGElement>('[data-building]')

    elements.forEach(el => {
      const elSvgId = el.getAttribute('data-building')
      const building = BUILDINGS.find(b => b.svgId === elSvgId)
      if (!building) return

      const isActive = buildingId !== '전체' && building.id === buildingId
      const isCircle = el.tagName.toLowerCase() === 'circle'
      const origFill = el.getAttribute('data-orig-fill') || '#E7C9D0'

      if (buildingId === '전체') {
        el.setAttribute('fill', origFill)
        el.removeAttribute('opacity')
        if (isCircle) {
          el.setAttribute('stroke', '#08397A')
          el.setAttribute('r', '6')
        }
      } else if (isActive) {
        if (isCircle) {
          el.setAttribute('fill', '#981B45')
          el.setAttribute('stroke', '#50001B')
          el.setAttribute('r', '9')
        } else {
          el.setAttribute('fill', '#E7C9D0')
          el.setAttribute('opacity', '1')
        }
      } else {
        el.setAttribute('fill', origFill)
        el.setAttribute('opacity', '0.35')
        if (isCircle) {
          el.setAttribute('fill', '#C2D6F1')
          el.setAttribute('stroke', '#08397A')
          el.setAttribute('r', '6')
        }
      }
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const svg = container.querySelector<SVGSVGElement>('svg')
    if (!svg) return
    svgRef.current = svg
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.transformOrigin = '0 0'
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

    svg.querySelectorAll<SVGElement>('[data-building]').forEach(el => {
      if (!el.getAttribute('data-orig-fill')) {
        el.setAttribute('data-orig-fill', el.getAttribute('fill') || '#E7C9D0')
      }
    })

    updateHighlight(activeBuilding)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    updateHighlight(activeBuilding)
  }, [activeBuilding, updateHighlight])

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

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const wasTap = !hasDraggedRef.current && pointersRef.current.size === 1

    if (wasTap) {
      // elementFromPoint bypasses pointer capture target override
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const buildingEl = el?.closest('[data-building]')
      const svgBuildingId = buildingEl?.getAttribute('data-building')
      if (svgBuildingId) {
        const building = BUILDINGS.find(b => b.svgId === svgBuildingId)
        if (building) onBuildingClick(building.id)
      }
    }

    pointersRef.current.delete(e.pointerId)
    lastPinchDistRef.current = null
    lastPinchAngleRef.current = null
  }, [onBuildingClick])

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

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden bg-rose-100">
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted local SVG asset
        dangerouslySetInnerHTML={{ __html: mapSvg }}
      />

      {/* Search button */}
      <button
        type="button"
        onClick={onSearchClick}
        className="absolute top-3 right-3 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="검색">
          <circle cx="11" cy="11" r="7" stroke="#50001B" strokeWidth="2" />
          <path d="M16.5 16.5L21 21" stroke="#50001B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 rounded-xl px-3 py-2 flex flex-col gap-1.5 shadow-sm">
        <LegendItem color="#E99015" label="흡연 구역" />
        <LegendItem color="#424242" label="음식물 쓰레기통" />
        <LegendItem color="#005208" label="폐지 처리 장소" />
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-neutral-300 font-medium">{label}</span>
    </div>
  )
}
