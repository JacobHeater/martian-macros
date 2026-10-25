/**
 * MM-619: the screen tests and stories load no stylesheets, so everything
 * jsdom's `getComputedStyle` can know of an element is on the element: its
 * `hidden` attribute and its inline style. Yet jsdom still runs its whole
 * cascade for each call, and Testing Library calls it for every candidate of
 * every role query (visibility, accessible names) and user-event for every
 * press (pointer events). CI's CPU profile put most of a screen test's time
 * there. This answers from the element alone, the same answer without the
 * cascade. The tests that read real stylesheets (screens-css) keep jsdom's.
 */
const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function inlineOf(element: Element, property: string): string {
  return (element as HTMLElement).style?.getPropertyValue(property) ?? '';
}

function visibilityOf(element: Element): string {
  for (let at: Element | null = element; at !== null; at = at.parentElement) {
    const value = inlineOf(at, 'visibility');
    if (value !== '' && value !== 'inherit') return value;
  }
  return 'visible';
}

function valueOf(element: Element, property: string): string {
  const inline = inlineOf(element, property);
  switch (property) {
    case 'display':
      return (element as HTMLElement).hidden === true ? 'none' : inline || 'block';
    case 'visibility':
      return visibilityOf(element);
    case 'pointer-events':
      return inline || 'auto';
    default:
      return inline;
  }
}

window.getComputedStyle = ((element: Element) =>
  new Proxy({} as CSSStyleDeclaration, {
    get(_, key) {
      if (key === 'getPropertyValue') return (property: string) => valueOf(element, property);
      if (typeof key !== 'string') return undefined;
      return valueOf(element, kebab(key));
    },
  })) as typeof window.getComputedStyle;
