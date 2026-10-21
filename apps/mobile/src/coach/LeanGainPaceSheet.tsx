import { LeanGainPace } from '../domain/LeanGainPace';
import type { LeanGainPaceOption } from '../engine/LeanGainPaceOption';
import { leanGainPaceOptionText } from '../format/leanGainPaceOptionText';
import { ChoiceCard } from '../ui/ChoiceCard';

interface LeanGainPaceSheetProps {
  options: readonly LeanGainPaceOption[];
  /** The pace in force. */
  current: LeanGainPace;
  onChoose: (pace: LeanGainPace) => void;
}

/**
 * The two paces of lean gain, each with what it means for this person
 * today (MM-480). Built like the fat-loss pace sheet beside it (MM-128).
 */
export function LeanGainPaceSheet({ options, current, onChoose }: LeanGainPaceSheetProps) {
  return (
    <div className="coach-sheet">
      <h2 className="app-headline">Choose a gain pace</h2>
      <p className="app-text">How fast to gain. Slower puts less of the gain on as fat; the coach never goes faster than your training sets.</p>
      {options.map((option) => {
        const { label, detail } = leanGainPaceOptionText(option);
        return (
          <ChoiceCard
            key={option.pace}
            label={label}
            detail={detail}
            selected={option.pace === current}
            badge={option.pace === LeanGainPace.default ? 'Default' : undefined}
            onPress={() => onChoose(option.pace)}
          />
        );
      })}
    </div>
  );
}
