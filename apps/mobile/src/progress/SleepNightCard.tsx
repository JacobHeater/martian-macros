import { useState } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { SleepNight } from '../domain/SleepNight';
import { Fmt } from '../format/Fmt';
import { healthPlatformName } from '../format/healthPlatformName';
import { parseNumber } from '../format/parseNumber';
import { sleepDurationText } from '../format/sleepDurationText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmDurationField } from '../ui/MmDurationField';
import { MmSection } from '../ui/MmSection';
import { useOverlays } from '../ui/useOverlays';
import './progress.css';

/** How many recent nights are offered to type: the fortnight the coach reads (MM-252). */
const nightsShown = 14;

/** Hours and minutes as typed, from minutes kept. */
const fieldsOf = (minutes: number | undefined) =>
  minutes === undefined
    ? { hours: '', minutes: '' }
    : { hours: `${Math.trunc(minutes / 60)}`, minutes: `${Math.round(minutes - Math.trunc(minutes / 60) * 60)}` };

/**
 * The nights of sleep (MM-250): last night as the section's line, and the
 * last two weeks as chips, each a night to type or correct in hours and
 * minutes, with Save as a quiet action. A night is kept against the morning
 * it ended on. A night read from the health platform shows here and is kept
 * unless the person types one for the same morning. Hours only: no score.
 */
export function SleepNightCard() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const nights = useLoaded(state.sleepNights);
  const [picked, setPicked] = useState<CalendarDate>(today);
  const [typed, setTyped] = useState<{ hours: string; minutes: string }>();
  if (nights === undefined) return null;
  const byDay = new Map(nights.map((night) => [night.date, night]));
  const existing = byDay.get(picked);
  const shown = typed ?? fieldsOf(existing?.minutesAsleep);
  const platform = healthPlatformName(services.platform);

  const hours = shown.hours.trim() === '' ? 0 : parseNumber(shown.hours);
  const minutes = shown.minutes.trim() === '' ? 0 : parseNumber(shown.minutes);
  let error: string | undefined;
  if (hours === undefined || hours < 0 || hours > 24) error = 'Up to 24 hours.';
  else if (minutes === undefined || minutes < 0 || minutes >= 60) error = 'Minutes from 0 to 59.';
  const total = hours === undefined || minutes === undefined ? undefined : Math.round(hours * 60 + minutes);
  const changed = typed !== undefined && (shown.hours !== fieldsOf(existing?.minutesAsleep).hours || shown.minutes !== fieldsOf(existing?.minutesAsleep).minutes);
  const ready =
    error === undefined && total !== undefined && total >= SleepNight.minMinutes && total <= SleepNight.maxMinutes && changed
      ? total
      : undefined;

  const label = (date: CalendarDate) => (date === today ? 'Last night' : date === today.addDays(-1) ? 'The night before' : Fmt.day(date, today));

  const save = async (toSave: number) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    try {
      await services.sleep.saveSleepNight(new SleepNight({ date: picked, minutesAsleep: toSave, source: 'typed' }));
      setTyped(undefined);
    } catch {
      overlays.snack('Could not save the night. Please try again.');
    }
  };

  const lastNight = byDay.get(today);
  const summary =
    lastNight === undefined
      ? 'Last night not recorded yet.'
      : `Last night ${sleepDurationText(lastNight.minutesAsleep)}${lastNight.source === 'imported' ? `, from ${lastNight.sourceName ?? platform}` : ''}.`;
  const recent = Array.from({ length: nightsShown }, (_, i) => today.addDays(-i));
  const recorded = recent.filter((date) => byDay.has(date)).length;
  const anyImported = recent.some((date) => byDay.get(date)?.source === 'imported');
  let note = `${recorded} of the last ${nightsShown} nights recorded.`;
  if (existing?.source === 'imported') note = `${label(picked)}: ${sleepDurationText(existing.minutesAsleep)} from ${existing.sourceName ?? platform}. A night you type is used instead.`;
  else if (anyImported) note += ` A night you type is used instead of one read from ${platform}.`;

  return (
    <MmSection icon="sleep" title="Sleep" summary={summary} collapsible initiallyExpanded={lastNight === undefined}>
      <p className="app-caption progress-sleep-how">
        Hours asleep, not hours in bed. A night is kept against the morning it ended on, so last night is the one that
        ended today.
      </p>
      <div className="progress-sleep-nights" role="group" aria-label="Nights, the last two weeks">
        {recent.map((date) => (
          <MmChoiceChip
            key={date.epochDay}
            label={byDay.has(date) ? `${label(date)} · ${sleepDurationText((byDay.get(date) as SleepNight).minutesAsleep)}` : label(date)}
            selected={date === picked}
            onSelect={() => {
              setPicked(date);
              setTyped(undefined);
            }}
          />
        ))}
      </div>
      <div className="progress-sleep-entry">
        <MmDurationField
          name={label(picked)}
          hours={shown.hours}
          minutes={shown.minutes}
          error={error}
          onSubmit={ready === undefined ? undefined : () => void save(ready)}
          onChange={(h, m) => setTyped({ hours: h, minutes: m })}
        />
        <MmButton label="Save" name="Save night" kind="secondary" onPress={ready === undefined ? undefined : () => void save(ready)} />
      </div>
      <p className="app-caption progress-sleep-note">{note}</p>
    </MmSection>
  );
}
