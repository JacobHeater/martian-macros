import { identityOf, type Identity } from './identity.ts';

/** What `mm screenshot` was asked for. */
interface ScreenshotArgs {
  /** `-d`'s value: an Android serial, a simulator's UDID, or a paired iPhone's name or devicectl id. */
  readonly device: string | undefined;
  /** `--phone`: the phone plugged in, the Android one as `mm run --phone` means (MM-732), or the iPhone with `--ios` (MM-536). It takes no value, so a path may follow it. */
  readonly phone: boolean;
  /** `--ios`: with `--phone`, the iPhone rather than the Android phone (MM-732). */
  readonly ios: boolean;
  /** For a phone, the app to ask: the real app unless `--env dev|demo` says, as `mm run --ios --phone` (MM-412, MM-536). A usage error as text. */
  readonly identity: Identity | string;
  /** Where to write the PNG, when given. */
  readonly out: string | undefined;
  readonly clipboard: boolean;
}

/** The flags that take a value, which is then not a path. */
const valued = new Set(['-d', '--env']);

/** Reads `mm screenshot [-d DEVICE | --phone [--ios]] [--env prod|dev|demo] [path] [--clipboard]` (MM-238, MM-403, MM-536, MM-732). */
export function screenshotArgs(args: readonly string[]): ScreenshotArgs {
  const at = args.indexOf('-d');
  return {
    device: at === -1 ? undefined : args[at + 1],
    phone: args.includes('--phone'),
    ios: args.includes('--ios'),
    identity: args.includes('--phone') && !args.includes('--env') && !args.includes('--prod') ? 'prod' : identityOf(args),
    out: args.find((arg, index) => !arg.startsWith('-') && !valued.has(args[index - 1] ?? '')),
    clipboard: args.includes('--clipboard'),
  };
}
