/**
 * The minute of the day a time names (MM-594): "18:30", "6:30 PM" or "6 pm",
 * 0 to 1439; undefined for anything else. An answer's time eaten, as the
 * assistant wrote it.
 */
export function minuteOfDayIn(text: string): number | undefined {
  const found = /^\s*(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?\s*$/i.exec(text);
  if (found === null) return undefined;
  const [, h, m, half] = found;
  let hour = Number(h);
  const minute = m === undefined ? 0 : Number(m);
  if (minute > 59) return undefined;
  if (half === undefined) {
    if (m === undefined || hour > 23) return undefined;
  } else {
    if (hour < 1 || hour > 12) return undefined;
    hour = (hour % 12) + (half.toLowerCase() === 'p' ? 12 : 0);
  }
  return hour * 60 + minute;
}
