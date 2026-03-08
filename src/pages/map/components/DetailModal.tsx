import { useState } from 'react'
import type { Place } from '@/data/places'
import HakdukIcon from '@/assets/hakduk.svg'
import CloseIcon from '@/assets/close.svg'

type Props = {
  place: Place | null
  onClose: () => void
}

export default function DetailModal({ place, onClose }: Props) {
  const [imgIndex, setImgIndex] = useState(0)

  if (!place) return null

  const hasContent = place.images.length > 0 || place.notes.length > 0

  return (
    <>
      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-cream-0 rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] pb-(--sab)">
        {/* Handle bar — tap to close */}
        <div className="flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-neutral-100" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center"
        >
          <img src={CloseIcon} alt="닫기" className="w-5 h-5" />
        </button>

        <div className="px-5 pb-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          {/* Title + tags */}
          {place.name && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <h2 className="text-[20px] font-bold text-neutral-500">{place.name}</h2>
              {place.floor && (
                <span className="px-2.5 py-0.5 bg-primary-dark text-white text-[12px] font-semibold rounded-full">
                  {place.floor}
                </span>
              )}
            </div>
          )}

          {!hasContent ? (
            /* 서비스 준비중 */
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <img src={HakdukIcon} alt="준비중" className="w-[120px] h-auto" />
              <p className="text-neutral-300 text-[14px] font-medium text-center">서비스 제공 예정입니다.</p>
            </div>
          ) : (
            <>
              {/* Image carousel */}
              {place.images.length > 0 && (
                <div className="mb-4">
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-cream-200">
                    <img
                      src={place.images[imgIndex]}
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                    {place.images.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                        {place.images.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setImgIndex(i)}
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
                          onClick={() => setImgIndex(i)}
                          className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                            i === imgIndex ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {place.notes.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {place.notes.map((note, i) => (
                    <li key={i} className="text-[14px] text-neutral-300 font-medium">
                      ※ {note}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
