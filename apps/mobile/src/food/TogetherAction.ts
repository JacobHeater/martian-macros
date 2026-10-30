/**
 * What can be done to several logged foods at once (MM-630, MM-634), or to one from its menu (MM-714): only
 * ever their context, never their numbers. `copy` is to another day, `copyMeal` to another meal of the same day.
 */
export type TogetherAction = 'time' | 'meal' | 'day' | 'copyMeal' | 'copy' | 'delete';
