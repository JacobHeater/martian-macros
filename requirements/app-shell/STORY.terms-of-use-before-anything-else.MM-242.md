---
id: MM-242
component: app-shell
status: in-progress
related: [MM-11, MM-13, MM-29, MM-57, MM-62, MM-94, MM-95, MM-96, MM-110, MM-112, MM-114, MM-147, MM-165, MM-184, MM-244, MM-453]
---

# Story: the terms of use come before anything else

## The decision

The owner's call (2026-10-12): "We need a EULA as one of the first app
guards. The language needs to be predicated on the panel of experts
guidance on legal language for health apps."

The panel was run for it: safety, privacy-security, product, coaching and
UX-accessibility, each independently and with research. Their reports, the
sources they retrieved and the chair's decisions are in
[`docs/agent-runs/mm242-eula/`](../../docs/agent-runs/mm242-eula/decision.md).

**Nobody on the panel is a lawyer or a clinician. The text that ships in
this ticket is a draft.** It must not go out in a release until a licensed
attorney has reviewed it and the owner has settled what is listed under
"Still to be decided". That review is a release gate (MM-94).

## What is built

- **The first guard, on every installation.** After the stores have
  loaded and before the theme chooser, onboarding, the adults-only screen,
  welcome back and the health re-check, the app shows the terms unless the
  version it carries has been agreed to. One position serves a new
  installation and one that already has records.
- **One screen, nothing hidden.** A short account first ("Before you
  start": not medical advice and not a medical device, the numbers are
  estimates, who should talk to a clinician first, emergencies, the person
  decides, adults only), a sentence saying the full terms cover more, then
  all sixteen sections in full, each under its own heading. Nothing is
  collapsed or behind a link.
- **Two real buttons, always in view:** "I agree" and "Not now". No box to
  tick, nothing pre-selected, no timer, and no waiting for the text to be
  scrolled. The actions sit under the scrolling text, never over it.
- **Agreeing** stores the version agreed to and the calendar day, in the
  app's database on the phone and nowhere else. Nothing is sent. The
  developer therefore holds no record that anyone agreed; a lawyer needs to
  know that.
- **Not now** records nothing. The screen says, without judgement, that
  the app needs the agreement, and offers "Read the terms again" and
  "Close the app". Someone with records on the phone is also offered
  "Erase all data" (asked to confirm), so a refusal never strands their
  records behind the guard.
- **Terms that changed.** The text ships with the app, so it changes only
  with an update. When the version carried differs from the one agreed to,
  the same screen says the terms have changed, what was agreed to before
  and when, what changed (written by hand for that version), and that the
  answer does not remove the person's records. `version` is raised only for
  a change that matters, so corrections of wording do not ask again.
- **Reading them again.** Settings, About, "Terms of use" shows the
  version and the day agreed, and opens the same text with no buttons.
  About also says "Not medical advice" in a line of its own, which is
  MM-96's Settings clause; the terms alone would not be "where a user
  would look".
- **Erase all data** removes the agreement with everything else, so first
  use starts with the terms again.
- **Failing closed.** An agreement that cannot be read is not an
  agreement: the app is not entered and offers to try again. An answer
  that cannot be saved is said aloud beside the buttons, records nothing,
  and can be given again.
- **Storage.** `TermsAcceptanceReader` and `TermsAcceptanceWriter`, part of
  the preferences repository, with the SQL and in-memory implementations
  under the same contract tests. Schema version 2 adds two columns to
  `user_preferences`; the first migration step takes a version 1 database
  there.
- **The text** is `apps/mobile/src/terms/termsOfUse.ts`. It is inside the
  voice test's reach on purpose, and it says nothing about the app that
  the code does not do today.

## What the text is careful about, and why

- It never says "nothing is uploaded" or that data "never leaves" the
  phone. The barcode and label reader is Google's ML Kit, and Google's own
  disclosure says that component reports technical details about itself.
  That was not observed here (MM-244); the terms say what Google says and
  that the component is not given the person's records.
- It claims no encryption, no secure deletion and no backup, because the
  app adds none.
- It uses "treat", "cure" and "diagnose" only to say what the app does not
  do, and never "prescribe", "safe" as an assurance, a promised result, or
  a helpline nobody has checked.
- The list of who should talk to a clinician first mirrors the health
  check and adds a catch-all; it says the app's limits are not medical
  clearance. It has no clinical sign-off (MM-29).

## Decided by the owner on 2026-10-13, and what is left for the attorney

1. **Who grants the licence.** Placeholder kept: "the developer of Martian
   Macros" until an entity exists or the attorney asks.
2. **Governing law and venue.** Left blank in the draft for the attorney.
3. **Disputes.** Left blank in the draft for the attorney.
4. **A contact address.** Left empty for the attorney.
5. **What counts as a change that matters**, and the effective date and
   version of the first released terms: still open, the attorney's.
6. **Where the guard sits.** First screen on every installation, as built.
7. **The privacy policy.** Drafted now, with the terms, for the same
   attorney (MM-95); the public page (MM-247) carries both.
8. **The four flagged behaviours.** Kept as built, listed for the attorney
   and the clinician (MM-29) to rule on.
9. **Store terms.** The same text, one source: the stores link to a page
   generated from the app's terms file (MM-247).

## Acceptance criteria

```gherkin
Scenario: First launch
  Given a new installation
  Then the terms are shown before the theme chooser and before onboarding
  And nothing is selected for the person and both actions can be pressed
  When they agree
  Then the version and the day are stored on the device
  And the theme chooser opens

Scenario: Agreed once
  Given the current version has been agreed to
  Then the terms are not shown again

Scenario: Records and no agreement
  Given an installation with a setup and no agreement
  Then the terms are shown before any other screen and no record is changed
  When they agree
  Then the app goes on to the screen it would otherwise have shown

Scenario: The terms changed
  Given an earlier version was agreed to
  Then the terms are shown saying they changed, with the version and day agreed to before
  And the app is not entered until the current version is agreed to

Scenario: Not now
  When the person chooses Not now
  Then no agreement is stored and nothing behind the guard can be reached
  And they are offered the terms again and a way to close the app
  And, when records exist, a way to erase them after confirming

Scenario: Reading the terms later
  When the person opens Terms of use from Settings
  Then the full text, its version and the day agreed are shown
  And nothing on that screen changes the agreement

Scenario: Erasing data
  When all data is erased
  Then no agreement remains and the terms are shown before the theme chooser

Scenario: Storage failures
  Given the agreement cannot be read
  Then the app is not entered and offers to try again
  Given the answer cannot be saved
  Then that is said beside the actions, nothing is recorded and it can be tried again

Scenario: The other guards are unchanged
  Given agreed terms and a profile under 18
  Then the adults-only screen is shown as before
  And the health check's "not medical advice" sentence stays where it was

Scenario: The words
  Then the short account is six sentences or fewer and carries the safety facts by itself
  And the terms contain none of: prescribe, guarantee, safe as an assurance, an
  unverified helpline, encryption, secure deletion, a backup, "nothing is uploaded"

Scenario: Substitutable storage
  Then the SQL and in-memory preferences pass the same contract for the agreement
  And a version 1 database upgrades with nothing lost and nobody yet agreed

Scenario: Reviewed before release
  Given no licensed attorney has reviewed the text
  Then this ticket says so and MM-94 lists the review as outstanding
```

## UI/UX

- Terms of use — `apps/mobile/src/gallery/screens/FirstRun.stories.tsx`
  (Stories: TermsOfUse, TermsNotNow, TermsChanged, TermsChangedNotNow). The
  guard, its "not now" state, and the changed-terms state for someone with
  records.
- Terms of use, read again — `apps/mobile/src/gallery/screens/Settings.stories.tsx`
  (Story: TermsOfUse).

## Notes

- Existing tickets this touches: MM-184 (the chooser is no longer the
  first screen of a new installation, though it is still before
  onboarding); MM-62 and MM-165 (after an erase the terms are shown, then
  the chooser, then onboarding); MM-147 (someone returning after a gap
  with an update in between can meet changed terms before the welcome-back
  screen). Each carries a note.
- Not verified: a screen reader's order and announcements, the hardware
  back button on the guard, and the layout at 200% text or 320 px wide.
  Those need a device and are listed in the decision record.
- The panel also found wording elsewhere in the app that the terms would
  sit against ("prescribe" in two caution messages, "safe" as an
  assurance in four places, "not a formula" on the welcome screen). Those
  are routed to MM-96, not changed here.

## Progress

**The privacy policy beside them (2026-10-21, MM-95).** Settings, About has "Privacy policy" under "Terms of use"; both are drawn by
the shared `LegalSections`. The public page (MM-247) carries both. Found while drafting it: section 10 still says the app makes no copy
of the records, which the backup (MM-63) contradicts; that is MM-453, for the owner and the attorney.


**Mechanism and draft text built (2026-10-12).** Tests in
`apps/mobile/test/app/termsOfUse.test.tsx` (the flow),
`apps/mobile/test/terms/termsText.test.ts` (the words), the preferences
and eraser contracts, and the upgrade test. Looked at in a browser from
the static Storybook build at phone size: the guard in Martian, the
changed-terms "not now" state in Light. `in-progress` until the text has
had its legal review and the open decisions are made.
