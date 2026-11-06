import type { FoodEntry } from '../domain/FoodEntry';
import { NutritionGoals } from '../domain/NutritionGoals';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MicrosPanel } from './MicrosPanel';

interface FoodMicrosFoldProps {
  /** One food as it will be logged, or a meal's foods. */
  entries: readonly FoodEntry[];
  /** The fold holds one food: no foods listed under a row, and what it leaves unstated said as its own. */
  one?: boolean | undefined;
}

/**
 * The micros of a food or a meal on its sheet (MM-733, the owner): the
 * Food screen's rows, each against the person's daily reference, under a
 * "Micros" fold beside "About this food". It starts closed on every open,
 * as every fold does, and is drawn only while open.
 */
export function FoodMicrosFold({ entries, one = false }: FoodMicrosFoldProps) {
  const { state } = useApp();
  const today = useCell(state.today);
  const setup = useLoaded(state.setup);
  const goals = useLoaded(state.nutritionGoals) ?? NutritionGoals.none;
  return (
    <MmDisclosure title="Micros">
      <MicrosPanel entries={entries} setup={setup} today={today} goals={goals} one={one} />
    </MmDisclosure>
  );
}
