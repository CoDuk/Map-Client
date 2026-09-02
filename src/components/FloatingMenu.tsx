import { useState } from 'react'
import LangKoIcon from '@/assets/langKo.svg'
import LangEnIcon from '@/assets/langEn.svg'
import LangKoLightIcon from '@/assets/langKoLight.svg'
import LangEnLightIcon from '@/assets/langEnLight.svg'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGS } from '@/i18n'
import { FLOATING_BOTTOM_VAR } from '@/constants/layout'
import type { Lang } from '@/i18n'

const LANG_ICONS: Record<Lang, string> = {
  ko: LangKoIcon,
  en: LangEnIcon,
  zh: LangEnIcon,
  ja: LangEnIcon,
}

const LANG_ICONS_LIGHT: Record<Lang, string> = {
  ko: LangKoLightIcon,
  en: LangEnLightIcon,
  zh: LangEnLightIcon,
  ja: LangEnLightIcon,
}

export default function FloatingMenu() {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
      )}
      <div
        className="fixed right-[21px] z-50 flex flex-col items-center gap-3 transition-[bottom] duration-[250ms] ease-out"
        style={{ bottom: `var(${FLOATING_BOTTOM_VAR}, calc(43px + var(--sab)))` }}
      >
        {open && LANGS.map((l, i) => (
          <button
            key={l.code}
            type="button"
            onClick={() => { setLang(l.code); setOpen(false) }}
            className="floating-option-enter block"
            style={{ animationDelay: `${(LANGS.length - 1 - i) * 40}ms` }}
          >
            <img src={LANG_ICONS_LIGHT[l.code]} alt={l.label} className="block w-16 h-16 drop-shadow-[2px_2px_2px_rgba(0,0,0,0.25)]" />
          </button>
        ))}
        <button type="button" onClick={() => setOpen(o => !o)} className="block">
          <img src={LANG_ICONS[lang]} alt={lang} className="block w-16 h-16 drop-shadow-[2px_2px_2px_rgba(0,0,0,0.25)]" />
        </button>
      </div>
    </>
  )
}
