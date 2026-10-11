# CI monitoring (`mm ci`)

Watches a pull request's checks in the background and keeps what it sees, so
an agent carries on working and reads the changes when it next can (MM-209).
It only reads GitHub. It never merges, comments, reruns or pushes.

**It adds to the delivery workflow in `AGENTS.md`; it replaces none of it.**
Checking open pull requests at the start and the end of every session or turn
is still required. Nobody sits waiting on CI. The chair still decides and
performs every delivery action.

## What it does and does not promise

Three different things, kept apart:

1. **Observing and keeping changes.** Done by the watch, reliably. Stored
   events are the truth.
2. **Making them available to a running agent.** Done by a read that returns at
   once (`mm ci events`). Where the host reports a finished background command,
   `mm ci next` can also bring an event to the agent's attention.
3. **The agent acting on them.** Only the agent does this, and it says so by
   acknowledging. Nothing here puts text into a model's context by itself, and
   nothing here interrupts a model that is generating.

Printing to a terminal, a desktop notification or a changed file is not the
model having read anything. Treat every notification as a hint to go and read.

## Capability matrix

Tested on 2026-10-11 on Windows 11, `gh` 2.87.3.

| Capability | Status | How it was established |
| --- | --- | --- |
| Watch, events, snapshot, cursors, restart, handoff | Verified | 54 tests against a simulated `gh` (`tool/test/ci_watch_test.dart`) |
| Reading a real pull request through `gh`, read-only | Verified | `mm ci start`, `events`, `check` against PR #81 of this repository |
| Background watcher continuing while other work proceeds | Verified | Detached watcher polled PR #81 every 15 s while files were edited in the same session |
| Claude Code (VS Code extension): finished background command reaches the model with no new user prompt | Verified, with limits | A background command's completion arrived as a task notification at the next tool boundary of the active turn. It names the output file; the content needs a read. Not tested: delivery while the session is idle between turns |
| Claude Code: `mm ci next` run in the background as a wake-up | Verified | See "Local demonstration" below |
| Claude Code subagents (`panel-*`) running `mm ci` | Unsupported by design | Those profiles have no shell tool. They can read the state files; they cannot acknowledge |
| Copilot (VS Code Local, CLI, cloud) | **Untested** | No Copilot surface was available to the session that built this. The portable commands need only a shell; whether Copilot surfaces a background command's completion to the model is not known |
| MCP notifications creating a model turn | Not used | Not assumed anywhere |
| Interrupting a model mid-generation | Unsupported | No documented mechanism was found or used |
| macOS, Linux | Untested | Pure Dart and `gh`; nothing platform-specific is known, and nothing was run there |

## State

Runtime state lives in `.mm/ci-watch/<watch-id>/`, which is gitignored. It is
local to one machine and is **not** shared through git. Each watch has four
files, each with one kind of writer:

| File | Holds | Written by |
| --- | --- | --- |
| `watch.json` | Schema version, repository, pull request, poll interval | `start`, once |
| `state.json` | Latest snapshot (head commit, every check, summaries) and monitor health | The poller |
| `events.jsonl` | The events, one JSON object per line, ids rising | The poller, appending |
| `consumer.json` | Owner, each reader's cursor, stop request | The agent-facing commands |

Whole files are replaced by writing a new one and renaming it. A last event
line cut short by a crash is ignored and repaired on the next write. Events are
written before the snapshot and before any notification, and a poll repeated
after a crash does not store the same change twice. No token, and no CI log
text, is ever stored. A file in an unknown schema version is refused.

One pull request has one watch (`<owner>-<repo>-pr<N>`), so a second `start`
joins the first.

### Snapshot vocabulary

- `ciSummary`: `none` (no checks seen; **not** passed), `pending`, `failed`,
  `blocked` (waits on a person), `cancelled`, `passed`, `inconclusive` (only
  skipped or neutral checks), `unknown`.
- `requiredDiscovery`: `discovered`, `noneReported` (GitHub listed none, which
  is also what it says before any registers), `unknown`.
- `requiredSummary`: the required checks alone; null unless discovered.
- Each check keeps GitHub's own `providerStatus` and `providerConclusion`.
- `mergeable` and `mergeStateStatus` are GitHub's words, separate from CI. A
  green `ciSummary` is not permission to merge.

### Events

`watchStarted`, `checkChanged`, `ciSummaryChanged`, `headChanged`,
`requiredDiscoveryChanged`, `requiredSummaryChanged`, `prStateChanged`,
`monitorError`, `monitorRecovered`, `ownershipTransferred`, `watchStopped`.
An unchanged poll stores nothing. A new head commit emits `headChanged` and a
`ciSummaryChanged` marked `invalidatedByNewHead`; nothing from the old commit
carries over.

## Commands

Every command prints one JSON object (`schema`, `ok`, then the result or an
`error` with `code`, `message` and `action`) and returns at once, except `run`
(the watcher itself) and the optional `next`.

| Purpose | Command |
| --- | --- |
| Start or rejoin a watch and its watcher | `./mm ci start <pr> --owner <chair-id> [--repo owner/name] [--interval 60]` |
| List watches | `./mm ci list` |
| Latest stored snapshot | `./mm ci snapshot <watch-id>` |
| Unread events (does not wait, does not consume) | `./mm ci events <watch-id> --consumer <chair-id> [--after N] [--limit 100]` |
| Mark events as dealt with (owner only) | `./mm ci ack <watch-id> --consumer <chair-id> --through N` |
| Read GitHub now, storing nothing | `./mm ci check <pr>` |
| One poll without a watcher | `./mm ci poll <watch-id>` |
| Take a watch over | `./mm ci own <watch-id> --consumer <new-chair-id>` |
| Stop the watcher | `./mm ci stop <watch-id> [--delete] [--force]` |
| Forget acknowledged events | `./mm ci prune <watch-id>` |
| Optional bounded wait | `./mm ci next <watch-id> --consumer <chair-id> [--timeout 600]` |

Acknowledging means the chair has **acted on** the events, not that something
displayed them. The same event may be read more than once; act on each id once.

## How the chair uses it

The chair (the session that owns delivery and has a shell) owns the watches.
Specialists do not poll.

**Start of a session or turn**
1. Do the pull request check `AGENTS.md` requires (`gh pr list`, checks).
2. `./mm ci list`, then `./mm ci events` for each watch: process what is
   unread, then `ack`.
3. Apply the standing policy: merge what is green, fix what failed in a
   follow-up.

**After pushing**
1. `./mm ci start <pr> --owner <chair-id>`.
2. Carry on with other work at once.

**During work**, at natural stopping points (a finished subtask, between tool
calls): `./mm ci events <watch-id> --consumer <chair-id>`. It returns
immediately. A failure is recorded as follow-up work under the bug-ticket and
regression-test rule; do not drop what you are doing or switch branches while a
build runs.

**Before merging or calling something done**: read GitHub again with
`./mm ci check <pr>`. Confirm the head commit is the one you mean, that the
results are for it, whether required checks were discovered, and what GitHub
says about mergeability. A stored green result is never the only basis: it may
be for an older commit or minutes old.

**End of a session or turn**: reconcile again as at the start, and record in
`requirements/HANDOFF.md` each watch still open: watch id, pull request, head
commit, owner, acknowledged cursor, unread events and watcher health.

### On Claude Code

A command started in the background reports its completion to the model at the
next tool boundary. So, optionally, after `start`:

```text
./mm ci next <watch-id> --consumer <chair-id> --timeout 600     (run in the background)
```

When it finishes there is either an unread event or the timeout passed. Read
with `events`, act, `ack`. Do not chain one `next` after another in place of
doing work; the reads at task boundaries are the dependable path and need
nothing from the host.

### On Copilot

Untested. Use the commands above from a shell at task boundaries. Do not assume
a background command's completion reaches the model; check, and record what you
find in the capability matrix.

### Agents without a shell

The `panel-*` profiles cannot run commands. They may read
`.mm/ci-watch/<watch-id>/state.json` and `events.jsonl` directly, which are
plain JSON. They cannot acknowledge; they report to the chair.

## Watcher lifetime

A watcher is one detached process per watch. It **keeps running after the
session that started it ends**, so that events are not missed between
sessions, and stops by itself when any of these happens:

- the pull request is merged or closed;
- `./mm ci stop` is run (seen within about five seconds);
- eight hours have passed;
- the login is refused or the pull request cannot be found (no retry);
- eight polls in a row failed (it backs off, doubling up to ten minutes, and
  waits the full ten when GitHub says the rate limit was hit).

Each stop is itself an event (`watchStopped`, with the reason). A watcher that
died without saying so is noticed by its silence: after three poll intervals
without a heartbeat, `watcherAlive` is false and `start` will launch another.
`start` never launches a second watcher for a watch that is alive.

## Recovery

| Situation | What to do |
| --- | --- |
| A notification was missed, or none exists | Nothing was lost. `./mm ci events` returns everything unacknowledged |
| The machine or the watcher restarted | `./mm ci start <pr> --owner <chair-id>` rejoins the watch; unread events are still there |
| `gap: true` in an events result | Events you had not read were pruned. Go by `./mm ci snapshot` and `./mm ci check`, then acknowledge through the id it names |
| `monitorError` event, or `health.status` is `failing` | Follow the event's `action` (usually `gh auth status`). The last good snapshot is kept with its own time |
| `incompatibleState` | The files are from another version. `./mm ci stop <watch-id> --delete --force`, then start again |
| No watch on this machine (`noSuchWatch`) | Local state does not travel. `./mm ci start <pr>` rebuilds the snapshot from GitHub; its first event says the earlier history is not known |

## Changing chairs or tools

1. The old chair stops acting, finishes or records what it had not dealt with,
   and writes the watch ids, pull requests, head commits, its cursor and the
   watcher's health into the handoff.
2. The new chair runs `./mm ci own <watch-id> --consumer <new-chair-id>`. It
   starts from the old chair's cursor: nothing dealt with is replayed as new,
   nothing unread is skipped. The old chair can no longer acknowledge.
3. The new chair reads GitHub directly (`./mm ci check <pr>`) before doing
   anything, then processes the unread events.

**Same machine:** the state is there; steps 1 to 3 are all of it.
**Another machine:** the state is not there. Start the watch again; the
history before that is unknown to it and must be taken from the handoff and
from GitHub. Say so in the handoff.

Before acting on any event, check whether the action it calls for was already
done (the pull request is already merged, the fix is already pushed). An event
can be delivered twice; an action must not be.

## Security

- Uses the existing `gh` login. No token is read, printed or stored, and
  error text is reduced to one line with anything token-shaped removed.
- `gh` is run with an argument list, never through a shell. The repository
  must look like `owner/name` and the pull request must be a number.
- Check names, URLs and states from GitHub are data. Nothing in them is run.
- Read-only on GitHub: only `gh repo view`, `gh pr view` and `gh pr checks`.

## Local demonstration (2026-10-11, this repository)

Simulated scenarios are the 54 tests; they are labelled as simulated in the
test file. Against the real PR #81, read-only:

1. `./mm ci start 81 --owner claude-chair --interval 15` took a snapshot
   (`ciSummary: passed`, `requiredDiscovery: noneReported`, head `6a75f5c`) and
   started a detached watcher.
2. While this document was being written in the same session, `./mm ci list`
   showed `watcherAlive: true` with a fresh heartbeat.
3. `./mm ci events` returned the four stored events; `ack --through 4` moved
   the cursor; a second read returned none.
4. `./mm ci check 81` read GitHub live without storing.
5. `./mm ci next` ran in the background. An event was then produced (a real
   ownership transfer through `./mm ci own`, not a CI change: the pull
   request's checks did not change during the session). The command's
   completion reached the model as a task notification at the next tool
   boundary, with no user prompt. The event was already stored when it
   arrived, and the notification named an output file that then had to be
   read.
6. The other chair id was refused when it tried to acknowledge (`notOwner`).
7. `./mm ci stop` stopped the watcher within seconds and stored
   `watchStopped`. `./mm ci start` then rejoined the same watch
   (`created: false`), started a new watcher, and the three unacknowledged
   events were still there.
8. The demonstration watch was removed with `./mm ci stop --delete`.

Not demonstrated on a real pull request, only simulated: a failing check, a
push changing the head, a rerun, rate limiting and an expired login. Nothing
was pushed or changed on GitHub to manufacture them.
