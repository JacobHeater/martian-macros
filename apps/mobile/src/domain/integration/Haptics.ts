/**
 * The phone's haptics (MM-661): one short tap under the finger, felt when a
 * long press starts choosing foods, so the person knows the hold took. The
 * phone decides whether it taps at all, so its own settings are respected.
 */
export interface Haptics {
  /** One short tap, now; nothing when the phone cannot or will not. */
  tap(): void;
}
