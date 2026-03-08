import { useRef, useEffect, useCallback } from 'react'
import type React from 'react'
import mapSvg from '@/assets/mapAll.svg?raw'
import { BUILDINGS } from '@/data/places'

type Props = {
  activeBuilding: string
  onBuildingClick: (buildingId: string) => void
  onSearchClick: () => void
  onEmptyClick?: () => void // 건물이 아닌 빈 영역 탭 시 호출
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

export default function CampusMap({ activeBuilding, onBuildingClick, onSearchClick, onEmptyClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // svgWrapperRef: transform 적용 대상. React가 절대 innerHTML을 건드리지 않는 div.
  const svgWrapperRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0, rotation: 0 })

  const pointersRef = useRef<PointerMap>(new Map())
  const lastPinchDistRef = useRef<number | null>(null)
  const lastPinchAngleRef = useRef<number | null>(null)
  const hasDraggedRef = useRef(false)

  // transform을 SVG가 아닌 wrapper div에 적용 → React re-render와 완전 분리
  const applyTransform = useCallback((t: Transform) => {
    const wrapper = svgWrapperRef.current
    if (!wrapper) return
    wrapper.style.transformOrigin = '0 0'
    wrapper.style.transform = `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})`
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
    const wrapper = svgWrapperRef.current
    if (!wrapper) return

    // innerHTML을 useEffect에서 딱 한 번 명령형으로 설정.
    // dangerouslySetInnerHTML을 JSX에서 제거했으므로
    // React는 이 wrapper의 자식을 절대 건드리지 않는다.
    // eslint-disable-next-line no-unsanitized/property
    wrapper.innerHTML = mapSvg

    const svg = wrapper.querySelector<SVGSVGElement>('svg')
    if (!svg) return
    svgRef.current = svg
    svg.style.width = '100%'
    svg.style.height = '100%'
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
    // 첫 손가락(새 제스처 시작): 이전 잔존 포인터 전부 정리 후 상태 초기화
    if (e.isPrimary) {
      pointersRef.current.clear()
      lastPinchDistRef.current = null
      lastPinchAngleRef.current = null
      hasDraggedRef.current = false
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointersRef.current.size === 2) {
      lastPinchDistRef.current = getPinchDist(pointersRef.current)
      lastPinchAngleRef.current = getPinchAngle(pointersRef.current)
      // 두 손가락 제스처는 탭이 아님
      hasDraggedRef.current = true
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

    // 콜백 호출 전에 먼저 정리 — onBuildingClick이 state 업데이트를 유발해도 안전
    pointersRef.current.delete(e.pointerId)
    lastPinchDistRef.current = null
    lastPinchAngleRef.current = null

    if (wasTap) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const buildingEl = el?.closest('[data-building]')
      let svgBuildingId = buildingEl?.getAttribute('data-building')

      // 하나의 폴리곤이 두 건물 영역을 덮는 경우: SVG 좌표 기준으로 분기
      // getBoundingClientRect + viewBox 직접 계산 (getScreenCTM은 CSS transform을 일부 브라우저에서 미반영)
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
        onBuildingClick(building.id)
      } else {
        onEmptyClick?.()
      }
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
        className="absolute inset-0 overflow-hidden touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {/*
          svgWrapperRef div: SVG map의 transform 대상.
          innerHTML은 useEffect에서 한 번만 설정하고 React는 이 div의 자식을 관리하지 않는다.
          Re-render 시에도 transform·SVG 스타일이 유지된다.
        */}
        <div ref={svgWrapperRef} className="absolute inset-0" />
      </div>

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
