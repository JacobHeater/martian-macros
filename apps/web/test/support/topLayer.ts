/** The screen on top: the one the user is looking at, not the ones beneath it. */
export function topLayer(): HTMLElement {
  const layers = document.querySelectorAll<HTMLElement>('.app-layer:not([hidden])');
  const top = layers[layers.length - 1];
  if (top === undefined) throw new Error('No screen is showing.');
  return top;
}
