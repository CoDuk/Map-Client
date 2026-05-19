import type { BuildingMapCfg, ViewKey } from '@/data/places'
import LectureIcon from '@/assets/lecture.svg'
import LockerIcon from '@/assets/locker.svg'
import InformationIcon from '@/assets/information.svg'

type Props = {
  cfg: BuildingMapCfg
  activeFloor: string
  activeView: ViewKey
  availableViews: ViewKey[]
  onFloorChange: (floor: string) => void
  onViewChange: (view: ViewKey) => void
}

type ViewDef = { key: ViewKey; label: string; icon: string }

const VIEW_DEFS: ViewDef[] = [
  { key: 'basic', label: '기본 지도', icon: LectureIcon },
  { key: 'locker', label: '사물함', icon: LockerIcon },
  { key: 'amenity', label: '정수기/자판기', icon: InformationIcon },
]

export default function FloorViewToolbar({
  cfg,
  activeFloor,
  activeView,
  availableViews,
  onFloorChange,
  onViewChange,
}: Props) {
  const visibleViews = VIEW_DEFS.filter(v => availableViews.includes(v.key))

  return (
    <div className="shrink-0 flex flex-col w-fit gap-2.5 absolute bottom-12 left-5 bg-cream-100">
      {/* 뷰 아이콘 */}
      <div className="inline-flex w-fit items-center gap-1 px-1.5 py-1.5 rounded-full border-[1.5px] border-cream-200 bg-cream-0">
        {visibleViews.map(v => (
          <button
            key={v.key}
            type="button"
            aria-label={v.label}
            onClick={() => onViewChange(v.key)}
            className={`p-1 flex items-center justify-center rounded-full transition-colors ${
              activeView === v.key ? 'bg-cream-200' : ''
            }`}
          >
            <img
              src={v.icon}
              alt={v.label}
              className={`w-6 h-6 transition-opacity ${activeView === v.key ? 'opacity-100' : 'opacity-30'}`}
            />
          </button>
        ))}
      </div>

      {/* 층 버튼 */}
      <div className="w-fit flex items-center gap-0.5 px-1.5 py-1.5 rounded-full border-[1.5px] border-cream-200 bg-cream-0">
        {cfg.floors.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => onFloorChange(f.key)}
            className={`px-2 py-1 rounded-full text-[13px] font-semibold transition-colors ${
              activeFloor === f.key
                ? 'bg-cream-200 text-primary-dark'
                : 'text-neutral-300 opacity-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
