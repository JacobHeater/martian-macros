import { copyFileSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appIdOf, displayNameOf, type Identity } from './identity.ts';
import type { Phone } from './ios.ts';
import { phoneScreenshotCommands } from './phoneScreenshotCommands.ts';
import type { Captured } from './proc.ts';

/** What a phone screenshot is for, and what it runs on; the tests give their own. */
interface PhoneScreenshotRequest {
  /** The app to ask; the real app is refused before anything runs. A usage error as text. */
  readonly identity: Identity | string;
  /** The phone, or why there is none (MM-412's choice). Asked only once the identity is allowed. */
  readonly choose: () => Promise<Phone | string>;
  readonly stamp: string;
  /** Where the PNG goes on this Mac. */
  readonly path: string;
  readonly capture: (command: readonly string[]) => Promise<Captured>;
  readonly sleep: (ms: number) => Promise<void>;
  readonly now: () => number;
  /** A line for the person at the terminal. */
  readonly say: (line: string) => void;
  /** How long to wait for the picture; 20 s unless given. */
  readonly timeoutMs?: number;
  /** How often to ask again and look; 1 s unless given. */
  readonly pollMs?: number;
}

const detail = (result: Captured) => result.stderr.trim() || result.stdout.trim() || `exit ${result.code}`;

const sizeOf = (path: string) => {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
};

/**
 * `mm screenshot --phone` (MM-536): asks the dev or demo app on the iPhone
 * for a picture of its own screen through `xcrun devicectl` alone, waits
 * for it, and copies it to `path`. Gives the exit code; the phone's name
 * when it worked is the caller's to print.
 */
export async function phoneScreenshot(request: PhoneScreenshotRequest): Promise<{ code: number; phone?: Phone }> {
  const { identity, say } = request;
  if (identity === 'prod') {
    say(
      'The real app (com.martianmacros) takes no screenshots: the plugin is in the dev and demo apps only (MM-536). ' +
        'Leave out --prod for the dev twin, or say --env demo; mm run --ios --phone --env dev installs it.',
    );
    return { code: 64 };
  }
  if (identity !== 'dev' && identity !== 'demo') {
    say(identity);
    return { code: 64 };
  }
  const phone = await request.choose();
  if (typeof phone === 'string') {
    say(phone);
    return { code: 69 };
  }
  const app = `${displayNameOf(identity)} (${appIdOf(identity)})`;
  const commands = phoneScreenshotCommands(phone.id, appIdOf(identity), request.stamp);
  const scratch = mkdtempSync(join(tmpdir(), 'mm-screenshot-'));
  try {
    const asked = join(scratch, `mm-screenshot-${request.stamp}.request`);
    writeFileSync(asked, `${request.stamp}\n`);
    const sent = await request.capture(commands.request(asked));
    if (sent.code !== 0) {
      say(
        `${app} could not be reached on ${phone.name}: ${detail(sent)}\n` +
          `Is it installed? mm run --ios --phone --env ${identity} installs it. Keep the phone unlocked.`,
      );
      return { code: 1, phone };
    }
    const opened = await request.capture(commands.open);
    if (opened.code !== 0) say(`${app} did not come to the front (${detail(opened)}). Open it on the phone; waiting for the picture.`);
    const timeoutMs = request.timeoutMs ?? 20_000;
    const deadline = request.now() + timeoutMs;
    // Copied into the scratch folder first, so a failed try never touches `path`.
    const fetched = join(scratch, `mm-screenshot-${request.stamp}.png`);
    for (;;) {
      await request.capture(commands.nudge);
      if ((await request.capture(commands.fetch(fetched))).code === 0 && sizeOf(fetched) > 0) {
        copyFileSync(fetched, request.path);
        return { code: 0, phone };
      }
      if (request.now() >= deadline) break;
      await request.sleep(request.pollMs ?? 1_000);
    }
    say(
      `No picture came back from ${phone.name} within ${Math.round(timeoutMs / 1000)} s. ` +
        `Unlock the phone and keep ${displayNameOf(identity)} open in front, from a build made after MM-536 (mm run --ios --phone --env ${identity}).`,
    );
    return { code: 1, phone };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}
