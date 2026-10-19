import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { stderr, stdout } from 'node:process';
import { apkPathOf, appIdOf, gradleTaskOf, identityOf, type Identity } from './identity.ts';
import { liveRunPlan } from './liveRunPlan.ts';
import { capture, run, start } from './proc.ts';

const webApp = 'apps/mobile';
const androidDir = `${webApp}/android`;

/**
 * Where the Android SDK is (MM-235): the environment first, then the
 * platform's default install location, so a plain shell works without
 * setting anything. Undefined means "hope it is on PATH".
 */
export function androidSdkFrom(env: NodeJS.ProcessEnv, platform: string, exists: (path: string) => boolean): string | undefined {
  for (const name of ['ANDROID_HOME', 'ANDROID_SDK_ROOT']) {
    const set = env[name];
    if (set !== undefined && set !== '') return set;
  }
  const candidates =
    platform === 'win32'
      ? [env['LOCALAPPDATA'] === undefined ? undefined : `${env['LOCALAPPDATA']}/Android/Sdk`]
      : platform === 'darwin'
        ? [env['HOME'] === undefined ? undefined : `${env['HOME']}/Library/Android/sdk`]
        : [env['HOME'] === undefined ? undefined : `${env['HOME']}/Android/Sdk`];
  return candidates.find((path) => path !== undefined && exists(path));
}

const sdk = () => androidSdkFrom(process.env, process.platform, existsSync);

const adbPath = () => {
  const home = sdk();
  return home === undefined ? 'adb' : `${home}/platform-tools/adb`;
};

const emulatorPath = () => {
  const home = sdk();
  return home === undefined ? 'emulator' : `${home}/emulator/emulator`;
};

/** What a failure to run adb at all means for whoever asked. */
const adbMissing = () =>
  new Error(
    'adb could not be run. Set ANDROID_HOME to the Android SDK (usually ' +
      (process.platform === 'win32' ? '%LOCALAPPDATA%\Android\Sdk' : '~/Android/Sdk') +
      '), or put platform-tools on PATH.',
  );

/**
 * Gradle's environment: when `JAVA_HOME` is unset, Android Studio's bundled
 * JDK is offered from its default place, so a plain shell builds (MM-235).
 */
function gradleEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  if (env['JAVA_HOME'] === undefined || env['JAVA_HOME'] === '') {
    const studio = 'C:/Program Files/Android/Android Studio/jbr';
    if (process.platform === 'win32' && existsSync(studio)) env['JAVA_HOME'] = studio;
  }
  // Gradle's Android plugin needs the SDK location too.
  if (env['ANDROID_HOME'] === undefined || env['ANDROID_HOME'] === '') {
    const home = sdk();
    if (home !== undefined) env['ANDROID_HOME'] = home;
  }
  return env;
}

// An absolute path: Windows may not resolve a command from the working
// directory at all (NoDefaultCurrentDirectoryInExePath).
const gradle = (dir: string) => resolve(dir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

/**
 * Ids of connected devices and running emulators, from `adb devices`. An
 * `adb` that cannot be run is its own, named error, never an empty list
 * (MM-235).
 */
export async function deviceIds(): Promise<string[]> {
  const result = await capture([adbPath(), 'devices']);
  if (result.code === 127) throw adbMissing();
  if (result.code !== 0) return [];
  return result.stdout
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.endsWith('device'))
    .map((line) => line.split(/\s+/)[0]!)
    .filter((id) => id !== '');
}

/** Ids of installed emulators. */
export async function emulatorIds(): Promise<string[]> {
  const result = await capture([emulatorPath(), '-list-avds']);
  if (result.code !== 0) return [];
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    // The emulator prints an INFO line about its configuration first.
    .filter((line) => line !== '' && !line.startsWith('INFO'));
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Makes sure a phone or emulator is connected, starting an emulator if
 * needed. `emulatorId` defaults to `MM_EMULATOR`, else the first installed.
 * `cold` skips the saved snapshot, which fixes an emulator that hangs
 * while restoring state.
 */
export async function ensureDevice({ emulatorId, cold = false }: { emulatorId?: string | undefined; cold?: boolean } = {}): Promise<number> {
  if ((await deviceIds()).length > 0) return 0;

  const installed = await emulatorIds();
  const id = emulatorId ?? process.env['MM_EMULATOR'] ?? installed[0];
  if (id === undefined) {
    stderr.write(
      'No phone connected and no emulator installed. Create one in Android Studio (Virtual Device Manager) or plug in a device with USB debugging enabled.\n',
    );
    return 69;
  }
  if (!installed.includes(id)) {
    stderr.write(`Emulator "${id}" not found. Installed: ${installed.length === 0 ? '(none)' : installed.join(', ')}\n`);
    return 64;
  }

  const { spawn } = await import('node:child_process');
  const child = spawn(emulatorPath(), ['-avd', id, ...(cold ? ['-no-snapshot-load'] : [])], { detached: true, stdio: 'ignore' });
  child.unref();

  stdout.write(`Waiting for ${id} to boot`);
  const deadline = Date.now() + 3 * 60_000;
  while (Date.now() < deadline) {
    const devices = await deviceIds();
    if (devices.length > 0) {
      const booted = await capture([adbPath(), '-s', devices[0]!, 'shell', 'getprop', 'sys.boot_completed']);
      if (booted.stdout.trim() === '1') {
        stdout.write(' ready.\n');
        return 0;
      }
    }
    stdout.write('.');
    await wait(3000);
  }
  stderr.write(`\nTimed out waiting for ${id}. If its window is stuck, close it and run \`mm emulator --cold\` to boot without the saved snapshot.\n`);
  return 69;
}

export async function runEmulator(repoRoot: string, args: readonly string[]): Promise<number> {
  if (args[0] === 'list') {
    const ids = await emulatorIds();
    stdout.write(ids.length === 0 ? 'No emulators installed.\n' : `${ids.join('\n')}\n`);
    return 0;
  }
  const ids = args.filter((arg) => !arg.startsWith('--'));
  const code = await ensureDevice({ emulatorId: ids[0], cold: args.includes('--cold') });
  if (code === 0) stdout.write('Device ready.\n');
  return code;
}

/**
 * The environment the web build runs in: `base`, plus `MM_DEMO_SEED=1` when
 * the build is to start from the demo scenario on every launch (MM-177).
 * The variable is never left over from the caller's shell.
 */
export function webBuildEnv(base: NodeJS.ProcessEnv, { seed, identity = 'dev' }: { seed: boolean; identity?: Identity }): NodeJS.ProcessEnv {
  const { MM_DEMO_SEED: _ignored, MM_IDENTITY: _alsoIgnored, ...rest } = base;
  return { ...rest, MM_IDENTITY: identity, ...(seed ? { MM_DEMO_SEED: '1' } : {}) };
}

/** Builds the web app for `identity` and syncs it into the Android shell. */
async function sync(repoRoot: string, { seed, identity }: { seed: boolean; identity: Identity }): Promise<number> {
  return run(['npm', 'run', 'android'], { cwd: `${repoRoot}/${webApp}`, env: webBuildEnv(process.env, { seed, identity }) });
}

/**
 * `mm build android [--release] [--env prod|dev]`: the web app, the sync
 * and the flavor's APK (MM-8). The dev twin unless `--env prod`; the demo
 * is `mm demo`'s.
 */
export async function runBuild(
  repoRoot: string,
  args: readonly string[],
  { seed = false, identity }: { seed?: boolean; identity?: Identity } = {},
): Promise<number> {
  if (args[0] !== 'android') {
    stderr.write('Usage: mm build android [--release] [--env prod|dev]\n');
    return 64;
  }
  const chosen = identity ?? identityOf(args);
  if (typeof chosen === 'string' && !['prod', 'dev', 'demo'].includes(chosen)) {
    stderr.write(`${chosen}\n`);
    return 64;
  }
  const who = chosen as Identity;
  const synced = await sync(repoRoot, { seed, identity: who });
  if (synced !== 0) return synced;
  const release = args.includes('--release');
  const androidRoot = `${repoRoot}/${androidDir}`;
  return run([gradle(androidRoot), gradleTaskOf(who, { release })], { cwd: androidRoot, env: gradleEnv() });
}

/** Builds, installs and launches `identity` on `device` (or the one device). */
async function installAndLaunch(
  repoRoot: string,
  device: string,
  { seed = false, identity }: { seed?: boolean; identity: Identity },
): Promise<number> {
  const built = await runBuild(repoRoot, ['android'], { seed, identity });
  if (built !== 0) return built;
  const apk = `${repoRoot}/${androidDir}/${apkPathOf(identity, { release: false })}`;
  const installed = await run([adbPath(), '-s', device, 'install', '-r', apk]);
  if (installed !== 0) return installed;
  // The activity's class keeps the package the code is in; the app id differs by flavor.
  return run([adbPath(), '-s', device, 'shell', 'am', 'start', '-n', `${appIdOf(identity)}/com.martianmacros.MainActivity`]);
}

/**
 * The one physical Android phone among `ids`, never an emulator (MM-234).
 * It throws, with what to do, when there is none or more than one.
 */
export function physicalAndroidDeviceId(ids: readonly string[]): string {
  const phones = ids.filter((id) => !id.startsWith('emulator-'));
  if (phones.length === 0) {
    throw new Error(
      'No Android phone connected. Connect a data-capable USB cable, enable USB debugging, and accept the authorization prompt on your phone.',
    );
  }
  if (phones.length > 1) {
    throw new Error(`Multiple Android phones connected: ${phones.join(', ')}. Select one with mm run -d DEVICE_ID.`);
  }
  return phones[0]!;
}

/**
 * The device a run is for, from `args` (MM-234): `-d DEVICE`, or with
 * `--env phone` the one physical phone, else the one connected device,
 * starting an emulator when none is. A number is the exit code of a failure.
 */
async function chosenDevice(args: readonly string[]): Promise<string | number> {
  const env = args.includes('--env') ? args[args.indexOf('--env') + 1] : undefined;
  if (env !== undefined && !['dev', 'prod', 'phone'].includes(env)) {
    stderr.write('--env must be one of: dev, prod, phone\n');
    return 64;
  }
  const device = args.includes('-d') ? args[args.indexOf('-d') + 1] : undefined;
  if (env === 'phone') {
    if (device !== undefined) {
      stderr.write('Use mm run -d DEVICE_ID for an explicit device, or mm run --env phone for automatic phone selection.\n');
      return 64;
    }
    try {
      return physicalAndroidDeviceId(await deviceIds());
    } catch (error) {
      stderr.write(`${error instanceof Error ? error.message : error}\n`);
      return 69;
    }
  } else if (env !== undefined) {
    stdout.write('The build has no per-environment defines; --env chooses nothing here (MM-232).\n');
  }
  if (device !== undefined) return device;
  const ready = await ensureDevice();
  if (ready !== 0) return ready;
  const devices = await deviceIds();
  if (devices.length > 1) {
    stderr.write(`More than one device is connected: ${devices.join(', ')}. Choose one with -d DEVICE.\n`);
    return 64;
  }
  return devices[0]!;
}

/** Waits until something answers on `127.0.0.1:port`, for up to `ms`. */
async function answers(port: number, ms: number): Promise<boolean> {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      await fetch(`http://127.0.0.1:${port}/`);
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  return false;
}

/**
 * `mm run --live` (MM-300): the app on the device from the Vite dev server,
 * with hot reload. The shell is built with Capacitor's own live reload
 * pointed at `localhost`, which adb reverse maps to this machine, so the
 * server never listens on the network. Runs until Ctrl+C. The live URL is
 * only in the git-ignored synced config; the next `mm run` replaces it.
 */
async function runLive(repoRoot: string, args: readonly string[]): Promise<number> {
  const plan = liveRunPlan(args);
  if (typeof plan === 'string') {
    stderr.write(`${plan}\n`);
    return 64;
  }
  const device = await chosenDevice(args);
  if (typeof device === 'number') return device;
  const app = `${repoRoot}/${webApp}`;
  // Capacitor copies the built files into the shell on every run, so they must exist.
  if (!existsSync(`${app}/dist/index.html`)) {
    const built = await run(['npx', 'vite', 'build'], { cwd: app });
    if (built !== 0) return built;
  }
  const server = start(plan.devServer, { cwd: app });
  const stop = async () => {
    await server.stop();
    await capture([adbPath(), '-s', device, 'reverse', '--remove', `tcp:${plan.port}`]);
  };
  process.once('SIGINT', () => void stop().then(() => process.exit(0)));
  if (!(await answers(plan.port, 30_000))) {
    stderr.write(`The dev server did not answer on port ${plan.port}. Is another one using it? Try --port.\n`);
    await stop();
    return 69;
  }
  stdout.write(
    `\nLive on ${device}: save a file under apps/mobile/src and the app reloads.\n` +
      'Ctrl+C ends the session; mm run puts the bundled app back.\n\n',
  );
  // Capacitor builds, installs and launches, then stays until Ctrl+C.
  const launched = await run(plan.capRun(device), { cwd: app, env: plan.capRunEnv(gradleEnv()) });
  await stop();
  return launched;
}

/**
 * `mm run [--env dev|prod|phone] [-d DEVICE] [--live [--port N]]`: build,
 * install and launch. `--env phone` selects the one physical phone, never
 * an emulator; `dev` and `prod` are accepted and change nothing, since the
 * build has no per-environment defines (one config). `--live` serves the
 * app from the dev server with hot reload instead (MM-300).
 */
export async function runApp(repoRoot: string, args: readonly string[]): Promise<number> {
  if (args.includes('--live')) return runLive(repoRoot, args);
  const device = await chosenDevice(args);
  if (typeof device === 'number') return device;
  // `--env prod` is the real app; `dev`, `phone` and nothing are the dev twin (MM-8).
  const identity = identityOf(args) as Identity;
  return installAndLaunch(repoRoot, device, { identity });
}

/**
 * `mm demo [--seed] -d <device>`: the isolated demo app on an exact device.
 * The app installs only under the demo identity (${appId}), so it can never
 * share the normal app's sandbox. With `--seed` the build replaces that
 * sandbox's data with the deterministic demo scenario on every launch and
 * says DEMO on every screen (MM-177); without it the data is left alone.
 */
export async function runDemo(repoRoot: string, args: readonly string[]): Promise<number> {
  const device = args.includes('-d') ? args[args.indexOf('-d') + 1] : args.includes('--device-id') ? args[args.indexOf('--device-id') + 1] : undefined;
  const seed = args.includes('--seed');
  const unknown = args.filter((arg) => arg.startsWith('-') && !['-d', '--device-id', '--seed'].includes(arg));
  if (device === undefined || device.startsWith('-') || unknown.length > 0) {
    stderr.write('Usage: mm demo [--seed] -d <Android device ID>\n');
    return 64;
  }
  const devices = await deviceIds();
  if (!devices.includes(device)) {
    stderr.write(`Choose an exact connected Android ID: ${devices.join(', ')}. Use "adb devices" to list phones and emulators.\n`);
    return 69;
  }
  stdout.write(
    `Starting Martian Macros DEMO (.demo)${seed ? ', seeded with the demo scenario on every launch' : ''}: only its isolated sandbox is touched. The normal app is untouched.\n`,
  );
  return installAndLaunch(repoRoot, device, { seed, identity: 'demo' });
}

/**
 * The command that puts the PNG at `path` on the clipboard as an image, for
 * `platform`; undefined where there is no way this runner knows (MM-238).
 */
export function clipboardImageCommand(platform: string, path: string): string[] | undefined {
  if (platform === 'win32') {
    // A quote in a PowerShell single-quoted string is written twice.
    const quoted = path.replaceAll("'", "''");
    const script =
      'Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; ' +
      `$image = [System.Drawing.Image]::FromFile('${quoted}'); ` +
      '[System.Windows.Forms.Clipboard]::SetImage($image); $image.Dispose()';
    // The clipboard needs a single-threaded apartment.
    return ['powershell', '-NoProfile', '-STA', '-Command', script];
  }
  if (platform === 'darwin') {
    return ['osascript', '-e', `set the clipboard to (read (POSIX file "${path}") as «class PNGf»)`];
  }
  if (platform === 'linux') return ['xclip', '-selection', 'clipboard', '-t', 'image/png', '-i', path];
  return undefined;
}

/**
 * `mm screenshot [-d DEVICE] [path] [--clipboard]`: a device's screen as a
 * PNG (MM-238). Captured on the device and pulled, never redirected through
 * the shell, which corrupts binary output in PowerShell 5.1. With no `-d`
 * the one physical phone wins over an emulator. `--clipboard` puts the
 * image on the clipboard: with a path as well as the file, with none
 * instead of one.
 */
export async function runScreenshot(args: readonly string[]): Promise<number> {
  const clipboard = args.includes('--clipboard');
  let device = args.includes('-d') ? args[args.indexOf('-d') + 1] : undefined;
  const out = args.filter((arg, at) => !arg.startsWith('-') && args[at - 1] !== '-d');
  try {
    if (device === undefined) {
      const ids = await deviceIds();
      device = ids.some((id) => !id.startsWith('emulator-')) ? physicalAndroidDeviceId(ids) : ids.length === 1 ? ids[0] : undefined;
      if (device === undefined) {
        stderr.write(
          ids.length === 0
            ? 'No device is connected.\n'
            : `More than one device is connected: ${ids.join(', ')}. Choose one with -d DEVICE.\n`,
        );
        return 69;
      }
    }
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(/[-:]/g, '').replace('T', '-');
    // Asked for the clipboard alone, the file is only a way to get there.
    const keepFile = out[0] !== undefined || !clipboard;
    const path = resolve(out[0] ?? (keepFile ? `mm-screenshot-${stamp}.png` : join(tmpdir(), `mm-screenshot-${stamp}.png`)));
    const onDevice = `/sdcard/mm-screenshot-${stamp}.png`;
    for (const step of [
      [adbPath(), '-s', device, 'shell', 'screencap', '-p', onDevice],
      [adbPath(), '-s', device, 'pull', onDevice, path],
      [adbPath(), '-s', device, 'shell', 'rm', onDevice],
    ]) {
      const result = await capture(step);
      if (result.code === 127) throw adbMissing();
      if (result.code !== 0) {
        stderr.write(`${result.stderr.trim() || result.stdout.trim() || 'adb failed'}\n`);
        return 1;
      }
    }
    if (!clipboard) {
      stdout.write(`${device} -> ${path}\n`);
      return 0;
    }
    const command = clipboardImageCommand(process.platform, path);
    const copied = command !== undefined && (await capture(command)).code === 0;
    if (!copied) {
      // The capture is not thrown away because the clipboard refused it.
      stderr.write(`The image could not be put on the clipboard. It is kept at ${path}\n`);
      return 1;
    }
    if (!keepFile) rmSync(path, { force: true });
    stdout.write(`${device} -> ${keepFile ? `${path} and the clipboard` : 'the clipboard'}\n`);
    return 0;
  } catch (error) {
    stderr.write(`${error instanceof Error ? error.message : error}\n`);
    return 69;
  }
}

/** Removes build outputs and caches. */
export function runClean(repoRoot: string): number {
  for (const path of [`${webApp}/dist`, `${androidDir}/app/build`, `${androidDir}/build`, `${androidDir}/.gradle`]) {
    const dir = `${repoRoot}/${path}`;
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
      stdout.write(`removed ${path}\n`);
    }
  }
  return 0;
}
