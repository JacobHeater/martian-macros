/**
 * Scrolls so that `row` sits where `top` was (MM-662): when choosing starts
 * from a hold, every row of the day is redrawn as a box, the rows above
 * change height, and the row under the finger would leap. The nearest
 * scrolling ancestor is moved by the difference, so the finger stays on
 * the row it held. Nothing happens when nothing scrolls.
 */
export function keepRowInPlace(row: Element, top: number): void {
  const delta = row.getBoundingClientRect().top - top;
  if (delta === 0) return;
  let scroller: HTMLElement | null = row.parentElement;
  while (scroller !== null) {
    const overflow = getComputedStyle(scroller).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && scroller.scrollHeight > scroller.clientHeight) break;
    scroller = scroller.parentElement;
  }
  if (scroller !== null) scroller.scrollTop += delta;
}
