/** The water goal's glasses in words (MM-326): "3 of 16 glasses", "1½ of 8 glasses", "½ of 8 glasses". */
export function glassesLabel(drunk: number, of: number): string {
  const whole = Math.floor(drunk);
  const glasses = of === 1 ? 'glass' : 'glasses';
  if (drunk === whole) return `${whole} of ${of} ${glasses}`;
  return `${whole === 0 ? '' : whole}½ of ${of} ${glasses}`;
}
