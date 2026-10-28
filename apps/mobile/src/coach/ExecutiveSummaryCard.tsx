import { useEffect, useState } from 'react';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { executiveBriefArchetypeText } from '../format/coach/executiveBriefArchetypeText';
import { executiveBriefNarrationRequest } from '../format/coach/executiveBriefNarrationRequest';
import { Fmt } from '../format/Fmt';
import { MmSection } from '../ui/MmSection';
import { StatRow } from '../ui/StatRow';

/**
 * The top-level executive summary on the unified Coach screen (MM-667):
 * narrates the 7-day accountability brief via Track 1 (deterministic archetype)
 * or Track 2 (BYOK LLM narrator) alongside the 7-day calorie adherence,
 * protein floor hits, and today's remaining runway.
 */
export function ExecutiveSummaryCard() {
  const { services, state } = useApp();
  const brief = useCell(state.coachAnalysis.executiveBrief);
  const [narration, setNarration] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (brief === undefined) return;
    let cancelled = false;
    setNarration(executiveBriefArchetypeText(brief));
    void services.coachNarrator.narrate(executiveBriefNarrationRequest(brief)).then((text) => {
      if (!cancelled) setNarration(text);
    });
    return () => {
      cancelled = true;
    };
  }, [brief, services.coachNarrator]);

  if (brief === undefined) return null;

  const text = narration ?? executiveBriefArchetypeText(brief);
  const adherenceValue = brief.protectedPath
    ? `${brief.sevenDay.loggedDays} / 7 days logged`
    : brief.sevenDay.loggedDays === 0
      ? '0 / 7 days logged'
      : `${brief.sevenDay.calorieAdherenceDays} / ${brief.sevenDay.loggedDays} days on target`;
  const proteinValue =
    brief.proteinTargetG <= 0
      ? 'No floor set'
      : `${brief.sevenDay.proteinFloorHitDays} / 7 days at ${Fmt.grams(brief.proteinTargetG)}`;
  const runwayValue = brief.protectedPath
    ? `${Fmt.grams(brief.proteinLoggedG)} protein today`
    : brief.kcalRemaining >= 0
      ? `${Fmt.kcal(brief.kcalRemaining)} left`
      : `${Fmt.kcal(-brief.kcalRemaining)} over`;
  const runwayDetail =
    brief.runwayState === 'proteinUnrecoverable'
      ? `${Fmt.grams(brief.proteinRemainingG)} protein short today · front-load tomorrow`
      : brief.proteinRemainingG > 0
        ? `${Fmt.grams(brief.proteinRemainingG)} protein left today`
        : undefined;

  return (
    <MmSection framed icon="coach" title="Executive summary">
      <p className="app-text">{text}</p>
      <StatRow label="7-day calorie adherence" value={adherenceValue} />
      <StatRow label="7-day protein floor" value={proteinValue} />
      <StatRow label="Today’s runway" value={runwayValue} detail={runwayDetail} />
    </MmSection>
  );
}
