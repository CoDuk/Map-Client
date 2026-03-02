
import sosadduk from '@/assets/sosadduk.svg'

type Props = {
  open: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function MyPageModal({ open, onConfirm, onClose }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="w-full max-w-[340px] overflow-hidden rounded-[30px] bg-cream-0 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <div className="px-6 pt-[53px] pb-[45px] flex flex-col items-center bg-rose-100">
            <img
              src={sosadduk}
              alt="withdraw"
              className="w-[180px] h-[180px] object-contain select-none"
              draggable={false}
            />
            <p className="mt-4 text-[18px] font-normal text-neutral-500">정말 탈퇴하시겠습니까?</p>
          </div>

          <div className="px-2">
            <div className="h-[1px] w-full bg-cream-400" />
          </div>

          <div className="flex w-full items-stretch bg-rose-100 pb-2">
            <button
              type="button"
              className="h-[56px] flex-1 flex items-center justify-center text-[16px] font-normal text-neutral-300"
              onClick={onConfirm}
            >
              <span className="relative top-[2px]">탈퇴</span>
            </button>
            <div className="w-[1px] bg-cream-400" />
            <button
              type="button"
              className="h-[56px] flex-1 flex items-center justify-center text-[16px] font-normal text-primary"
              onClick={onClose}
            >
              <span className="relative top-[2px]">취소</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
