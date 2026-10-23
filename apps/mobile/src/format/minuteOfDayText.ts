const two = (value: number) => String(value).padStart(2, '0');

/** A minute of the day as a clock reads it, as `clockTimeText` does: 460 → "7:40 AM" (MM-571). */
export function minuteOfDayText(minute: number): string {
  const whole = ((Math.round(minute) % 1440) + 1440) % 1440;
  const hour = Math.floor(whole / 60);
  const onClock = hour % 12 === 0 ? 12 : hour % 12;
  return `${onClock}:${two(whole % 60)} ${hour < 12 ? 'AM' : 'PM'}`;
}
