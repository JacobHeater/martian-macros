import type { CoachingPolicy } from '../domain/CoachingPolicy';
import { GoalMode } from '../domain/GoalMode';
import { FatLossPace } from '../engine/FatLossPace';
import type { ModeRecommendation } from '../engine/ModeRecommendation';
import type { PaceOption } from '../engine/PaceOption';
import type { Fmt } from '../format/Fmt';
import { paceOptionText } from '../format/paceOptionText';
import { MmListRow } from '../ui/MmListRow';
import { goalModeBlurb } from '../format/goalModeBlurb';
import { goalModeLabel } from '../format/goalModeLabel';
import { modeReasonExplanation } from '../format/modeReasonExplanation';
import { ChoiceCard } from '../ui/ChoiceCard';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';
import { trainingGoalNote } from '../format/trainingGoalNote';
import { trainingMeaning } from '../format/trainingMeaning';

interface GoalStepProps {
  policy: CoachingPolicy;
  recommendation: ModeRecommendation;
  selected: GoalMode;
  onMode: (mode: GoalMode) => void;
  /** The paces of fat loss as they would apply to this person (MM-128), shown under a chosen fat-loss goal. */
  paces?: readonly PaceOption[] | undefined;
  pace?: FatLossPace | undefined;
  onPace?: ((pace: FatLossPace) => void) | undefined;
  weightKg?: number | undefined;
  fmt?: Fmt | undefined;
  /** The person does not train yet (MM-134): Lean gain and Recomp say what they rest on, and Lean gain asks for one acknowledgement. */
  notTraining?: boolean;
  acknowledged?: boolean;
  onAcknowledge?: (() => void) | undefined;
}

/** Step 7: the recommended plan and the allowed alternatives; under fat loss, the pace to run it at (MM-128). */
export function GoalStep({
  policy,
  recommendation,
  selected,
  onMode,
  paces,
  pace,
  onPace,
  weightKg,
  fmt,
  notTraining = false,
  acknowledged = false,
  onAcknowledge,
}: GoalStepProps) {
  const showPaces = selected === 'fatLoss' && paces !== undefined && weightKg !== undefined && fmt !== undefined;
  const needsAcknowledgement = notTraining && selected === 'leanGain' && !acknowledged;
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
        .map((mode) => {
          const note = notTraining ? trainingGoalNote(mode) : undefined;
          return (
            <ChoiceCard
              key={mode}
              label={goalModeLabel(mode)}
              detail={note === undefined ? goalModeBlurb(mode) : `${goalModeBlurb(mode)} ${note}`}
              selected={selected === mode}
              badge={mode === recommendation.mode ? 'Recommended' : undefined}
              onPress={() => onMode(mode)}
            />
          );
        })}
      {notTraining ? <p className="app-caption">{trainingMeaning}</p> : null}
      {needsAcknowledgement ? (
        <>
          <div className="app-gap-small" />
          <Notice
            kind="caution"
            title="Lean gain without training"
            text="Without workouts logged, the surplus pauses after three weeks. Choose it knowing that, or pick Recomp or Maintenance."
            action={<MmButton label="I understand" kind="secondary" onPress={() => onAcknowledge?.()} />}
          />
        </>
      ) : null}
      {showPaces ? (
        <>
          <div className="app-gap-small" />
          <h2 className="app-subhead">How fast</h2>
          <p className="app-caption">
            Each pace shows what it costs you today. Slower keeps more muscle and is easier to keep up; you can change it any time on
            the Coach tab.
          </p>
          {paces.map((option) => {
            const { label, detail } = paceOptionText(option, { weightKg, fmt });
            return option.offered ? (
              <ChoiceCard
                key={option.pace}
                label={label}
                detail={detail}
                selected={(pace ?? FatLossPace.default) === option.pace}
                badge={option.pace === FatLossPace.default ? 'Default' : undefined}
                dense
                onPress={() => onPace?.(option.pace)}
              />
            ) : (
              <MmListRow key={option.pace} leadingIcon="info" title={label} subtitle={detail} dense />
            );
          })}
        </>
      ) : null}
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
