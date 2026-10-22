/** What `mm run --ios --phone --live` was asked for (MM-557). */
export interface IosLivePlan {
  readonly port: number;
  /** The address the phone loads the app from: the dev server on this Mac's Wi-Fi address. */
  readonly url: string;
  /**
   * The Vite dev server, on `host` only: an iPhone has no adb reverse, so
   * it reaches the Mac over the Wi-Fi they share, and nothing else listens.
   */
  readonly devServer: string[];
  /** The synced shell's `capacitor.config.json`, pointed at `url` (http, so cleartext). */
  readonly liveConfig: (synced: string) => string;
}

/**
 * Reads `--port N` from `args` (5173 when absent) and gives the live run
 * for the Mac at `host`, or the usage error to print.
 */
export function iosLivePlan(args: readonly string[], host: string): IosLivePlan | string {
  const at = args.indexOf('--port');
  const given = at === -1 ? '5173' : args[at + 1];
  if (given === undefined || !/^\d+$/.test(given) || Number(given) < 1024 || Number(given) > 65535) {
    return '--port must be a number from 1024 to 65535.';
  }
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return `"${host}" is not an IPv4 address the phone can reach.`;
  const port = Number(given);
  const url = `http://${host}:${port}`;
  return {
    port,
    url,
    devServer: ['npx', 'vite', '--host', host, '--port', `${port}`, '--strictPort'],
    liveConfig: (synced) => `${JSON.stringify({ ...JSON.parse(synced), server: { url, cleartext: true } }, null, '\t')}\n`,
  };
}
