/**
 * Tells the user a rest is over (MM-191), while the app is open. It makes
 * no noise the phone's own settings would not allow.
 */
export interface RestSignal {
  restOver(): void;
}
