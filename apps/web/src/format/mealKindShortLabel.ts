import type { MealKind } from '../domain';

const labels: Readonly<Record<MealKind, string>> = {
  balanced: 'Balanced',
  mostlyCarbohydrate: 'Mostly carbs',
  mostlyProtein: 'Mostly protein',
  rich: 'Rich',
};

export const mealKindShortLabel = (kind: MealKind): string => labels[kind];
