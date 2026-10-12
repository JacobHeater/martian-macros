import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { stderr, stdout } from 'node:process';
import { capture, run } from './proc.ts';

const webApp = 'apps/mobile';
const androidDir = `${webApp}/android`;

const sdk = () => process.env['ANDROID_HOME'] ?? process.env['ANDROID_SDK_ROOT'];

const adbPath = () => {
  const home = sdk();
  return home === undefined ? 'adb' : `${home}/platform-tools/adb`;
};

const emulatorPath = () => {
  const home = sdk();
  return home === undefined ? 'emulator' : `${home}/emulator/emulator`;
};

// An absolute path: Windows may not resolve a command from the working
// directory at all (NoDefaultCurrentDirectoryInExePath).
const gradle = (dir: string) => resolve(dir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

/** Ids of connected devices and running emulators, from `adb devices`. */
export async function deviceIds(): Promise<string[]> {
  const result = await capture([adbPath(), 'devices']);
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

/** Builds the web app and syncs it into the Android shell. */
async function sync(repoRoot: string): Promise<number> {
  return run(['npm', 'run', 'android'], { cwd: `${repoRoot}/${webApp}` });
}

/** `mm build android [--release]`: the web app, the sync and the APK. */
export async function runBuild(repoRoot: string, args: readonly string[]): Promise<number> {
  if (args[0] !== 'android') {
    stderr.write('Usage: mm build android [--release]\n');
    return 64;
  }
  const synced = await sync(repoRoot);
  if (synced !== 0) return synced;
  const task = args.includes('--release') ? 'assembleRelease' : 'assembleDebug';
  const androidRoot = `${repoRoot}/${androidDir}`;
  return run([gradle(androidRoot), task], { cwd: androidRoot });
}

const appId = 'com.martianmacros.martian_macros.demo';

/** Builds, installs and launches the app on `device` (or the one device). */
async function installAndLaunch(repoRoot: string, device: string): Promise<number> {
  const built = await runBuild(repoRoot, ['android']);
  if (built !== 0) return built;
  const apk = `${repoRoot}/${androidDir}/app/build/outputs/apk/debug/app-debug.apk`;
  const installed = await run([adbPath(), '-s', device, 'install', '-r', apk]);
  if (installed !== 0) return installed;
  return run([adbPath(), '-s', device, 'shell', 'am', 'start', '-n', `${appId}/.MainActivity`]);
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
 * `mm run [--env dev|prod|phone] [-d DEVICE]`: build, install and launch.
 * `--env phone` selects the one physical phone, never an emulator; `dev`
 * and `prod` are accepted and change nothing, since the build has no
 * per-environment defines (one config).
 */
export async function runApp(repoRoot: string, args: readonly string[]): Promise<number> {
  const env = args.includes('--env') ? args[args.indexOf('--env') + 1] : undefined;
  if (env !== undefined && !['dev', 'prod', 'phone'].includes(env)) {
    stderr.write('--env must be one of: dev, prod, phone\n');
    return 64;
  }
  let device = args.includes('-d') ? args[args.indexOf('-d') + 1] : undefined;
  if (env === 'phone') {
    if (device !== undefined) {
      stderr.write('Use mm run -d DEVICE_ID for an explicit device, or mm run --env phone for automatic phone selection.\n');
      return 64;
    }
    try {
      device = physicalAndroidDeviceId(await deviceIds());
    } catch (error) {
      stderr.write(`${error instanceof Error ? error.message : error}\n`);
      return 69;
    }
  } else if (env !== undefined) {
    stdout.write('The build has no per-environment defines; --env chooses nothing here (MM-232).\n');
  }
  if (device === undefined) {
    const ready = await ensureDevice();
    if (ready !== 0) return ready;
    const devices = await deviceIds();
    if (devices.length > 1) {
      stderr.write(`More than one device is connected: ${devices.join(', ')}. Choose one with -d DEVICE.\n`);
      return 64;
    }
    device = devices[0]!;
  }
  return installAndLaunch(repoRoot, device);
}

/**
 * `mm demo -d <device>`: the isolated demo app on an exact device. The app
 * installs only under the demo identity (${appId}), so it can never share
 * the normal app's sandbox.
 */
export async function runDemo(repoRoot: string, args: readonly string[]): Promise<number> {
  const device = args.includes('-d') ? args[args.indexOf('-d') + 1] : args.includes('--device-id') ? args[args.indexOf('--device-id') + 1] : undefined;
  if (device === undefined || device.startsWith('-')) {
    stderr.write('Usage: mm demo -d <Android device ID>\n');
    return 64;
  }
  const devices = await deviceIds();
  if (!devices.includes(device)) {
    stderr.write(`Choose an exact connected Android ID: ${devices.join(', ')}. Use "adb devices" to list phones and emulators.\n`);
    return 69;
  }
  stdout.write('Starting Martian Macros DEMO (.demo): only its isolated sandbox is touched. The normal app is untouched.\n');
  return installAndLaunch(repoRoot, device);
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
