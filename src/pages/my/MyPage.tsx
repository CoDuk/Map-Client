import { useMemo, useState } from 'react'
import MyPageModal from '@/pages/my/components/MyPageModal'
import { withdrawMe } from '@/apis/auth/withdraw'

const dukModules = import.meta.glob('/src/assets/duk*.svg', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function buildDukAvatarMap() {
  const entries = Object.entries(dukModules)
    .map(([path, url]) => {
      const m = path.match(/duk(\d+)\.svg$/)
      return m ? { n: Number(m[1]), url } : null
    })
    .filter((v): v is { n: number; url: string } => Boolean(v))
    .sort((a, b) => a.n - b.n)

  return entries.map((e) => e.url)
}

export default function MyPage() {
  const dukAvatarMap = useMemo(() => buildDukAvatarMap(), [])
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [avatarIdx] = useState<number | null>(() => {
    const dukAvatars = buildDukAvatarMap()
    if (dukAvatars.length === 0) return null

    const KEY = 'my-avatar-index'
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? Number(raw) : NaN

    if (!Number.isNaN(parsed) && parsed >= 0) {
      return parsed % dukAvatars.length
    }

    const next = Math.floor(Math.random() * dukAvatars.length)
    localStorage.setItem(KEY, String(next))
    return next
  })

  const avatarUrl = avatarIdx == null ? null : dukAvatarMap[avatarIdx]

  const handleWithdrawConfirm = async () => {
    if (isWithdrawing) return
    setIsWithdrawing(true)

    try {
      await withdrawMe()

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('qna-avatar-map')
      localStorage.removeItem('my-avatar-index')

      window.location.href = '/'
    } catch {
      alert('탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsWithdrawing(false)
      setWithdrawOpen(false)
    }
  }

  return (
    <div className="w-full overflow-hidden">
      <MyPageModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={handleWithdrawConfirm}
      />
      <div className="fixed inset-0 -z-10 bg-cream-100" />
      <div
        className="w-full flex flex-col items-center justify-center px-6 overflow-hidden"
        style={{ height: 'calc(100dvh - var(--app-header-height, 64px))' }}
      >
        <div
          className="w-full flex flex-col items-center gap-[50px]"
          style={{ transform: 'translateY(-45px)' }}
        >
          <div className="w-[300px] h-[300px] rounded-full bg-white/40 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="profile"
                className="w-[300px] h-[300px] rounded-full object-contain select-none"
                draggable={false}
              />
            ) : (
              <div className="w-[300px] h-[300px] rounded-full bg-white/30" />
            )}
          </div>

          <button
            type="button"
            className="text-[15px] text-rose-300 font-medium underline underline-offset-4"
            onClick={() => setWithdrawOpen(true)}
          >
            회원 탈퇴하기
          </button>
        </div>
      </div>
    </div>
  )
}