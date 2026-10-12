import type { CoachingPolicy } from '../domain/CoachingPolicy';
import { GoalMode } from '../domain/GoalMode';
import type { ModeRecommendation } from '../engine/ModeRecommendation';
import { goalModeBlurb } from '../format/goalModeBlurb';
import { goalModeLabel } from '../format/goalModeLabel';
import { modeReasonExplanation } from '../format/modeReasonExplanation';
import { ChoiceCard } from '../ui/ChoiceCard';
import { Notice } from '../ui/Notice';

interface GoalStepProps {
  policy: CoachingPolicy;
  recommendation: ModeRecommendation;
  selected: GoalMode;
  onMode: (mode: GoalMode) => void;
}

/** Step 7: the recommended plan and the allowed alternatives. */
export function GoalStep({ policy, recommendation, selected, onMode }: GoalStepProps) {
  return (
    <>
      <h1 className="app-headline">Your plan</h1>
      <div className="app-gap-small" />
      <Notice
        text={
          `We recommend ${goalModeLabel(recommendation.mode).toLowerCase()}. ` +
          `${modeReasonExplanation(recommendation.reason)}`
        }
      />
      <div className="app-gap-small" />
      {GoalMode.values
        .filter((mode) => policy.allowedModes.has(mode))
        .map((mode) => (
          <ChoiceCard
            key={mode}
            label={goalModeLabel(mode)}
            detail={goalModeBlurb(mode)}
            selected={selected === mode}
            badge={mode === recommendation.mode ? 'Recommended' : undefined}
            onPress={() => onMode(mode)}
          />
        ))}
      <div className="app-gap-small" />
      <Notice
        icon="history"
        text={
          'Your first two weeks are calibration: log your food and ' +
          'weigh in daily, and your targets hold steady. After that ' +
          'they adapt weekly to how your body actually responds.'
        }
      />
    </>
  );
}
