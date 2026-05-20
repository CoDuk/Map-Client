import { useRef, useEffect, useCallback } from 'react'
import type React from 'react'
import mapSvg from '@/assets/mapAll.svg?raw'
import { BUILDINGS } from '@/data/places'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/i18n'

type Props = {
  onBuildingClick: (buildingId: string) => void
  onEmptyClick?: () => void
  focusBuildingId?: string
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

export default function CampusMap({ onBuildingClick, onEmptyClick, focusBuildingId }: Props) {
  const { lang } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const svgWrapperRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0, rotation: 0 })

  const pointersRef = useRef<PointerMap>(new Map())
  const pointerStartRef = useRef<PointerMap>(new Map())
  const lastPinchDistRef = useRef<number | null>(null)
  const lastPinchAngleRef = useRef<number | null>(null)
  const hasDraggedRef = useRef(false)
  const lastBuildingClickTimeRef = useRef(0)

  
  const applyTransform = useCallback((t: Transform) => {
    const wrapper = svgWrapperRef.current
    if (!wrapper) return
    wrapper.style.transformOrigin = '0 0'
    wrapper.style.transform = `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})`
  }, [])


  useEffect(() => {
    const wrapper = svgWrapperRef.current
    if (!wrapper) return

    
    
    
    wrapper.innerHTML = mapSvg

    const svg = wrapper.querySelector<SVGSVGElement>('svg')
    if (!svg) return
    svgRef.current = svg
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

  
  }, [])

  // 검색에서 건물/장소 선택 시 해당 path를 화면 중앙으로 이동
  useEffect(() => {
    if (!focusBuildingId) return
    const container = containerRef.current
    const wrapper = svgWrapperRef.current
    if (!container || !wrapper) return

    const building = BUILDINGS.find(b => b.id === focusBuildingId)
    if (!building?.svgId) return

    const el = wrapper.querySelector(`[data-building="${building.svgId}"]`)
    if (!el) return

    // Reset to identity first so we read natural positions
    wrapper.style.transformOrigin = '0 0'
    wrapper.style.transform = ''
    transformRef.current = { scale: 1, x: 0, y: 0, rotation: 0 }

    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const elCX = elRect.left - containerRect.left + elRect.width  / 2
    const elCY = elRect.top  - containerRect.top  + elRect.height / 2
    const s = clamp(2.0, MIN_SCALE, MAX_SCALE)
    const tx = containerRect.width  / 2 - elCX * s
    const ty = containerRect.height / 2 - elCY * s
    transformRef.current = { scale: s, x: tx, y: ty, rotation: 0 }
    applyTransform(transformRef.current)
  }, [focusBuildingId, applyTransform])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.size === 0) {
      pointerStartRef.current.clear()
      lastPinchDistRef.current = null
      lastPinchAngleRef.current = null
      hasDraggedRef.current = false
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    pointerStartRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointersRef.current.size === 2) {
      lastPinchDistRef.current = getPinchDist(pointersRef.current)
      lastPinchAngleRef.current = getPinchAngle(pointersRef.current)
      hasDraggedRef.current = true
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
      if (totalDx * totalDx + totalDy * totalDy > 400) hasDraggedRef.current = true // 20px radius
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
    const { clientX: x, clientY: y } = e

    // Exact hit first, then expand radius for small SVG elements
    let buildingEl: Element | null = null
    const exactEl = document.elementFromPoint(x, y)
    buildingEl = exactEl?.closest('[data-building]') ?? null
    if (!buildingEl) {
      const r = 20
      for (const [dx, dy] of [[0,-r],[0,r],[-r,0],[r,0],[-14,-14],[14,-14],[-14,14],[14,14]] as [number,number][]) {
        const near = document.elementFromPoint(x + dx, y + dy)
        buildingEl = near?.closest('[data-building]') ?? null
        if (buildingEl) break
      }
    }

    let svgBuildingId = buildingEl?.getAttribute('data-building')

    const splitY = buildingEl?.getAttribute('data-split-y')
    if (splitY && svgRef.current) {
      const svg = svgRef.current
      const svgRect = svg.getBoundingClientRect()
      const vb = svg.viewBox.baseVal
      if (vb.width > 0 && vb.height > 0) {
        const scale = Math.min(svgRect.width / vb.width, svgRect.height / vb.height)
        const offsetY = (svgRect.height - vb.height * scale) / 2
        const svgY = vb.y + (e.clientY - svgRect.top - offsetY) / scale
        if (svgY > parseFloat(splitY)) {
          svgBuildingId = buildingEl?.getAttribute('data-building-secondary') ?? svgBuildingId
        }
      }
    }

    const building = svgBuildingId ? BUILDINGS.find(b => b.svgId === svgBuildingId) : undefined
    if (building) {
      lastBuildingClickTimeRef.current = Date.now()
      onBuildingClick(building.id)
    } else if (Date.now() - lastBuildingClickTimeRef.current > 400) {
      onEmptyClick?.()
    }
  }, [onBuildingClick, onEmptyClick])

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
        className="absolute inset-0 overflow-hidden touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        onWheel={onWheel}
        onDragStart={e => e.preventDefault()}
      >
        <div ref={svgWrapperRef} className="absolute inset-0" />
      </div>

      <div className="absolute top-3 left-3 z-10 bg-cream-100 border-[1.5px] border-cream-200 rounded-[15px] px-4 py-3 flex flex-col gap-1.5">
        <LegendItem color="#C2D6F1" stroke="#08397A" label={t('campusMap.smoking', lang)} />
        <LegendItem color="#EFD097" stroke="#E99015" label={t('campusMap.foodWaste', lang)} />
        <LegendItem color="#C6C6C5" stroke="#424242" label={t('campusMap.paperWaste', lang)} />
      </div>
    </div>
  )
}

function LegendItem({ color, stroke, label }: { color: string; stroke?: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color, outline: stroke ? `1px solid ${stroke}` : undefined }} />
      <span className="text-[9px] text-neutral-300 font-medium">{label}</span>
    </div>
  )
}
