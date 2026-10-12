/** Time on a timer: "0:42", "12:05", "1:02:03". Never negative. */
export function elapsedText(elapsedMs: number): string {
  const total = elapsedMs < 0 ? 0 : Math.trunc(elapsedMs / 1000);
  const hours = Math.trunc(total / 3600);
  const minutes = Math.trunc((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');
  if (hours === 0) return `${minutes}:${seconds}`;
  return `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`;
}
