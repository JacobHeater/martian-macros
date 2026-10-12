import { App } from '@capacitor/app';

/**
 * Puts the app in the background, as Android's back button does from a
 * home screen. The app is not ended: coming back finds it as it was.
 */
export function leaveApp(): void {
  void App.minimizeApp();
}
