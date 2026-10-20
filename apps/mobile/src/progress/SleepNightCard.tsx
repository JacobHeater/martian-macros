import { useRef, useState } from 'react';
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
import { MmChoiceChip } from '../ui/MmChoiceChip';
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
 * last two weeks as chips, each a night to type or correct in hours and
 * minutes, with Save as a quiet action beside the note, as the waist's is.
 * A night is kept against the morning it ended on. A night read from the
 * health platform shows here and is kept unless the person types one for
 * the same morning. Hours only: no score.
 */
export function SleepNightCard() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const loaded = useCell(state.sleepNights);
  const [picked, setPicked] = useState<CalendarDate>(today);
  const [typed, setTyped] = useState<{ hours: string; minutes: string }>();
  const chipsRef = useRef<HTMLDivElement>(null);
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
      // Focus to the night just saved, the next thing to choose; not dropped to the page (the MM-416 review).
      chipsRef.current?.querySelector<HTMLElement>('button[aria-pressed="true"], button')?.focus();
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
  // The note names the picked night in every state (the panel's F10), then counts the fortnight.
  let about: string;
  if (existing === undefined) about = `${night}: not recorded yet.`;
  else if (existing.source === 'imported') {
    about = `${night}: ${sleepDurationText(existing.minutesAsleep)} from ${existing.sourceName ?? platform}. A night you type is used instead.`;
  } else about = `${night}: ${sleepDurationText(existing.minutesAsleep)}, typed.`;
  let note = `${about} ${recorded} of the last ${nightsShown} nights recorded.`;
  if (anyImported && existing?.source !== 'imported') note += ` A night you type is used instead of one read from ${platform}.`;

  return (
    <MmSection icon="sleep" title="Sleep" summary={summary} collapsible initiallyExpanded={lastNight === undefined}>
      <p className="app-caption progress-sleep-how">
        Hours asleep, not hours in bed. Each night goes under the morning it ended, so last night is the one that ended
        today.
      </p>

      <MmListGroup>
        <MmListRow
          title={night}
          subtitle={note}
          entry={
            <>
              <div ref={chipsRef} className="progress-sleep-nights" role="group" aria-label="Nights, the last two weeks">
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
