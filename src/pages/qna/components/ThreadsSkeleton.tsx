const WIDTHS = [
  'w-[55%]',
  'w-[70%]',
  'w-[45%]',
  'w-[65%]',
  'w-[50%]',
  'w-[60%]',
  'w-[75%]',
  'w-[40%]',
  'w-[68%]',
  'w-[52%]',
]

export default function ThreadsSkeleton() {
  return (
    <>
      {WIDTHS.map((width, i) => (
        <div key={i} className="flex items-end w-full">
          <div className="w-9.25 shrink-0 mr-2.75">
            <div className="w-9.25 h-9.25 rounded-full bg-cream-200 animate-pulse mt-8.75" />
          </div>
          <div className={`${width} h-10 rounded-[20px] rounded-bl-none bg-cream-200 animate-pulse`} />
        </div>
      ))}
    </>
  )
}
