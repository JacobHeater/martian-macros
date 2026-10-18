import { useEffect } from 'react';
import { useApp } from '../app/useApp';
import { useNavigator } from '../app/useNavigator';
import { CoachAreaScreen } from '../settings/CoachAreaScreen';
import { MmButton } from '../ui/MmButton';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmIcon } from '../ui/MmIcon';
import { StatRow } from '../ui/StatRow';
import type { InlineInsightContent } from './InlineInsightContent';
import type { InlineInsightLayout } from './InlineInsightLayout';
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
 * card of its own (MM-291). There is no dismiss: the evidence ends with
 * the way to this rule's switch (MM-364). Once drawn, it is logged for the
 * Coach tab (MM-363); a kind keeps the day it first showed under an item.
 */
export function InlineInsight({ insight, layout = 'entry', initiallyExpanded = false }: InlineInsightProps) {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const logged = insight.logged;
  // Logged once per kind and item: drawn again with the same insight, it logs nothing new.
  useEffect(() => {
    if (logged === undefined) return;
    void services.inlineInsightLog.recordInlineInsightShown({ ...logged, firstShownOn: state.today.value });
  }, [services, state, logged?.kind, logged?.anchor.kind, logged?.anchor.id]);
  return (
    <div className={`coach-inline-insight coach-inline-insight-${layout}`}>
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
          </div>
        </div>
      </MmDisclosure>
    </div>
  );
}
