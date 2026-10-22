import type { PhotoCameraProblem } from '../domain/integration/PhotoCameraProblem';

/** What to do when the camera for progress photos did not open, by why (MM-560). */
export function photoCameraProblemText(problem: PhotoCameraProblem): string {
  switch (problem) {
    case 'notAllowed':
      return 'Allow the camera for Martian Macros in your phone’s settings, then come back. It is tried again when you do.';
    case 'noCamera':
      return 'No camera answered. Try again, or close and reopen the app.';
    case 'busy':
      return 'Another app or a call is using the camera. Close it, then try again.';
    case 'insecurePage':
      return (
        'This copy of the app is loaded from a development server over the network, where the phone gives the app no ' +
        'camera. Photos work in the app as installed; your settings are not the cause.'
      );
  }
}
