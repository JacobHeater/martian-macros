import type { MealSize } from '../domain';

const labels: Readonly<Record<MealSize, string>> = {
  light: 'Light',
  regular: 'Regular',
  large: 'Large',
  veryLarge: 'Very large',
};

export const mealSizeLabel = (size: MealSize): string => labels[size];
