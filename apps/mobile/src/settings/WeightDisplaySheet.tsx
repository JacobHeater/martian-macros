import { WeightDisplay } from '../domain/WeightDisplay';
import { weightDisplayDetail } from '../format/weightDisplayDetail';
import { weightDisplayLabel } from '../format/weightDisplayLabel';
import { ChoiceCard } from '../ui/ChoiceCard';
import './settings.css';

interface WeightDisplaySheetProps {
  /** The display in force. */
  current: WeightDisplay;
  onChoose: (display: WeightDisplay) => void;
}

/**
 * How much of the person's weight the app shows (MM-118): Everything, Trend
 * only or Hidden, each with what it shows. Built like the pace sheets
 * (MM-128): a headline, what it means, a card for each choice. The coach is
 * the same in all three, and the backup and exports keep the numbers.
 */
export function WeightDisplaySheet({ current, onChoose }: WeightDisplaySheetProps) {
  return (
    <div className="settings-sheet">
      <h2 className="app-headline">Weight display</h2>
      <p className="app-text">
        How much of your weight the app shows. The coach uses every weigh-in whichever you choose.
      </p>
      {WeightDisplay.values.map((display) => (
        <ChoiceCard
          key={display}
          label={weightDisplayLabel(display)}
          detail={weightDisplayDetail(display)}
          selected={display === current}
          badge={display === 'everything' ? 'Default' : undefined}
          onPress={() => onChoose(display)}
        />
      ))}
      <p className="app-caption">Your backup and any export still contain the numbers.</p>
    </div>
  );
}
