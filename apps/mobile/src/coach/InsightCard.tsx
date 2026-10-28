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
import { InsightFindingSection } from './InsightFindingSection';

/**
 * The one insight for today, if any (MM-141, MM-610): what the coach
 * noticed in the user's own numbers, the evidence one tap down, and a way
 * to dismiss it. At most one new insight a day and three a week ever
 * appear. A section with the insight icon, not a card (MM-254).
 *
 * It is the top finding the coach's analysis announced, in the Coach tab's
 * own words (`InsightFindingSection`, the model's where one is set up, MM-672), with a way to open that section there;
 * dismissed here, it is hidden there too (one finding id, MM-605's trend
 * log). Or it is a catalog rule the analysis has no equivalent of, as
 * before, logged when it starts showing.
 */
export function InsightCard() {
  const { services, state } = useApp();
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const shown = useCell(state.coachAnalysis.dashboard);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  const rule = shown?.kind === 'rule' ? shown.insight.rule : undefined;
  const isNew = shown?.kind === 'rule' && shown.isNew;

  // A new rule's insight is written to the insight log once, so the rationing counts it.
  useEffect(() => {
    if (rule !== undefined && isNew) void services.insightLog.recordInsightShown(rule, today);
  }, [rule, isNew, services, today]);

  if (shown === undefined || setup === undefined) return null;
  const fmt = new Fmt(setup.unitSystem, { weightDisplay });
  if (shown.kind === 'finding') return <InsightFindingSection finding={shown.finding} fmt={fmt} />;
  const insight = shown.insight;
  const [title, body, evidence] = insightText(insight, fmt);
  return (
    <MmSection framed
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
