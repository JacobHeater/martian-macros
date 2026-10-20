import type { FatLossPace } from '../engine/FatLossPace';
import { FatLossPace as Paces } from '../engine/FatLossPace';
import type { PaceOption } from '../engine/PaceOption';
import type { Fmt } from '../format/Fmt';
import { paceOptionText } from '../format/paceOptionText';
import { ChoiceCard } from '../ui/ChoiceCard';
import { MmListRow } from '../ui/MmListRow';

interface PaceSheetProps {
  options: readonly PaceOption[];
  /** The pace in force; the default when none was chosen. */
  current: FatLossPace | undefined;
  weightKg: number;
  fmt: Fmt;
  onChoose: (pace: FatLossPace) => void;
}

/**
 * The three paces of fat loss, each with what it costs this person today
 * (MM-128). A pace the coach will not run is listed, with its reason, and
 * cannot be chosen.
 */
export function PaceSheet({ options, current, weightKg, fmt, onChoose }: PaceSheetProps) {
  const selected = current ?? Paces.default;
  return (
    <div className="coach-sheet">
      <h2 className="app-headline">Choose a pace</h2>
      <p className="app-text">How fast to lose. Slower keeps more muscle and is easier to keep up; the week as a whole is what counts.</p>
      {options.map((option) => {
        const { label, detail } = paceOptionText(option, { weightKg, fmt });
        return option.offered ? (
          <ChoiceCard
            key={option.pace}
            label={label}
            detail={detail}
            selected={option.pace === selected}
            badge={option.pace === Paces.default ? 'Default' : undefined}
            onPress={() => onChoose(option.pace)}
          />
        ) : (
          <MmListRow key={option.pace} leadingIcon="info" title={label} subtitle={detail} dense />
        );
      })}
    </div>
  );
}
