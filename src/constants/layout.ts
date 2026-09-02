/** How much of the detail bottom sheet stays on screen when it is collapsed. */
export const SHEET_PEEK_HEIGHT = 64

/**
 * Bottom offset for controls that float over the map (floor/view toolbar, the
 * floating menu) while the collapsed sheet is peeking, so it doesn't cover
 * them.
 */
export const ABOVE_SHEET_BOTTOM = SHEET_PEEK_HEIGHT + 15

/**
 * Set on the root element by the detail sheet while it sits collapsed, and
 * cleared whenever the sheet is expanded or gone — the floating controls each
 * fall back to their own resting position. A CSS variable rather than props
 * because FloatingMenu lives in the layout, outside the map pages.
 */
export const FLOATING_BOTTOM_VAR = '--floating-bottom'

export function setFloatingBottomRaised(raised: boolean) {
  const root = document.documentElement
  if (raised) root.style.setProperty(FLOATING_BOTTOM_VAR, `${ABOVE_SHEET_BOTTOM}px`)
  else root.style.removeProperty(FLOATING_BOTTOM_VAR)
}
