import { useRegisterSW } from 'virtual:pwa-register/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/i18n'

export default function UpdatePrompt() {
  const { lang } = useLanguage()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => { registration.update() }, 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed top-[calc(var(--sat)+69px)] left-1/2 -translate-x-1/2 z-60 w-[calc(100%-32px)] max-w-[360px] bg-cream-0 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] px-4 py-3 flex items-center gap-3">
      <p className="flex-1 text-[13px] font-medium text-neutral-500">{t('update.available', lang)}</p>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        className="text-[12px] font-medium text-neutral-300 shrink-0"
      >
        {t('update.dismiss', lang)}
      </button>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="px-3 py-1.5 rounded-full bg-primary text-white text-[12px] font-semibold shrink-0"
      >
        {t('update.reload', lang)}
      </button>
    </div>
  )
}
