const focusable =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab inside `panel` (MM-271): from its last control Tab lands on its
 * first, and Shift+Tab goes the other way, so the keyboard never leaves an
 * overlay for the screen beneath it.
 */
export function trapFocus(event: { key: string; shiftKey: boolean; preventDefault: () => void }, panel: HTMLElement): void {
  if (event.key !== 'Tab') return;
  const controls = [...panel.querySelectorAll<HTMLElement>(focusable)].filter((control) => control.closest('[hidden]') === null);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (first === undefined || last === undefined) {
    event.preventDefault();
    panel.focus();
    return;
  }
  const active = document.activeElement;
  const atEdge = active === panel || !panel.contains(active);
  if (event.shiftKey && (atEdge || active === first)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (atEdge || active === last)) {
    event.preventDefault();
    first.focus();
  }
}
