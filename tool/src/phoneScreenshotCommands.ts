/** The devicectl command lines of one phone screenshot. */
interface PhoneScreenshotCommands {
  /** Copies the request, the local file `localFile`, into the app's `Library/Caches`. */
  readonly request: (localFile: string) => string[];
  /** Opens the app: brings it to the front, or starts it; never restarts it. */
  readonly open: string[];
  /** Tells an app already in front to look for the request. */
  readonly nudge: string[];
  /** Copies the picture out of the app's `Library/Caches` to `path`. */
  readonly fetch: (path: string) => string[];
}

/**
 * The `xcrun devicectl` commands that ask the app `bundleId` on the phone
 * devicectl calls `phoneId` for a picture of itself, and copy it out
 * (MM-536). The names are the plugin's (`MmScreenshotPlugin.swift`):
 * `mm-screenshot-<stamp>.request` and `.png` in the app's data container,
 * and the Darwin notification `<bundle id>.mm-screenshot`.
 */
export function phoneScreenshotCommands(phoneId: string, bundleId: string, stamp: string): PhoneScreenshotCommands {
  const container = ['--domain-type', 'appDataContainer', '--domain-identifier', bundleId];
  const onPhone = (extension: string) => `Library/Caches/mm-screenshot-${stamp}.${extension}`;
  const device = ['xcrun', 'devicectl', 'device'];
  return {
    request: (localFile) => [...device, 'copy', 'to', '--device', phoneId, '--source', localFile, '--destination', onPhone('request'), ...container],
    open: [...device, 'process', 'launch', '--device', phoneId, bundleId],
    nudge: [...device, 'notification', 'post', '--device', phoneId, '--name', `${bundleId}.mm-screenshot`],
    fetch: (path) => [...device, 'copy', 'from', '--device', phoneId, '--source', onPhone('png'), '--destination', path, ...container],
  };
}
