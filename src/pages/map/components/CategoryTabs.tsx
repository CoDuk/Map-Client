import { BUILDINGS } from '@/data/places'

type Props = {
  active: string
  onChange: (id: string) => void
  hideAll?: boolean
}

export default function CategoryTabs({ active, onChange, hideAll }: Props) {
  const items = hideAll
    ? BUILDINGS.filter(b => b.id !== '전체' && !b.noTab)
    : BUILDINGS.filter(b => !b.noTab)
  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar shrink-0">
      {items.map(building => (
        <button
          key={building.id}
          type="button"
          onClick={() => onChange(building.id)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
            active === building.id
              ? 'bg-primary-dark text-white'
              : 'bg-white text-neutral-300 border border-neutral-100'
          }`}
        >
          {building.label}
        </button>
      ))}

    </div>
  )
}
