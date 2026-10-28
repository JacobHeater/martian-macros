import { useRef, useState } from 'react';
import { NightsChart } from '../charts/NightsChart';
import type { CalendarDate } from '../domain/CalendarDate';
import { SleepNight } from '../domain/SleepNight';
import { durationFieldsOf } from '../format/durationFieldsOf';
import { Fmt } from '../format/Fmt';
import { healthPlatformName } from '../format/healthPlatformName';
import { parseDurationFields } from '../format/parseDurationFields';
import { sleepDurationText } from '../format/sleepDurationText';
import { Loadable } from '../state/Loadable';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { MmButton } from '../ui/MmButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmDurationField } from '../ui/MmDurationField';
import { MmSection } from '../ui/MmSection';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { useOverlays } from '../ui/useOverlays';
import './progress.css';

/** How many recent nights are offered to type: the fortnight the coach reads (MM-252). */
const nightsShown = 14;

/**
 * The nights of sleep (MM-250): last night as the section's line, and the
 * last two weeks as bars (MM-578), a column a night, recorded or not: a tap
 * on one chooses that night to type or correct in hours and minutes below,
 * with Save as a quiet action, as the waist's is. A night is kept against
 * the morning it ended on. A night read from the health platform shows here
 * and is kept unless the person types one for the same morning. Hours only:
 * no score.
 */
export function SleepNightCard() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const loaded = useCell(state.sleepNights);
  const [picked, setPicked] = useState<CalendarDate>(today);
  const [typed, setTyped] = useState<{ hours: string; minutes: string }>();
  const chartRef = useRef<SVGSVGElement>(null);
  // A read that went wrong is said, never shown as no nights (MM-334).
  if (Loadable.hasFailed(loaded)) {
    return (
      <MmSection icon="sleep" title="Sleep">
        <ReadFailedNotice title="Could not read your nights of sleep" onRetry={() => state.retrySleep()} />
      </MmSection>
    );
  }
  if (!loaded.ready) {
    return (
      <MmSection icon="sleep" title="Sleep">
        <ScreenLoading />
      </MmSection>
    );
  }
  const nights = loaded.value;
  const byDay = new Map(nights.map((night) => [night.date, night]));
  const existing = byDay.get(picked);
  const kept = durationFieldsOf(existing?.minutesAsleep);
  const shown = typed ?? kept;
  const platform = healthPlatformName(services.platform);

  const parsed = parseDurationFields(shown);
  const changed = typed !== undefined && (typed.hours !== kept.hours || typed.minutes !== kept.minutes);
  const ready = parsed.error === undefined && parsed.minutes !== undefined && changed ? parsed.minutes : undefined;

  const label = (date: CalendarDate) => (date === today ? 'Last night' : date === today.addDays(-1) ? 'The night before' : Fmt.day(date, today));
  const night = label(picked);

  const save = async (toSave: number) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    try {
      await services.sleep.saveSleepNight(new SleepNight({ date: picked, minutesAsleep: toSave, source: 'typed' }));
      setTyped(undefined);
      // Focus to the nights, the next thing to choose from; not dropped to the page (the MM-416 review).
      chartRef.current?.focus();
      // Said where the action was taken, and aloud (the panel's F2).
      overlays.snack(`Saved: ${night}, ${sleepDurationText(toSave)}.`);
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
  // The row's line is the chosen night's alone (the panel's F10); the fortnight is counted under its chart.
  let note: string;
  if (existing === undefined) note = 'Not recorded yet.';
  else if (existing.source === 'imported') {
    note = `${sleepDurationText(existing.minutesAsleep)} from ${existing.sourceName ?? platform}. Type to use yours instead.`;
  } else note = `${sleepDurationText(existing.minutesAsleep)}, typed.`;
  let count =
    recorded === 0
      ? `No nights recorded in the last ${nightsShown} yet, 0 of ${nightsShown}. Tap a night to type it.`
      : `${recorded} of the last ${nightsShown} nights recorded. Tap a night to type or correct it. The line is the 7-night average.`;
  if (anyImported) count += ` A night you type is used instead of one read from ${platform}.`;

  return (
    <MmSection icon="sleep" title="Sleep" summary={summary} collapsible initiallyExpanded={false}>
      <p className="app-caption progress-sleep-how">
        Hours asleep, not hours in bed. Each night goes under the morning it ended, so last night is the one that ended
        today.
      </p>

      {/* The fortnight drawn, and the way to choose a night (MM-578): every night a column, recorded or not. */}
      <NightsChart
        ref={chartRef}
        minutes={new Map(recent.flatMap((date) => (byDay.has(date) ? [[date, (byDay.get(date) as SleepNight).minutesAsleep] as const] : [])))}
        today={today}
        nights={nightsShown}
        picked={picked}
        onPick={(date) => {
          setPicked(date);
          setTyped(undefined);
        }}
        label={
          `Hours asleep, the last ${nightsShown} nights: ${recorded} recorded. ` +
          recent
            .filter((date) => byDay.has(date))
            .map((date) => `${label(date)}, ${sleepDurationText((byDay.get(date) as SleepNight).minutesAsleep)}`)
            .join('; ') +
          `. The line is the 7-night average. Chosen: ${night}. Arrow keys choose another night.`
        }
      />
      <p className="app-caption progress-sleep-count">{count}</p>
      {/* The chosen night said aloud as it changes, as the trend chart's picked weigh-in is (MM-142). */}
      <span className="mm-visually-hidden" aria-live="polite">{`${night}: ${note}`}</span>

      <MmListGroup>
        <MmListRow
          title={night}
          subtitle={note}
          entry={
            <>
              <MmDurationField
                name={night}
                hours={shown.hours}
                minutes={shown.minutes}
                error={parsed.error}
                onSubmit={ready === undefined ? undefined : () => void save(ready)}
                onChange={(h, m) => setTyped({ hours: h, minutes: m })}
              />
              <div className="progress-sleep-save">
                <MmButton label="Save" name="Save night" kind="secondary" onPress={ready === undefined ? undefined : () => void save(ready)} />
              </div>
            </>
          }
        />
      </MmListGroup>
    </MmSection>
  );
}
