import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Tells `handler` of the phone's own back button until stopped. In a
 * browser there is no such button and nothing is listened to.
 */
export function onHardwareBack(handler: () => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => undefined;
  const listening = App.addListener('backButton', handler);
  return () => {
    void listening.then((listener) => listener.remove());
  };
}
