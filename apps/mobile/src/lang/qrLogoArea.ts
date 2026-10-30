/**
 * The square in the middle of a QR code of `size` modules left light for a logo (MM-697): from module `from`, `span`
 * modules on a side. About a third of the side, odd so it centres on a module, which keeps it near a tenth of the
 * code's area: far inside what level H restores, and short of the timing and alignment patterns at the edges.
 */
export function qrLogoArea(size: number): { from: number; span: number } {
  const third = Math.floor(size * 0.32);
  const span = third % 2 === 1 ? third : third - 1;
  return { from: (size - span) / 2, span };
}
