import { useEffect, useRef } from 'react';
import { focusNeighbourOf } from '../ui/focusNeighbourOf';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { InsightSnooze } from '../engine/InsightSnooze';
import { CoachAreaScreen } from '../settings/CoachAreaScreen';
import { MmButton } from '../ui/MmButton';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmIcon } from '../ui/MmIcon';
import { Fmt } from '../format/Fmt';
import { StatRow } from '../ui/StatRow';
import { useOverlays } from '../ui/useOverlays';
import type { InlineInsightContent } from './InlineInsightContent';
import type { InlineInsightLayout } from './InlineInsightLayout';
import { SnoozeLength } from './SnoozeLength';
import './coach.css';

interface InlineInsightProps {
  insight: InlineInsightContent;
  /** The row it sits under, so its icon and words line up with that row's. */
  layout?: InlineInsightLayout;
  initiallyExpanded?: boolean;
}

/**
 * One line from the coach under the item it is about (MM-362): the
 * insight's mark in the row's icon column, the line in its text column,
 * and "The numbers behind this" one tap down, as the dashboard's insight opens
 * its evidence (MM-141). It is drawn inside the row's own slot, never as a
 * card of its own (MM-291). The closed line has nothing else to press: the
 * evidence ends with the way to this rule's switch (MM-364) and with
 * "Snooze…", which quiets this kind on this item for a day, a week, a
 * month or always, with an Undo (MM-378). Once drawn, it is logged for the
 * Coach tab (MM-363); a kind keeps the day it first showed under an item.
 */
export function InlineInsight({ insight, layout = 'entry', initiallyExpanded = false }: InlineInsightProps) {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const snoozes = useLoaded(state.insightSnoozes) ?? [];
  const host = useRef<HTMLDivElement>(null);
  const logged = insight.logged;
  const snooze = insight.snooze;
  // Logged once per kind and item: drawn again with the same insight, it logs nothing new.
  useEffect(() => {
    if (logged === undefined) return;
    void services.inlineInsightLog.recordInlineInsightShown({ ...logged, firstShownOn: state.today.value });
  }, [services, state, logged?.kind, logged?.anchor.kind, logged?.anchor.id]);
  // The app's own lines are filtered before they get here; a design's line is quieted the same way.
  if (snooze !== undefined && snoozes.some((s) => s.kind === snooze.kind && s.subject === snooze.subject && InsightSnooze.quietOn(s, state.today.value))) {
    return null;
  }

  const snoozeIt = async () => {
    if (snooze === undefined) return;
    const chosen = await overlays.options<SnoozeLength>({
      title: `Snooze “${insight.rule}” for ${snooze.item}`,
      // Nothing is in force yet, so no length is checked (the panel's PD-2).
      options: SnoozeLength.values.map((length) => ({ value: length, label: SnoozeLength.label(length) })),
    });
    if (chosen === undefined) return;
    const today = state.today.value;
    const resumesOn = SnoozeLength.resumesOn(chosen.value, today);
    // The line is about to go, and the focus with it: it moves to the nearest control that stays, the item or a line beside it (MM-379, MM-393).
    focusNeighbourOf(host.current);
    await services.insightSnoozes.saveInsightSnooze({ ...snooze, resumesOn });
    overlays.snack(`Snoozed for ${snooze.item} ${resumesOn === undefined ? 'until turned back on' : `until ${Fmt.shortDay(resumesOn)}`}`, {
      label: 'Undo',
      onAction: () => void services.insightSnoozes.removeInsightSnooze(snooze.kind, snooze.subject),
    });
  };

  return (
    <div ref={host} className={`coach-inline-insight coach-inline-insight-${layout}`}>
      <MmDisclosure
        title={`Coach: ${insight.line}`}
        initiallyExpanded={initiallyExpanded}
        header={
          <span className="coach-inline-insight-line">
            <span className="coach-inline-insight-icon" aria-hidden="true">
              <MmIcon name="insight" size={20} />
            </span>
            <span className="coach-inline-insight-text">{insight.line}</span>
          </span>
        }
      >
        <div className="coach-inline-insight-body">
          <p className="coach-inline-insight-label">The numbers behind this</p>
          {insight.evidence.map(([label, value]) => (
            <StatRow key={label} label={label} value={value} />
          ))}
          <div className="coach-inline-insight-settings">
            <MmButton
              label={`Settings for “${insight.rule}”`}
              kind="text"
              onPress={() => void navigator.push(() => <CoachAreaScreen area={insight.area} focus={insight.rule} />)}
            />
            {snooze === undefined ? null : (
              <MmButton label="Snooze…" name={`Snooze… ${insight.rule} for ${snooze.item}`} kind="text" onPress={() => void snoozeIt()} />
            )}
          </div>
        </div>
      </MmDisclosure>
    </div>
  );
}
