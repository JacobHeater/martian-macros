import { useMemo, useState } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { Pause } from '../domain/Pause';
import { PauseReason } from '../domain/PauseReason';
import { pausedDaysBetween } from '../engine/pausedDaysBetween';
import { PauseRule } from '../engine/PauseRule';
import { Fmt } from '../format/Fmt';
import { pauseReasonLabel } from '../format/pauseReasonLabel';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { PauseController } from '../state/PauseController';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmButton } from '../ui/MmButton';
import { MmSegmented } from '../ui/MmSegmented';
import { MmSlider } from '../ui/MmSlider';
import { Notice } from '../ui/Notice';
import { SectionLabel } from '../ui/SectionLabel';

const whatItDoes =
  'While paused, your targets become a maintenance guide and nothing is ' +
  'judged against them. No check-in runs and no target changes. Logging ' +
  'and weigh-ins still work and are welcome, never asked for. A pause of ' +
  'a week or more counts as a break from the deficit.';

const daysWord = (days: number) => (days === 1 ? 'day' : 'days');

/**
 * Set, extend or end a pause for a holiday, an illness or an injury
 * (MM-148). A pause is a planned break: while it runs nothing is judged, no
 * check-in happens and the targets become a maintenance guide.
 */
export function PauseScreen() {
  const { services, state } = useApp();
  const today = useCell(state.today);
  const pauses = useLoaded(state.pauses) ?? [];
  const navigator = useNavigator();
  const controller = useMemo(
    () => new PauseController({ pauses: services.pauses, weightEvents: services.weightEvents }),
    [services],
  );
  const [reason, setReason] = useState<PauseReason>('travel');
  const [startsIn, setStartsIn] = useState(0);
  const [days, setDays] = useState(7);

  // The pause that is running, or the next one that is set.
  const current = pauses.find((p) => !p.to.isBefore(today));

  return (
    <Screen title="Pause">
      {current === undefined ? form() : shown(current, today)}
    </Screen>
  );

  function shown(pause: Pause, now: CalendarDate) {
    const running = pause.covers(now);
    return (
      <>
        <h2 className="app-headline">
          {running
            ? `Paused until ${Fmt.day(pause.to, now)}`
            : `Pause set for ${Fmt.shortDay(pause.from)} to ${Fmt.shortDay(pause.to)}`}
        </h2>
        <p className="app-text app-muted">
          {pauseReasonLabel(pause.reason)} · {pause.days} {daysWord(pause.days)}
        </p>
        <div className="app-gap-small" />
        <p className="app-text">{whatItDoes}</p>
        <div className="app-gap" />
        <MmButton
          label={running ? 'Resume now' : 'Cancel this pause'}
          expand
          onPress={() =>
            void controller.endNow(pause, now).then(() => {
              // Resuming shows the resume screen, which is under every pushed one.
              navigator.closeAll();
            })
          }
        />
        <div className="app-gap-small" />
        <MmButton
          label="Extend by a week"
          kind="secondary"
          expand
          onPress={pause.extended ? undefined : () => void controller.extend(pause)}
        />
        {pause.extended ? (
          <p className="app-caption">
            A pause can be extended once. For anything longer, changing the goal to maintenance on the Coach screen is
            the better tool.
          </p>
        ) : null}
      </>
    );
  }

  function form() {
    const from = today.addDays(startsIn);
    const pause = new Pause({ from, to: from.addDays(days - 1), reason });
    const recentlyPaused = pausedDaysBetween(
      [...pauses, pause],
      pause.to.addDays(1 - PauseRule.heavyUseWindowDays),
      pause.to,
    );
    return (
      <>
        <p className="app-text">
          A holiday, an illness, an injury: some weeks are not going to be tracked. Say so and the coach waits for you.
        </p>
        <div className="app-gap" />
        <SectionLabel text="Reason" />
        <MmSegmented<PauseReason>
          name="Reason"
          compact
          segments={PauseReason.values.map((r) => ({ value: r, label: pauseReasonLabel(r) }))}
          selected={reason}
          onChange={(chosen) => setReason(chosen ?? reason)}
        />
        <div className="app-gap" />
        <SectionLabel text={`Starts: ${Fmt.day(from, today)}`} />
        <MmSlider
          name="Starts in days"
          value={startsIn}
          max={PauseRule.maximumDays}
          divisions={PauseRule.maximumDays}
          onChange={(value) => setStartsIn(roundHalfAwayFromZero(value))}
        />
        <div className="app-gap-small" />
        <SectionLabel text={`Lasts: ${days} ${daysWord(days)}, through ${Fmt.day(pause.to, today)}`} />
        <MmSlider
          name="Lasts days"
          value={days}
          min={1}
          max={PauseRule.maximumDays}
          divisions={PauseRule.maximumDays - 1}
          onChange={(value) => setDays(roundHalfAwayFromZero(value))}
        />
        <div className="app-gap-small" />
        <p className="app-text">{whatItDoes}</p>
        {recentlyPaused > PauseRule.heavyUseDays ? (
          <Notice
            text={
              'That makes a lot of paused days lately. Would maintenance suit ' +
              'better as the goal for now? You can change it on the Coach ' +
              'screen. Pausing is fine too.'
            }
          />
        ) : null}
        <div className="app-gap" />
        <MmButton
          label={startsIn === 0 ? 'Pause from today' : 'Set this pause'}
          expand
          onPress={() => void controller.start(pause)}
        />
      </>
    );
  }
}
