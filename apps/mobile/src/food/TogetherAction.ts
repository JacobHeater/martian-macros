/** What can be done to several logged foods at once (MM-630, MM-634): only ever their context, never their numbers. */
export type TogetherAction = 'time' | 'meal' | 'day' | 'copy' | 'delete';
