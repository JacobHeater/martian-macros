import { MacroSplitChart } from '../charts/MacroSplitChart';
import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import { IntakeDay } from '../domain/IntakeDay';
import type { Meal } from '../domain/Meal';
import { mealLabel } from '../format/mealLabel';
import { useNetCarbs } from './useNetCarbs';
import './food.css';

interface MealSplitSheetProps {
  meal: Meal;
  day: CalendarDate;
  entries: readonly FoodEntry[];
}

const sum = (entries: readonly FoodEntry[], of: (entry: FoodEntry) => number) => entries.reduce((total, entry) => total + of(entry), 0);

/** The macro split of everything in one slot (MM-597), as the day's hero draws the day's. */
export function MealSplitSheet({ meal, day, entries }: MealSplitSheetProps) {
  const netCarbs = useNetCarbs();
  return (
    <div className="food-sheet">
      <h2 className="app-headline">{mealLabel(meal)}</h2>
      <p className="food-label">Macro split</p>
      <MacroSplitChart
        netCarbs={netCarbs}
        intake={
          new IntakeDay({
            date: day,
            kcal: sum(entries, (entry) => entry.kcal),
            proteinG: sum(entries, (entry) => entry.proteinG),
            carbsG: sum(entries, (entry) => entry.carbsG),
            netCarbsG: sum(entries, (entry) => entry.netCarbsG),
            fatG: sum(entries, (entry) => entry.fatG),
          })
        }
      />
    </div>
  );
}
