/**
 * Scrolls `element` to the middle of the phone's viewport, so a story can be
 * drawn at a part of the screen below the first one. The test's document
 * draws nothing and has no scrolling, so there it does nothing.
 */
export function reveal(element: Element): void {
  if (typeof element.scrollIntoView === 'function') element.scrollIntoView({ block: 'center' });
}
