/**
 * A whole number with a comma between each three digits: "12,346",
 * "-1,235". Written out here, not asked of the device, so that it reads
 * the same on every phone; the app is in US English only.
 */
export function groupThousands(whole: number): string {
  const digits = String(Math.abs(whole)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return whole < 0 ? `-${digits}` : digits;
}
