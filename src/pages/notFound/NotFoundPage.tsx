import { useNavigate } from 'react-router-dom'
import Bird404 from '@/assets/404bird.svg'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
      <div className="w-full max-w-[420px] flex flex-col items-center text-center">
        <div className="relative w-full max-w-[320px] mx-auto flex items-center justify-center">
          <img
            src={Bird404}
            alt="404 bird"
            className="absolute right-[45px] max-[340px]:right-[35px] top-[-93px] max-[360px]:top-[-78px] max-[340px]:top-[-75px] w-[146px] max-[360px]:w-[128px] max-[340px]:w-[118px] h-auto z-0 pointer-events-none select-none"
          />

          <div className="relative z-10">
            <svg
              viewBox="0 0 320 120"
              className="block w-full h-auto"
              aria-label="404"
              preserveAspectRatio="xMidYMid meet"
            >
              <text
                x="50%"
                y="62%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--color-primary)"
                stroke="var(--color-cream-300)"
                strokeWidth={8}
                paintOrder="stroke fill"
                strokeLinejoin="round"
                fontFamily="Pretendard, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
                fontSize={100}
                fontWeight={800}
                letterSpacing={2}
              >
                404
              </text>
            </svg>
          </div>
        </div>

        <div className="mt-[8px] text-primary-dark text-[20px] font-medium">
          페이지를 찾을 수 없습니다.
        </div>

        <div className="mt-[34px] text-rose-300 text-[10px] font-medium leading-5">
          <div>존재하지 않는 주소를 입력하셨거나,</div>
          <div>요청하신 페이지의 주소가 변경, 삭제되어 찾을 수 없습니다.</div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/main')}
          className="mt-[51px] rounded-[35px] bg-primary text-cream-100 text-[15px] font-semibold px-[45px] py-[10px]"
        >
          HOME
        </button>
      </div>
    </div>
  )
}
