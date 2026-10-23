# Martian Macros agent guide

This is the canonical guide for AI agents and other automated contributors.
It holds only the rules that apply to every change. Rules for one part of the
repository live beside it, in a nested `AGENTS.md`, and you read one only when
your change touches that folder:

| You change | Also read |
| --- | --- |
| anything in `apps/mobile/` (screens, state, components, stories, tests) | [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md) |
| tables, migrations or repositories (`apps/mobile/src/data/`) | [apps/mobile/src/data/AGENTS.md](apps/mobile/src/data/AGENTS.md) |
| the Android or iOS shell, or a native plugin | [apps/mobile/android/AGENTS.md](apps/mobile/android/AGENTS.md), [apps/mobile/ios/AGENTS.md](apps/mobile/ios/AGENTS.md) |
| tickets in `requirements/` | [requirements/README.md](requirements/README.md) |
| the roadmap | [roadmap/README.md](roadmap/README.md), "Keeping the roadmap current" |
| a cross-domain review (the expert panel) | [agents/README.md](agents/README.md) |

Read only the "Where things stand" section of
[requirements/HANDOFF.md](requirements/HANDOFF.md) at the start of a session.
Read the session entries below it only when your work continues one of them.
For anything else, search for the lines you need rather than reading whole
files.

> **The app is a React HTML5 app in a thin native shell (MM-228)**: Android,
> and iOS since 2026-10-19 (MM-403). The web is never a product: the app runs
> from files inside the shell, offline. Architecture is in
> [docs/architecture.md](docs/architecture.md); what the app will not do is in
> [docs/non-goals.md](docs/non-goals.md).

## Usage (owner's rules, 2026-10-20)

Agent usage goes to feature work, not validation. CI validates.

- **Never run tests, checks or builds locally.** That covers `mm check`,
  `mm test`, vitest, typecheck, lint, `vite build`, Storybook builds,
  `xcodebuild` and Gradle. Write the tests, push, and let the PR's CI run
  them. You learn that a test failed only from CI: when you are notified, or
  when you check the open PRs at the start and end of a session. A regression
  test is written to fail with the bug; CI shows that it passes with the fix.
- **Small branches, in parallel.** One ticket, or one small group of tickets,
  per branch and per PR, each with its own CI. Never one long-lived branch
  that carries a milestone.
- **Subagents only when their role is required**, and all subagent runs in a
  session together take five minutes or less. Inside that budget, a role may
  run its own workflow to validate its requirements.
- **Search, don't read whole files.** Use grep for the lines you need. Don't
  re-read a guide that is already in context.
- **Don't watch CI.** Check PRs once at the start and once at the end of a
  session (`gh pr list`, then `gh pr checks <n>` for the open ones). Merge
  green ones; fix a red one in a follow-up branch.
- **Bookkeeping once a session.** The handoff is updated in one small PR
  per session, not in every feature PR. A feature PR places its tickets in
  the roadmap at different lines from its siblings (see below), so parallel
  PRs don't conflict.

## Working agreements

- Inspect the repository state before editing. Preserve unrelated and
  pre-existing changes; never discard or overwrite work you did not make.
  The owner's team id in the Xcode project and their `.claude/settings.json`
  edit stay unstaged in the working tree.
- Keep changes focused on the request. Follow existing patterns. Avoid
  unrelated refactors, generated-file edits, new dependencies and speculative
  behavior.
- **Requirements come first for behavior changes.** Before changing what the
  app does, create or update a ticket in `requirements/<component>/` (format
  in [requirements/README.md](requirements/README.md); `mm req next` gives the
  next ID, and two parallel branches must not take the same one). A
  documentation-only change or a refactor that changes no behavior needs no
  ticket.
- **Every bug gets a ticket and a regression test, at once**, wherever it was
  found. Name the guarding test in the ticket. Changing an existing test so
  that it passes around the bug is not a regression test. A bug that cannot be
  fixed yet still gets its ticket, and its test is skipped with the ticket's
  ID.
- **Keep the roadmap current (MM-245).** A ticket you create goes into a
  workstream in the same PR, as `built` when it is done and `remaining` and in
  a step otherwise. Insert it next to a related ID, not at the end of a list,
  so sibling PRs touch different lines. The progress page
  (`roadmap/progress.html`) is not committed (owner, 2026-10-22): never
  regenerate or stage it; `mm roadmap` builds it locally on request.
- **Keep the handoff current (MM-174)**, once a session: add the session at
  the top, delete the oldest of the three, and keep "Where things stand"
  true and short (what is in flight, what to build next, what waits on the
  owner). Durable rules belong in an `AGENTS.md`, not in the handoff.
  Nothing private goes in it.
- If a request is ambiguous in a way that matters for behavior, scope,
  privacy or data handling, ask. Questions to the owner go through the
  interactive question tool, never as a numbered list in chat: up to four at
  a time, concrete options, the recommendation first.
- **Health and profile data are sensitive.** Keep the design offline-first.
  Add no data transmission, analytics or external service unless it is
  required and documented, and change the terms of use together with what
  the app does with data (MM-244).
- Report uncertainty plainly. Never claim that something was verified unless
  it was, and say "not run locally; CI validates" where that is the case.

## Delivery (owner's standing rules)

- Work through the roadmap without waiting to be asked. Commit, push, open PRs
  with `gh`, and merge them yourself (`gh pr merge --merge`) once CI is green.
  The owner does not want to be involved in that.
- Create each branch from a fresh `origin/main`. Stage files by name, never
  `git add -A`. No stash juggling. If work depends on an unmerged PR, stack on
  it deliberately and say "builds on #N" in the description.
- `mm` is not on PATH in a non-interactive shell: run `./mm` from the repo
  root with Node 22 on PATH.

## Engineering principles (binding, MM-159)

These override convenience. Where principles conflict, Liskov substitution (L)
and interface segregation (I) win. The details and the tests that enforce them
are in [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md).

1. SOLID, designed for L and I first.
2. Every integration point is an interface that any subtype can replace. A
   vendor or platform package is imported only in its adapter folder;
   `openAppServices.ts` is the one place where implementations are chosen.
3. Consumers depend on the narrowest interface they need.
4. If a product or vendor decision is open, build against the interface and
   an in-memory fixture, and carry on.
5. One declaration per file.
6. All database access goes through a repository interface with a SQL
   implementation and an in-memory fixture.
7. Every interface has a contract suite run against every implementation.
8. A reusable part of a view is a design-system component. Screens use no raw
   HTML controls, and nothing native shows (MM-262).
9. Composition over inheritance; state lives in `state/` cells and
   controllers.

## Completion

Review your diff for unintended changes, and make sure the requirements, the
code and the tests agree. Then push, open the PR, and say in your reply what
changed, what was not run (everything, locally), and which PRs are open.
