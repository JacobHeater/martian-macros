import type { TogetherAction } from './TogetherAction';

/**
 * The one list of what a food, a logged meal, a meal or the chosen foods can have done to them, in one
 * order (MM-714, the owner: the same items on one food and on many; MM-715 adds the other phone). Every menu
 * that offers these draws this list, so none drifts from the others.
 */
export const togetherActionItems: readonly { readonly value: TogetherAction; readonly label: string }[] = [
  { value: 'time', label: 'Change time' },
  { value: 'meal', label: 'Move to another meal' },
  { value: 'day', label: 'Move to another day' },
  { value: 'copyMeal', label: 'Copy to another meal' },
  { value: 'copy', label: 'Copy to another day' },
  { value: 'phone', label: 'Copy to another phone' },
  { value: 'delete', label: 'Delete' },
];
