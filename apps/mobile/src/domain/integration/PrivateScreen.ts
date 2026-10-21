/**
 * Keeps what is on screen out of the app switcher (MM-157), for as long as
 * a photo is shown. Android also refuses screenshots and screen recording
 * of it (`FLAG_SECURE`); iOS cannot refuse a screenshot, so there only the
 * app switcher's picture is blank.
 */
export interface PrivateScreen {
  /** Starts hiding the screen; gives the way to stop. */
  hide(): () => void;
}
