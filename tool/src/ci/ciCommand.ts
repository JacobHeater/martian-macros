import { spawn } from 'node:child_process';
import { stdout } from 'node:process';
import { CiWatch } from './ciWatch.ts';
import { CiWatchError } from './ciWatchError.ts';
import { GhFailure } from './ghFailure.ts';
import type { GhRunner } from './ghRunner.ts';
import { GithubReader } from './githubReader.ts';
import { ProcessGhRunner } from './processGhRunner.ts';
import { watchId } from './watchId.ts';
import { WatchLoop } from './watchLoop.ts';
import { WatchStore } from './watchStore.ts';

const usage = `mm ci: watch pull request checks without waiting for them (MM-209).
Every command prints one JSON object and returns at once, except "run".

  mm ci start <pr> --owner <id> [--repo owner/name] [--interval 60]
                                  Start (or rejoin) the watch and its
                                  background watcher. [--no-watcher] takes
                                  one snapshot and leaves polling to you.
  mm ci list                      Every watch on this machine.
  mm ci snapshot <watch>          The latest stored snapshot.
  mm ci events <watch> --consumer <id> [--after N] [--limit 100]
                                  Events after the cursor; does not wait.
  mm ci ack <watch> --consumer <id> --through N
                                  Mark events as dealt with (owner only).
  mm ci poll <watch>              Read GitHub once now (no watcher needed).
  mm ci check <pr> [--repo owner/name]
                                  Read GitHub now, storing nothing: what to
                                  go by before merging.
  mm ci own <watch> --consumer <id>
                                  Take the watch over from another chair.
  mm ci stop <watch> [--delete] [--force]
                                  Ask the watcher to stop.
  mm ci prune <watch>             Forget acknowledged events.
  mm ci next <watch> --consumer <id> [--timeout 600]
                                  Optional: return when there is an unread
                                  event, or at the timeout. For a host that
                                  reports finished background commands.
  mm ci run <watch>               The watcher itself (started by "start").
`;

const print = (json: Record<string, unknown>) => stdout.write(`${JSON.stringify(json, null, 2)}\n`);

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The `mm ci` command. `gh` is replaced in tests. */
export async function runCi(repoRoot: string, args: readonly string[], gh?: GhRunner): Promise<number> {
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    stdout.write(usage);
    return args.length === 0 ? 64 : 0;
  }
  const store = new WatchStore(`${repoRoot}/${WatchStore.relativePath}`);
  const reader = new GithubReader(gh ?? new ProcessGhRunner());
  const watch = new CiWatch({ store, reader });
  const verb = args[0]!;
  const rest = args.slice(1);
  const option = (name: string): string | undefined => {
    const at = rest.indexOf(`--${name}`);
    return at === -1 || at + 1 >= rest.length ? undefined : rest[at + 1];
  };
  const flag = (name: string) => rest.includes(`--${name}`);
  const positional = (): string | undefined => (rest.length === 0 || rest[0]!.startsWith('--') ? undefined : rest[0]);
  const need = (value: string | undefined, what: string): string => {
    if (value === undefined) throw new CiWatchError('badRequest', `Missing ${what}.`, usage);
    return value;
  };
  const number = (value: string | undefined, what: string): number => {
    const parsed = Number(need(value, what));
    if (!Number.isInteger(parsed)) throw new CiWatchError('badRequest', `${what} must be a number.`);
    return parsed;
  };

  try {
    let result: Record<string, unknown>;
    switch (verb) {
      case 'start': {
        const pr = number(positional(), 'the pull request number');
        const repository = option('repo') ?? (await reader.currentRepository());
        result = await watch.start({
          repository,
          pr,
          owner: need(option('owner'), '--owner'),
          intervalSeconds: option('interval') === undefined ? 60 : Math.min(Math.max(number(option('interval'), '--interval'), 15), 3600),
        });
        const id = watchId(repository, pr);
        const open = store.snapshot(id)?.open ?? true;
        if (!flag('no-watcher') && open && !watch.watcherAlive(id)) {
          const child = spawn(process.execPath, [process.argv[1]!, 'ci', 'run', id], {
            cwd: repoRoot,
            detached: true,
            stdio: 'ignore',
          });
          child.unref();
          result['watcherStarted'] = true;
          result['watcherPid'] = child.pid;
        } else {
          result['watcherStarted'] = false;
        }
        break;
      }
      case 'list':
        result = { watches: watch.list() };
        break;
      case 'snapshot':
        result = watch.getSnapshot(need(positional(), 'the watch id'));
        break;
      case 'events':
        result = watch.getEvents(need(positional(), 'the watch id'), {
          consumer: need(option('consumer'), '--consumer'),
          after: option('after') === undefined ? undefined : number(option('after'), '--after'),
          limit: option('limit') === undefined ? 100 : number(option('limit'), '--limit'),
        });
        break;
      case 'ack':
        result = watch.acknowledge(need(positional(), 'the watch id'), {
          consumer: need(option('consumer'), '--consumer'),
          through: number(option('through'), '--through'),
        });
        break;
      case 'poll': {
        const id = need(positional(), 'the watch id');
        if (watch.watcherAlive(id)) {
          throw new CiWatchError('watcherRunning', 'A background watcher is already polling this watch.', 'Read its events with "mm ci events".');
        }
        const events = await watch.poll(id);
        result = { watchId: id, newEvents: events.map((event) => ({ ...event })), ...watch.getSnapshot(id) };
        break;
      }
      case 'check': {
        const pr = number(positional(), 'the pull request number');
        const repository = option('repo') ?? (await reader.currentRepository());
        const snapshot = await reader.read(repository, pr, new Date());
        result = { live: true, stored: false, snapshot: snapshot.toJson() };
        break;
      }
      case 'own':
        result = watch.transferOwnership(need(positional(), 'the watch id'), { to: need(option('consumer'), '--consumer') });
        break;
      case 'stop': {
        const id = need(positional(), 'the watch id');
        result = watch.stop(id);
        if (flag('delete')) result = { ...result, ...watch.delete(id, { force: flag('force') }) };
        break;
      }
      case 'prune':
        result = watch.prune(need(positional(), 'the watch id'));
        break;
      case 'next': {
        const id = need(positional(), 'the watch id');
        const consumer = need(option('consumer'), '--consumer');
        const timeoutMs = (option('timeout') === undefined ? 600 : Math.min(Math.max(number(option('timeout'), '--timeout'), 1), 3600)) * 1000;
        const until = Date.now() + timeoutMs;
        let events = watch.getEvents(id, { consumer });
        while ((events['events'] as unknown[]).length === 0 && Date.now() < until && watch.watcherAlive(id)) {
          await wait(2000);
          events = watch.getEvents(id, { consumer });
        }
        result = { ...events, watcherAlive: watch.watcherAlive(id) };
        break;
      }
      case 'run': {
        const id = need(positional(), 'the watch id');
        if (watch.watcherAlive(id)) {
          throw new CiWatchError('watcherRunning', 'A background watcher is already polling this watch.');
        }
        const reason = await new WatchLoop({ watch, sleep: wait, now: () => new Date(), pid: process.pid }).run(id);
        result = { watchId: id, stopped: reason };
        break;
      }
      default:
        throw new CiWatchError('badRequest', `Unknown command "${verb}".`, usage);
    }
    print({ schema: WatchStore.schemaVersion, ok: true, ...result });
    return 0;
  } catch (error) {
    if (error instanceof CiWatchError) {
      print({ schema: WatchStore.schemaVersion, ok: false, error: error.toJson() });
      return error.code === 'badRequest' ? 64 : 1;
    }
    if (error instanceof GhFailure) {
      print({
        schema: WatchStore.schemaVersion,
        ok: false,
        error: { code: 'github', kind: error.kind, message: error.message, action: error.action },
      });
      return 1;
    }
    throw error;
  }
}
