import { useState } from 'react';
import { MmGradeBadge } from '../ui/MmGradeBadge';
import { useOverlays } from '../ui/useOverlays';
import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';

interface FoodGradeProps {
  grade: FoodGradeValue;
  /** What is graded ("Peanut butter", "Lunch", "This day"), said with the grade. */
  subject: string;
  /** A food's own grade, or the calorie-weighted grade of a meal or a day; said when it is pressed. */
  scope?: 'food' | 'meal' | 'day';
}

/** "B+" read aloud as "B plus". */
const spoken = (letter: string) => letter.replace('+', ' plus').replace('-', ' minus');

const meaning = {
  food: 'A grade for the food itself, per 100 g, from what it contains. The amount you eat does not change it.',
  meal: 'The grades of this meal’s foods, each counted by its calories.',
  day: 'The grades of this day’s foods, each counted by its calories.',
} as const;

/**
 * A food's, meal's or day's grade from A+ to D- (MM-370), or a question
 * mark when there can't be one. Pressed, either says in a popover what it
 * means or why there is none. Nothing is red (MM-108). It sits beside what
 * it grades, outside the part of a row that is pressed.
 */
export function FoodGrade({ grade, subject, scope = 'food' }: FoodGradeProps) {
  const overlays = useOverlays();
  const [open, setOpen] = useState(false);
  const graded = grade.kind === 'graded';
  return (
    <MmGradeBadge
      letter={graded ? grade.letter : undefined}
      label={graded ? `Grade ${spoken(grade.letter)} for ${subject}` : `No grade for ${subject}. Why?`}
      expanded={open}
      onExplain={(anchor) => {
        setOpen(true);
        const explanation = graded
          ? { title: `Grade ${grade.letter}`, label: `Grade ${spoken(grade.letter)}`, message: meaning[scope] }
          : { title: 'Can’t be graded', message: grade.reason };
        void overlays.popover({ ...explanation, anchor }).then(() => setOpen(false));
      }}
    />
  );
}
