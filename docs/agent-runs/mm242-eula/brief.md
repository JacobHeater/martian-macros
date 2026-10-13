# Run brief

- **Task ID and requested outcome:** `mm242-eula`. The owner (2026-10-12):
  "We need a EULA as one of the first app guards. The language needs to be
  predicated on the panel of experts guidance on legal language for health
  apps." Outcome: guidance for one agreement and one guard screen, then the
  ticket (MM-242), the text and the screen built from it.
- **Audit mode:** `change`, planning. Each reviewer audited the existing
  behaviour its part of the agreement would describe (the guard order, the
  health check and its disclaimer, what is stored and fetched, erase, the
  voice rules) before proposing anything. Unreviewed: the rest of the app.
  This is not a whole-app claims or privacy audit.
- **For screens:** the guard did not exist when the reviews ran, so no
  render could be supplied. UX walked a proposal from the source of the
  comparable guards and said so; that walkthrough has to be repeated on the
  built story. Depth target: one screen, one decision (agree or not), five
  branches (saving, save failed, not now, changed version, read-only).
- **Baseline:** `feature/mm237-storybook-material` at `40c8d1b`, clean; it
  merged to `main` as `52d5494` while the reviews ran, with no further
  change to what they read.
- **Requirement IDs and files:** MM-242 did not exist; it was written from
  this run. Read by reviewers: MM-9, MM-11, MM-13, MM-29, MM-56, MM-57,
  MM-62, MM-68, MM-80, MM-87, MM-89, MM-94, MM-95, MM-96, MM-110, MM-112,
  MM-114, MM-147, MM-158, MM-165, MM-184.
- **Architecture, design and roadmap inputs:** `AGENTS.md`,
  `docs/architecture.md` (privacy section), `docs/evidence.md`,
  `docs/non-goals.md`, `design/voice-and-wording.md`, `roadmap/` in part.
  SHA-256 hashes of seven key inputs and each role's canonical files are in
  `state.json`; the reviewers had no shell and could not hash what they
  read, so not every file read is hashed.
- **Existing facts, non-goals and owner decisions:** offline-only (the one
  fetch is the food-pack download), US-only, adults only, no account and no
  server, requirements first, every screen has a story. No agreement,
  privacy policy or acceptance record existed. The only "not medical
  advice" text was one caption on the health check.
- **Acceptance criteria:** none existed. Each reviewer proposed some; the
  chair's selection is in MM-242 and marked there as this run's proposal
  until the owner accepts the ticket.
- **Role assignments:** safety (core), coaching (core), and the selective
  roles privacy-security, product and ux-accessibility, each independent
  and without sight of the others' reports. Chair: the parent session.
  Omitted core roles, with reasons:
  - training: No training content is in scope: the task is an agreement and one guard screen.
  - nutrition: The condition-specific numbers the safety reviewer flagged go to MM-29's qualified reviewer, not to a panel lens.
  - measurement: The only measurement claim in the agreement is that the numbers are estimates, which the evidence register already states.
  Not assigned: micronutrients, product-designer, architecture,
  react-capacitor, integrations, qa (the chair, as edit owner, did the
  implementation and verification; a QA review of the built screen is
  pending work).
- **Dependencies, constraints and unresolved choices:** nobody on the panel
  is a lawyer or a clinician; MM-29 (dietitian review) is open; MM-95
  (privacy policy) and MM-57 (licensing) are proposed. Health details and
  secrets are not in this folder.
- **Writer and ownership:** the parent session (Claude Opus 5.5) is the
  single edit owner, on `feature/mm242-eula`. Reviewers were read-only and
  returned Markdown; the chair saved each report as returned and added,
  under a marked heading, the template sections a reviewer did not use.
