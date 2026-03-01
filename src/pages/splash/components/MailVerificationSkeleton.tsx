type Props = {
  className?: string
}

export default function MailVerificationSkeleton({ className }: Props) {
  return (
    <div className={`w-[317px] flex items-center justify-center gap-3 ${className ?? ''}`}>
      <div className="w-5 h-5 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
      <div className="text-neutral-300 text-[14px] font-medium">로딩중…</div>
    </div>
  )
}