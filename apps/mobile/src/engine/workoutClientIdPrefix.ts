/**
 * What the `clientId` of every workout the app writes to a health platform
 * starts with, followed by the workout's id (MM-189). A workout read back
 * with it is the app's own and is not imported.
 */
export const workoutClientIdPrefix = 'martian-macros-workout-';
