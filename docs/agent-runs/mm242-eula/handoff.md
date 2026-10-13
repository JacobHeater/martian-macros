# Checkpoint / handoff

- **Task, branch, commits:** `mm242-eula`; reviews ran on
  `feature/mm237-storybook-material` at `40c8d1b`; the work is on
  `feature/mm242-eula`, branched from `main` at `52d5494`.
- **Phase:** verification. One writer throughout (the parent session);
  no lease to release.
- **Completed reviews:** safety, privacy-security, product, coaching,
  ux-accessibility, all against `40c8d1b`. None is stale for the guidance
  they give; each predates the built screen, so none has seen it.
- **Coverage and blocked verification:** see `decision.md`. Blocked for
  the reviewers: reading FDA guidance PDFs and several papers. Blocked for
  everyone: anything needing a device.
- **Decisions, blockers, owner questions:** `decision.md` and MM-242's
  "Still to be decided". The blocker for release is legal review.
- **Tests:** in the pull request for `feature/mm242-eula`.
- **Open CI watches:** none kept beyond the pull request's own checks.
- **Exact next action:** the owner answers MM-242's open decisions and
  engages an attorney; MM-244 is run on a release build; a QA and a UX pass
  on the built story and on a device.
- **Reusable after input comparison:** every report, if `AppRoot.tsx`,
  `HealthStep.tsx`, `SettingsScreen.tsx`, `schema.ts` and
  `CoachingPolicy.ts` still hash as recorded in `state.json`. Three of
  those changed in this work (the guard, the Settings rows, the schema),
  so a report's line numbers in them are now out by a few lines.
- **Resume:** inspect status and diff, compare hashes, mark stale
  findings, take one owner before writing. No live session transfers.
