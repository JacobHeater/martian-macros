/** What every file of screen stories shares: a phone's viewport, edge to edge. */
export const screensMeta = {
  parameters: { layout: 'fullscreen' },
  globals: { viewport: { value: 'phone', isRotated: false } },
} as const;
