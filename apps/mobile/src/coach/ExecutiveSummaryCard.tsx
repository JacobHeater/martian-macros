import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { executiveBriefNarrationRequest } from '../format/coach/executiveBriefNarrationRequest';
import { coachAnalysisWords } from '../format/coachAnalysisWords';
import { Fmt } from '../format/Fmt';
import { MmBusyLine } from '../ui/MmBusyLine';
import { MmSection } from '../ui/MmSection';
import { StatRow } from '../ui/StatRow';
import { useCoachNarration } from '../app/useCoachNarration';

/**
 * The top-level executive summary on the unified Coach screen (MM-667):
 * narrates the 7-day accountability brief via Track 1 (deterministic archetype)
 * or Track 2 (BYOK LLM narrator) alongside the 7-day calorie adherence,
 * protein floor hits, and today's remaining runway. The wait on the model is
 * shown as such; the archetype is only the fallback (MM-673).
 */
export function ExecutiveSummaryCard() {
  const { state } = useApp();
  const brief = useCell(state.coachAnalysis.executiveBrief);
  // The wait is shown while the person's own model writes; the built-in words only once it failed (MM-673).
  const narration = useCoachNarration(brief === undefined ? undefined : executiveBriefNarrationRequest(brief));

  if (brief === undefined) return null;

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
      {narration.waiting || narration.text === undefined ? (
        <MmBusyLine label={coachAnalysisWords.writing} />
      ) : (
        <p className="app-text">{narration.text}</p>
      )}
      <StatRow label="7-day calorie adherence" value={adherenceValue} />
      <StatRow label="7-day protein floor" value={proteinValue} />
      <StatRow label="Today’s runway" value={runwayValue} detail={runwayDetail} />
    </MmSection>
  );
}
