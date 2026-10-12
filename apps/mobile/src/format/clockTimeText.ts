const two = (value: number) => String(value).padStart(2, '0');

/**
 * A time of day as the user reads a clock: "6:02 PM", or "6:02:10 PM" with
 * `seconds`, with an ordinary space before the AM or PM.
 */
export function clockTimeText(time: Date, { seconds = false }: { seconds?: boolean } = {}): string {
  const hour = time.getHours();
  const onClock = hour % 12 === 0 ? 12 : hour % 12;
  const tail = seconds ? `:${two(time.getSeconds())}` : '';
  return `${onClock}:${two(time.getMinutes())}${tail} ${hour < 12 ? 'AM' : 'PM'}`;
}
