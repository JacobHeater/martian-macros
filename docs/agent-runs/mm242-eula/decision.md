# Panel decision

The chair's synthesis of five independent reviews for MM-242. It records
what was decided and by whom. The panel advises; the owner decides. Nobody
involved is a lawyer or a clinician, and nothing here is legal advice.

## Facts versus proposals

- **Facts** (source inspection by the reviewers): the app had no
  agreement, no privacy policy and no acceptance record; the guards ran
  theme chooser, onboarding, adults-only, welcome back, health re-check;
  "not medical advice" appeared once, on the health check; erase empties
  every table including preferences; the app bundles Google ML Kit.
- **Proposals:** everything about where the guard sits, what the screen
  looks like and what the text says. MM-242 holds the chair's selection.

## Coverage

Five reports under `findings/`, each listing what it read and did not.
All of it is source inspection plus document retrieval. Nothing was run
and no screen was rendered by a reviewer. The chair then built the screen
and looked at it in a browser (the verification section below).

## Findings and where each went

| Finding | From | Disposition |
|---|---|---|
| No ticket, text or gate for legal terms | product P-1, UX-1 | MM-242 written; attorney review added to MM-94 |
| "Nothing is uploaded" is unverified while ML Kit is bundled | privacy PS-1 | Terms worded narrowly; MM-244 to observe it; owner chooses after |
| A privacy policy is required separately by Google Play | privacy PS-2 | Owner question (MM-242 item 7); belongs to MM-95 |
| Terms must not claim encryption, secure erase or backup | privacy PS-3, PS-4, PS-5 | Done in the text; tested by `termsText.test.ts` |
| Download reveals more than an IP address | privacy PS-7 | Terms say so; the Settings sentence is in MM-244's notes |
| Label photo may be left behind; reminders may survive erase | privacy PS-6, PS-4 | Unverified; in MM-244's notes, a bug each if confirmed |
| No Content-Security-Policy; offline is a convention | privacy PS-8 | Not taken up here; noted for the owner |
| Four condition-specific behaviours strain the wellness footing | safety S1 | Owner question (MM-242 item 8), attorney and MM-29 |
| "Prescribe", "safe", "not a formula" in app wording | safety S2, S4, S5 | Routed to MM-96; not changed here |
| No emergency statement anywhere | safety S3 | In the short account and section 6 of the terms |
| Do not hardcode a helpline; do not overstate the screening | safety S7, S8 | Done in the text; tested |
| MM-96's "findable in Settings" is unmet | safety S6, product P-3, coaching C-2 | A "Not medical advice" row in Settings, About; the health-check caption stays |
| Erase criteria in MM-62 and MM-165 are stale | product P-2 | Notes added to both tickets |
| Acceptance cannot be evidenced beyond the device | product P-5 | Stated in MM-242 for the attorney |
| Declining must not strand a person's records | product P-6, UX-7, coaching C-6 | "Erase all data" on the not-now state when records exist |
| A summary alone does not produce comprehension | coaching C-1 | Safety facts are in the short account and stay in context too |
| Liability language against the app's voice | coaching C-3 | Followed: no blame, fear or self-certification wording; tested |
| Legal phrases fail the voice test | coaching C-4 | Text kept inside the test's reach and written without them |
| Changed terms can stack with welcome back and the re-check | coaching C-5 | Note on MM-147; the changed-terms screen carries no return wording |
| Point at the health check, do not duplicate its list | coaching C-7 | Partly: the short account names groups; section 4 lists, as safety asked |
| No shared footer actions; failure message not spoken | UX-2, UX-5 | `MmFooterActions` added; the failure is a `role="alert"` beside the actions |
| Actions come after the text for a screen reader | UX-3 | The lead says where the buttons are; real `h2` headings; unverified on a device |
| No scroll gate, no silent disabled button | UX-4 | Followed |
| Focus on a root-screen swap; 200% text | UX-8, UX-10 | Unverified; pending device checks |
| The guard intercepts every first-run story and test | UX-9 | Harness and stories agree to the terms unless they are about them |
| Reading and failure states must fail closed | UX-11 | Built and tested |

## Conflicts between reviewers, and the chair's call

- **Where the guard sits.** Product: first of all, one rule for every
  installation. UX: after the theme chooser for a new person. Coaching:
  after the welcome screen. Safety and privacy: anywhere before the first
  profile field. Built as the first guard, because the owner asked for
  "one of the first app guards" and one position is one rule to test. It
  stays an owner decision.
- **The labels.** UX proposed "Agree and continue" and "Decline"; coaching
  proposed "I agree" and "Not now". Coaching's were used: they are the
  app's voice and "Not now" does not punish.
- **A list of conditions or a pointer.** Coaching wanted one sentence
  pointing at the health check; safety wanted the list with a catch-all.
  Both: groups in the short account, the list in section 4.
- **Forced scrolling.** One retrieved source suggests it raises awareness;
  UX and coaching weigh the accessibility cost higher. Not used. Whether
  the law needs more than one labelled press is the attorney's question.
- **The acceptance time.** Privacy proposed a UTC timestamp; product a
  calendar day, as other preferences use. The calendar day was stored.

## Safety and privacy blockers, and qualified review

- An attorney must review the whole text and the regulatory position
  before release. Each reviewer listed what; the lists are in their
  reports and are not merged here so nothing is lost.
- MM-29's dietitian or physician must review the clinical content of the
  clinician list, the emergency wording and the eating-disorder wording.
- MM-244 must be done before anyone states that nothing leaves the phone.

## Owner decisions actually made

Only the two in the request: there is an agreement, it is one of the first
guards, and its language follows the panel. Everything listed in MM-242
under "Still to be decided" is open.

## Edit owner and paths

The parent session, on `feature/mm242-eula`: `apps/mobile/src/terms`, the
guard in `AppRoot`, the preferences storage and schema, Settings, the
tests, the tickets and this folder.

## Verification, actual results and limits

- `mm check` on the branch: recorded in the pull request.
- New tests: the flow (`test/app/termsOfUse.test.tsx`), the words
  (`test/terms/termsText.test.ts`), the storage contracts, the eraser
  contract and the version 1 to 2 upgrade.
- Looked at in a browser from the static Storybook build at 412 by 915:
  the guard in the Martian palette, the changed-terms "not now" state in
  Light.
- Not done: TalkBack, the hardware back button, 200% text, 320 px width, a
  release build, and any reading by a lawyer or clinician. UX's
  walkthrough was of a proposal and has not been repeated on the built
  story by a reviewer.
