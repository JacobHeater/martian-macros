const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** The name of a day of the week, Sunday as 0 (as `CalendarDate.weekday` numbers them). */
export function weekdayLabel(weekday: number): string {
  const name = names[weekday];
  if (name === undefined) throw new RangeError(`No weekday is numbered ${weekday}.`);
  return name;
}
