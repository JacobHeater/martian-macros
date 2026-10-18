const focusable = 'button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** The first control in `node`, or `node` itself when it is one. */
function controlIn(node: Element | null): HTMLElement | null {
  if (!(node instanceof HTMLElement)) return null;
  if (node.matches(focusable)) return node;
  return node.querySelector<HTMLElement>(focusable);
}

/**
 * The nearest control outside `element`: among its siblings, the ones
 * before it first, then the ones after; then the same for each ancestor up
 * to the document body.
 */
function neighbourControlOf(element: HTMLElement): HTMLElement | null {
  for (let node: Element | null = element; node !== null && node !== document.body; node = node.parentElement) {
    for (let before = node.previousElementSibling; before !== null; before = before.previousElementSibling) {
      const control = controlIn(before);
      if (control !== null) return control;
    }
    for (let after = node.nextElementSibling; after !== null; after = after.nextElementSibling) {
      const control = controlIn(after);
      if (control !== null) return control;
    }
  }
  return null;
}

/**
 * Puts the focus on a stable neighbour of `element`, which is about to go,
 * so a keyboard, switch or screen-reader user is not left on the document
 * body (WCAG 2.4.3; MM-379). The neighbour is found now and focused once
 * the removals have been drawn: a dialog that closed first hands the focus
 * back to the element it came from, which is the one going.
 */
export function focusNeighbourOf(element: HTMLElement | null): void {
  if (element === null) return;
  const neighbour = neighbourControlOf(element);
  if (neighbour === null) return;
  setTimeout(() => {
    if (neighbour.isConnected) neighbour.focus();
  }, 0);
}
