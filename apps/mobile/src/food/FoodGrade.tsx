import { useState } from 'react';
import { MmGradeBadge } from '../ui/MmGradeBadge';
import { useOverlays } from '../ui/useOverlays';
import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import { GradeOmission } from '../domain/food/grade/GradeOmission';
import { GradeMicronutrient } from '../engine/GradeMicronutrient';

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
  food: 'A grade for the food itself, from what it gives per calorie. Protein, fiber, vitamins and minerals count for it; sodium, sugars and saturated fat count against it, and so does a food that packs many calories into little weight. The amount you eat does not change it.',
  meal: 'The grades of this meal’s foods, each counted by its calories.',
  day: 'The grades of this day’s foods, each counted by its calories.',
} as const;

/**
 * What a food's source left out and the grade did not count (MM-382):
 * "Sugars and saturated fat aren’t stated for this food, so they weren’t
 * counted. Only 2 of the 10 vitamins and minerals the grade looks at are
 * stated, so they weren’t counted either." A food counted from fewer
 * than the ten says so: "Vitamins and minerals counted from the 4 stated."
 */
function notCountedSentences(grade: { notCounted: readonly GradeOmission[]; statedMicronutrients: number }): string[] {
  const sentences: string[] = [];
  const of = GradeMicronutrient.values.length;
  // A fiber that is not stated was bounded by the carbs, too few to change the letter (MM-567).
  if (grade.notCounted.includes('fiber')) sentences.push('Fiber isn’t stated for this food, but it has too few carbs for fiber to change the grade.');
  const label = grade.notCounted.filter((o) => o !== 'micronutrients' && o !== 'fiber').map(GradeOmission.label);
  if (label.length > 0) {
    const list = label.join(' and ');
    const verb = label.length === 1 ? 'isn’t' : 'aren’t';
    const it = label.length === 1 ? 'it wasn’t' : 'they weren’t';
    sentences.push(`${list.charAt(0).toUpperCase()}${list.slice(1)} ${verb} stated for this food, so ${it} counted.`);
  }
  if (grade.notCounted.includes('micronutrients')) {
    const either = label.length > 0 ? ' either' : '';
    sentences.push(
      grade.statedMicronutrients === 0
        ? `None of the ${of} vitamins and minerals the grade looks at are stated for this food, so they weren’t counted${either}.`
        : `Only ${grade.statedMicronutrients} of the ${of} vitamins and minerals the grade looks at are stated for this food, so they weren’t counted${either}.`,
    );
  } else if (grade.statedMicronutrients < of) {
    sentences.push(`Vitamins and minerals were counted from the ${grade.statedMicronutrients} that are stated.`);
  }
  return sentences;
}

/**
 * A food's, meal's or day's grade from A+ to D- (MM-370), or a question
 * mark when there can't be one. Pressed, either says in a popover what it
 * means, and what the food's source left unstated (MM-382), or why there is
 * none. Nothing is red (MM-108). It sits beside what it grades, outside
 * the part of a row that is pressed.
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
        // A second press closes the explanation (MM-565).
        if (open) {
          overlays.closeTop();
          return;
        }
        setOpen(true);
        const explanation =
          grade.kind === 'graded'
            ? {
                title: `Grade ${grade.letter}`,
                label: `Grade ${spoken(grade.letter)}`,
                message: [meaning[scope], ...(scope === 'food' ? notCountedSentences(grade) : [])].join(' '),
              }
            : { title: 'Can’t be graded', message: grade.reason };
        void overlays.popover({ ...explanation, anchor }).then(() => setOpen(false));
      }}
    />
  );
}
