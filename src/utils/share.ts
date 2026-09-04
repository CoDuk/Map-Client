import { getPlaceNavigation } from '@/data/places'
import type { Place } from '@/data/places'

/**
 * The link that opens this place. Everything the receiving screen needs rides
 * in the URL itself, so a share never touches a server: the web reads these
 * parameters on load, and the Android app claims the same URLs as App Links —
 * whoever has it installed lands in the app, everyone else in the browser.
 */
export function placeShareUrl(place: Place): string {
  const id = encodeURIComponent(place.id)
  const nav = getPlaceNavigation(place)
  const path = nav
    ? `${nav.url}&floor=${nav.floorKey}&view=${nav.viewKey}&place=${id}`
    : `/main?place=${id}`
  return `${window.location.origin}${path}`
}

export type ShareOutcome = 'shared' | 'copied' | 'failed'

/**
 * Last resort for browsers where neither the share sheet nor the async
 * clipboard exists — both need a secure context, which a page served over
 * plain http (a phone pointed at a dev server, say) is not. Deprecated, and
 * still the only thing that copies there.
 */
function copyByExecCommand(text: string): boolean {
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.top = '0'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(field)
  return ok
}

/**
 * Hands the link to the system share sheet — KakaoTalk, messages, and the
 * rest — falling back to the clipboard where there is none (desktop browsers,
 * mostly).
 */
export async function sharePlace(place: Place, title: string): Promise<ShareOutcome> {
  const url = placeShareUrl(place)

  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch (err) {
      // Dismissing the sheet rejects as well. That's a finished share as far
      // as the user is concerned, not a reason to write to their clipboard.
      if ((err as DOMException)?.name === 'AbortError') return 'shared'
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return copyByExecCommand(url) ? 'copied' : 'failed'
  }
}
