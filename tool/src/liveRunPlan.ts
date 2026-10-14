/** What `mm run --live` was asked for (MM-300). */
export interface LiveRunPlan {
  readonly port: number;
  /** Capacitor's own live-reload run, on `device`, through adb reverse on `port`. */
  readonly capRun: (device: string) => string[];
  /**
   * The Vite dev server, on this machine's IPv4 loopback only: adb reverse
   * connects to 127.0.0.1, and "localhost" binds only ::1 on Windows.
   */
  readonly devServer: string[];
  /**
   * The environment for Capacitor's run: `base` without
   * `NoDefaultCurrentDirectoryInExePath`, since Capacitor starts the
   * project's `gradlew` by its bare name from the Android folder, which
   * Windows refuses while that is set (some shells and agents set it).
   */
  readonly capRunEnv: (base: NodeJS.ProcessEnv) => NodeJS.ProcessEnv;
}

/**
 * Reads `--port N` from `args` (5173 when absent) and gives the two
 * commands of a live run, or the usage error to print. The device reaches
 * the dev server as its own `localhost` through adb reverse, which lands on
 * this machine's 127.0.0.1, so the server never listens on the network.
 */
export function liveRunPlan(args: readonly string[]): LiveRunPlan | string {
  const at = args.indexOf('--port');
  const given = at === -1 ? '5173' : args[at + 1];
  if (given === undefined || !/^\d+$/.test(given) || Number(given) < 1024 || Number(given) > 65535) {
    return '--port must be a number from 1024 to 65535.';
  }
  const port = Number(given);
  return {
    port,
    devServer: ['npx', 'vite', '--host', '127.0.0.1', '--port', `${port}`, '--strictPort'],
    capRunEnv: (base) => Object.fromEntries(Object.entries(base).filter(([name]) => name.toLowerCase() !== 'nodefaultcurrentdirectoryinexepath')),
    capRun: (device) => [
      'npx', 'cap', 'run', 'android',
      '--target', device,
      '--live-reload', '--host', 'localhost', '--port', `${port}`,
      '--forwardPorts', `${port}:${port}`,
    ],
  };
}
