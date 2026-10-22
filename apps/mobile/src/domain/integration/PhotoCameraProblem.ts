const values = [
  /** The person (or the phone's settings) did not allow the camera. */
  'notAllowed',
  /** No camera answered: none there, or none facing the way asked. */
  'noCamera',
  /** The camera is there but busy: another app, or a call, holds it. */
  'busy',
  /**
   * The page the app runs from may not use a camera at all: a web view
   * gives none outside a secure page, as in a live-reload session served
   * over the local network (MM-557). Allowing it in settings changes
   * nothing.
   */
  'insecurePage',
] as const;

/** Why the camera for progress photos did not start (MM-560). */
export type PhotoCameraProblem = (typeof values)[number];

export const PhotoCameraProblem = { values } as const;
