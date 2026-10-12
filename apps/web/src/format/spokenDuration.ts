const count = (n: number, unit: string) => (n === 1 ? `1 ${unit}` : `${n} ${unit}s`);

/**
 * A length of time as it is said aloud, for a screen reader: "1 minute 30
 * seconds", "45 seconds", "1 hour 2 minutes 0 seconds". Never negative.
 */
export function spokenDuration(durationMs: number): string {
  const total = durationMs < 0 ? 0 : Math.trunc(durationMs / 1000);
  const hours = Math.trunc(total / 3600);
  const minutes = Math.trunc((total % 3600) / 60);
  const parts: string[] = [];
  if (hours > 0) parts.push(count(hours, 'hour'));
  if (hours > 0 || minutes > 0) parts.push(count(minutes, 'minute'));
  parts.push(count(total % 60, 'second'));
  return parts.join(' ');
}
