import type { MealKind } from '../domain';

const labels: Readonly<Record<MealKind, string>> = {
  balanced: 'Balanced',
  mostlyCarbohydrate: 'Mostly carbs (pasta, rice, pizza)',
  mostlyProtein: 'Mostly protein (meat or fish)',
  rich: 'Rich (fried, creamy, dessert)',
};

export const mealKindLabel = (kind: MealKind): string => labels[kind];
