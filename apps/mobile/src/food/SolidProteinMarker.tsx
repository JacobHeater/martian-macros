import { useState } from 'react';
import { ProteinSpreadRule } from '../engine/ProteinSpreadRule';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { MmIcon } from '../ui/MmIcon';
import { MmPressable } from '../ui/MmPressable';
import { useOverlays } from '../ui/useOverlays';
import './food.css';

interface SolidProteinMarkerProps {
  /** The meal's protein. */
  proteinG: number;
  /** The least protein that earns the marker, for this person. */
  thresholdG: number;
}

/**
 * The quiet mark of a meal with a solid serving of protein (MM-125).
 * Pressed, it says what it means, as a grade does (MM-597); a second
 * press closes it.
 */
export function SolidProteinMarker({ proteinG, thresholdG }: SolidProteinMarkerProps) {
  const overlays = useOverlays();
  const [open, setOpen] = useState(false);
  const whole = (value: number) => roundHalfAwayFromZero(value) + 0;
  return (
    <span className="food-meal-marker">
      <MmPressable
        label="A solid serving of protein"
        expanded={open}
        onPress={(anchor) => {
          if (open) {
            overlays.closeTop();
            return;
          }
          setOpen(true);
          void overlays
            .popover({
              title: 'A solid serving of protein',
              message:
                `${whole(proteinG)} g of protein in this meal; ${whole(thresholdG)} g or more earns the mark ` +
                `(${ProteinSpreadRule.markerGPerKg} g per kg of your reference weight). ` +
                'Spreading protein over the day may help slightly. Your daily total matters much more.',
              anchor,
            })
            .then(() => setOpen(false));
        }}
      >
        <MmIcon name="checkCircle" size={16} />
      </MmPressable>
    </span>
  );
}
