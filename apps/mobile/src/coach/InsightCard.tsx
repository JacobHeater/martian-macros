import { useEffect } from 'react';
import { Fmt } from '../format/Fmt';
import { insightText } from '../format/insightText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmSection } from '../ui/MmSection';
import { StatRow } from '../ui/StatRow';

/**
 * The one insight for today, if any (MM-141): what the coach noticed in the
 * user's own numbers, the evidence one tap down, and a way to dismiss it.
 * At most one new insight a day and three a week ever appear. A section
 * with the insight icon, not a card (MM-254).
 */
export function InsightCard() {
  const { services, state } = useApp();
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const selection = useCell(state.insightSelection);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  const rule = selection?.insight.rule;
  const isNew = selection?.isNew === true;

  // A new insight is written to the log once, so the rationing counts it.
  useEffect(() => {
    if (rule !== undefined && isNew) void services.insightLog.recordInsightShown(rule, today);
  }, [rule, isNew, services, today]);

  if (selection === undefined || setup === undefined) return null;
  const insight = selection.insight;
  const [title, body, evidence] = insightText(insight, new Fmt(setup.unitSystem, { weightDisplay }));
  return (
    <MmSection
      icon="insight"
      title={title}
      trailing={
        <MmButton label="Dismiss" kind="text" onPress={() => void services.insightLog.dismissInsight(insight.rule, today)} />
      }
    >
      <p className="app-text">{body}</p>
      <MmDisclosure title="The numbers behind this">
        {evidence.map(([label, value]) => (
          <StatRow key={label} label={label} value={value} />
        ))}
      </MmDisclosure>
    </MmSection>
  );
}
