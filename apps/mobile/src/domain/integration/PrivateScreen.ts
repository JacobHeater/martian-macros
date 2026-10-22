/**
 * Keeps what is on screen out of the app switcher and, where the phone
 * allows it, out of screenshots (MM-157), for as long as a photo is shown.
 */
export interface PrivateScreen {
  /** Starts hiding the screen; gives the way to stop. */
  hide(): () => void;
}
