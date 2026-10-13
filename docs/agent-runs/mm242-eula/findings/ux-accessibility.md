# Review report: UX & accessibility (MM-242, end-user licence guard)

## Scope and traceability

- **Role:** ux-accessibility (canonical role `agents/roles/ux-accessibility.md`), read-only subagent session, Claude Opus 5.5.
- **Task:** MM-242, planning. Audit mode: `change` (proposed guard screen and its Settings entry, plus the existing behaviour they depend on).
- **Branch / commit:** `feature/mm237-storybook-material`, 40c8d1b (as briefed; I cannot run git).
- **Requirement files:** none for MM-242. A glob of `requirements/**/*MM-242*` returned nothing. A case-insensitive search for licence / EULA / terms of use across the repository found only food-pack data licensing (MM-57 and related), nothing about a user agreement.
- **Input hashes:** not computed. I have no shell, so the chair needs to hash the inputs listed under "Audit coverage".
- **Config files read in full:** `AGENTS.md`, `agents/roles/ux-accessibility.md`, `agents/panel-protocol.md`, `agents/review-contract.md`.

## Existing facts versus proposals

### Existing facts (source inspection only)

1. **Guard order** in `C:\Users\jacob\dev\martian-macros\apps\mobile\src\app\AppRoot.tsx`:
   - setup loading or failed (27-38)
   - theme preference loading or failed, with a `Notice` and a "Try again" `MmButton` (39-51)
   - `ThemeChooserScreen` when there is no setup and the theme is unselected (53)
   - `OnboardingScreen` (54)
   - `AdultsOnlyScreen` (56)
   - `WelcomeBackScreen` (57-58)
   - `HealthRecheckScreen` (59-61)
   - `HomeShell` (62)
2. **No terms guard, acceptance store or terms text exists** anywhere in `apps/mobile/src`.
3. **`Screen`** (`apps/mobile/src/app/Screen.tsx:18-27`):
   - With a `title` it draws an app bar whose title is the `h1` (`ui/MmAppBar.tsx:21`).
   - `BackButton` draws nothing unless the screen was pushed (`app/BackButton.tsx:6-9`).
   - `footer` is rendered after `<main>` as a flex sibling, not an overlay (`Screen.tsx:22-25`; `app.css:1-14`).
4. **No existing guard uses `footer`.** Its only user is `train/WorkoutScreen.tsx:77`.
   - `ThemeChooserScreen` puts Continue at the end of the scrolling body (`ThemeChooserScreen.tsx:72`); `HealthRecheckScreen` does the same (75-83).
   - The onboarding wizard has a private always-visible action bar outside `Screen` (`onboarding/OnboardingScreen.tsx:224-231`, `onboarding.css:17-21`), which carries the bottom safe-area inset.
   - `Screen` adds no padding or safe-area inset to `footer`.
5. **Save and failure pattern** (`ThemeChooserScreen.tsx:33-44, 70-72`): the label becomes "Saving…", the button is switched off by passing no `onPress`, and a caution `Notice` appears in the body on failure. `HealthRecheckScreen.confirm` (37-49) and `OnboardingScreen.finish` (122-142) have no failure handling at all.
6. **`MmButton`** sets `disabled` when `onPress` is undefined (`ui/MmButton.tsx:26`), min-height 48px (`ui/ui.css:13`). The disabled colours are `--selected` and `--text3` (`ui.css:38-43`); contrast was not measured.
7. **`MmCheckRow`** is a `<label>` wrapping a native checkbox, the whole row is the target, min-height 48px (`ui/MmCheckRow.tsx:12-15`; `ui.css:400-409`).
8. **`MmDisclosure`** has a toggle that is a `<button aria-expanded>`, not a heading (`ui/MmDisclosure.tsx:29-44`).
9. **`Notice`** has no live-region role (`ui/Notice.tsx:33`). The only `role="alert"` uses are `train/ProgressionSettingsScreen.tsx:102` and `ui/MmClockTimeDialog.tsx:69`.
10. **Hardware back** (`app/HardwareBack.tsx:17-21`): closes the top overlay, else the top pushed screen, else `leaveApp()`. On a root guard with nothing pushed, back puts the app in the background.
11. **Pushed screens cover the root** (`app/NavigatorHost.tsx:63-70`). `AdultsOnlyScreen` pushes `SettingsScreen` over a guard (`AdultsOnlyScreen.tsx:31`).
12. **No focus management on a root-screen change.** `.focus()` is called only in `MmDialog` and `MmSheet`.
13. **Type is in rem** "so text follows the phone's text size" (`theme/tokens.css:114-125`). The viewport meta does not block zoom (`apps/mobile/index.html:5`). The global focus ring is a 2px outline (`theme/base.css:43-46`).
14. **Settings** has an "About" group with one pushed row, "How this works" (`settings/SettingsScreen.tsx:174-183`). "Erase all data and start over" is in the Data group (198-203, logic 48-59).
15. **Story coverage test:** any `*Screen|*Sheet|*Step.tsx` file with no covering story fails (`apps/mobile/test/gallery/stories.test.tsx:35-41, 57-61`). First-run stories use `newInstallScenario` and `walkOnboarding` (`gallery/screens/FirstRun.stories.tsx`).

### Proposals

Everything under "Proposed design", "Proposed acceptance criteria" and "Dark patterns to exclude" is a recommendation, not repository behaviour or an approved requirement.

## Audit coverage

- **Inspected (read in full unless noted):**
  - `apps/mobile/src/app/`: `AppRoot.tsx`, `Screen.tsx`, `App.tsx`, `NavigatorHost.tsx`, `HardwareBack.tsx`, `BackButton.tsx`, `ThemeChooserScreen.tsx`, `AdultsOnlyScreen.tsx`, `HealthRecheckScreen.tsx`, `WelcomeBackScreen.tsx`, `app.css`
  - `apps/mobile/src/onboarding/`: `OnboardingScreen.tsx`, `onboarding.css`
  - `apps/mobile/src/ui/`: `MmButton.tsx`, `MmCheckRow.tsx`, `MmDisclosure.tsx`, `Notice.tsx`, `MmListRow.tsx`, `MmAppBar.tsx`; `ui.css` lines 1-150 and 385-564 plus targeted greps
  - `apps/mobile/src/about/`: `HowThisWorksScreen.tsx`, `EvidenceQuestionScreen.tsx`
  - `apps/mobile/src/settings/SettingsScreen.tsx`
  - `apps/mobile/src/gallery/screens/FirstRun.stories.tsx`
  - `apps/mobile/test/gallery/stories.test.tsx`
  - greps only: `theme/tokens.css`, `theme/base.css`, `apps/mobile/index.html`
- **Not inspected:**
  - `platform/leaveApp` and `platform/onHardwareBack`
  - the preferences and setup repository interfaces and `state/AppState`
  - `MmOverlays`, `MmDialog`, `MmSheet` internals
  - `MmIconName` (whether a suitable icon exists)
  - `newInstallScenario` / `demoScenario` contents, `screenStory.tsx`, `StoryApp.tsx`
  - `.storybook/preview`
  - the Android shell (WebView text-zoom setting)
  - `docs/architecture.md`, `docs/non-goals.md`, `requirements/HANDOFF.md`
  - requirement tickets MM-184, MM-83, MM-112, MM-147 (known only from code comments)
  - all tests other than `stories.test.tsx`
- **Absent implementation:** the terms guard, acceptance persistence, terms text and Settings entry do not exist (searched scope above).
- **Evidence method:** static source inspection and external research. There was no render, no Storybook run, no device, no TalkBack and no measured contrast. Nothing here certifies accessibility conformance.
- **Blocked verification:** rendered layout at 320 CSS px and 200% text, TalkBack order and announcements, hardware back on the device, contrast of the disabled button.

## Novice mobile experience

- **Bounded goal:** a first-time adult opens the app on a phone, has to get past the terms to start setup, and can find those terms again later.
- **Depth target (counted from the proposal):** one screen with 1 decision (agree or decline), 0 entries, and 5 branches (saving, save failed, declined, changed version, read-only from Settings).
- **Area labels:**
  - Proposed terms guard: pre-build analytical walkthrough of a proposal (below). The contract requires a walkthrough on the built screen, so this must be repeated on the story once it exists.
  - `ThemeChooserScreen`, `AdultsOnlyScreen`, `HealthRecheckScreen`, `WelcomeBackScreen`, `HowThisWorksScreen`, `EvidenceQuestionScreen`, `SettingsScreen`: surveyed (source read, no step record, no render). No finding in these says anything about their usability.
- **What the person must notice, decide, remember and interpret (hypothesised):**
  - Notice: that this is a legal agreement, and where the actions are.
  - Decide: agree or not.
  - Remember: nothing, provided the terms can be reached later.
  - Interpret: legal prose. This is the dominant burden and is a content matter outside my remit.
- **Evidenced versus hypothesised burden:** research supports the claim that people largely do not read such text (see Sources). Any claim about this particular screen is a hypothesis until rendered and tested.

## Proposed design

### 1. Structure

**Frame.** Use `Screen` with `title="Terms of use"` and `roomy`.
- As a root guard, the app bar supplies the `h1` and no Back button.
- Pushed from Settings, the same component gets Back for free (facts 3 and 10).
- One component with two modes, `guard` and `read-only`, keeps the text identical in both places.

**Top of the body, in this order:**
1. One lead sentence saying what this is and what is being asked, for example "Before you start, please read and accept these terms."
2. A version and effective-date line.
3. A short "In short" section under its own `h2`: a handful of plain-language points, with a sentence saying the full terms below are what applies.
4. For a screen-reader user, one sentence here saying the Agree and Decline buttons follow the text at the bottom of the screen.

**Full text.** Put it in the scrolling body, expanded by default, as numbered sections each with a real `h2`.
- Use the existing `app-subhead` / `app-text` classes as `EvidenceQuestionScreen.tsx:22-23` does.
- Do not put the binding text inside `MmDisclosure`. Its toggle is a button, not a heading (fact 8), so heading navigation would be lost, reading everything would take one tap per section, and collapsed terms read as hidden terms.
- Source basis: WCAG 2.4.6 (descriptive headings help people find content); the COGA note's patterns on summaries and chunking; the FTC's naming of "hard-to-find-and read disclosures". Applying these to this screen is my inference.

**Actions.** Put them in the `Screen` footer, always in view: a primary `MmButton` "Agree and continue" and a secondary `MmButton` "Decline", and nothing else.
- Because the footer is a flex sibling of the scrolling `<main>` and not a sticky overlay (fact 3), a focused element in the body cannot be covered by it. That meets the intent of WCAG 2.4.11 by construction (inference from source; verify in a render).
- Keep the footer small. The WCAG 1.4.10 understanding document warns that fixed content can make reading "difficult if not impossible" when zoomed.

**Scroll-to-end gating: do not use it.**
- No retrieved source shows that it improves comprehension.
- The Kitkowska et al. blog reports that forced scrolling raised awareness, with no figures on the page I retrieved.
- Obar and Oeldorf-Hirsch report 74% skipping and 98% missing planted clauses, where the choice was a quick-join clickwrap versus reading. That is not a test of scroll gating.
- The cost falls on screen-reader, switch and large-text users. This is my inference: a control disabled for a reason that is only visual, and scroll-position detection that may not fire when TalkBack moves focus.
- A disabled `MmButton` gives no reason for being off (fact 6).

**Checkbox: not recommended from the UX side.**
- It adds a second action and a disabled state for one decision.
- I retrieved no evidence that it improves understanding.
- A single button whose label names the act is an explicit affirmative action.
- Whether a checkbox is needed for enforceability is a legal question (see chair requests).
- If the owner requires one: use `MmCheckRow`, unticked by default, immediately above the button. Keep the button enabled, and on a press with the box unticked show a message that says why.

### 2. Interaction states

- **Loading the acceptance record:** spinner, as AppRoot does for theme.
- **Failed to read it:** fail closed (never treat as accepted), with a `Notice` and "Try again", mirroring `AppRoot.tsx:39-51`.
- **Saving:** label "Saving…", repeat presses ignored (ThemeChooser pattern).
- **Save failed:**
  - Stay on the screen, with nothing recorded.
  - Show a caution `Notice` next to the actions (not at the top of a long body), in a live region so it is spoken. `Notice` has no role today (fact 9).
  - The action must be available again.
- **Decline:**
  - Do not dead-end or loop.
  - Replace the content in place with a neutral explanation: the app cannot be used without the terms, and nothing about the person has been saved (true for a new person).
  - Offer two `MmButton`s: "Read the terms again" and "Close the app" (the existing `leaveApp`).
  - No dialog and no shaming copy.
- **Hardware back:** on the guard it backgrounds the app (fact 10). That is the right behaviour and needs no interception. On the decline state, back returns to the terms.
- **Return without having accepted:** the guard shows again from the top, with no penalty, no count and no nagging wording.
- **Changed version for an existing person:**
  - Same screen, titled to say the terms have changed.
  - Lead with what changed (authored per version), then the version and date previously accepted, then the full text.
  - Existing data is untouched while undecided.
  - The decline state must say what happens to the stored data and offer a way to erase it (see UX-7).
- **Screen reader:** order is title (`h1`), lead, "In short", sections, then the footer buttons last in the DOM. After acceptance, the next screen's heading should be announced. Focus handling on a root swap does not exist today (fact 12).
- **Large text:** body text is in rem (fact 13). At 200% text and 320 CSS px wide there must be no horizontal scrolling, no clipping, and the footer must leave most of the height for reading.

### 3. Reaching the terms later

- **Where:** Settings, "About" group, directly under "How this works" (`SettingsScreen.tsx:174-183`).
- **Row:** an `MmListRow` titled "Terms of use", subtitle "Version N · accepted <date>", a trailing chevron, and a leading icon (name not checked).
- **Destination:** a pushed screen, the same component in read-only mode. It shows the version, effective date and date accepted at the top, the same text, Back, and no Agree or Decline.

### 4. Task walkthrough (analytical, on the proposed design)

There is no render and no built screen. This is based on the source of `Screen`, `ThemeChooserScreen` and the shared controls.

Person: a first-time adult on an Android phone at default text size. Task: get from first launch to setup.

| Step | Sees | Must decide or know | Action | Sign it worked | Risk |
|---|---|---|---|---|---|
| 1 | "Terms of use" bar, lead sentence, version line, "In short" points, Agree and Decline at the bottom | That this is a required agreement | None | n/a | Passes if the lead sentence and both buttons are visible without scrolling at 360x640. Unverified. |
| 2 | Summary, then numbered headed sections | Whether to read on; legal prose to interpret | Scrolls the body | Body scrolls, footer stays | Content burden is high and outside UX remit. The summary must not contradict the text. |
| 3 | Two labelled buttons | Agree or decline; what each does | Taps "Agree and continue" | Label becomes "Saving…" | Fails if Decline is a low-emphasis text link. |
| 4 | Next screen (onboarding welcome) | Nothing | n/a | Screen change | For TalkBack, the sign of success is unverified (UX-8). |
| 3b | (save fails) caution notice by the buttons, button usable again | That nothing was recorded | Taps again | As step 4 | Fails if the notice sits at the top of a long body or is not spoken (UX-5). |
| 3c | (Decline) explanation and two buttons | Leave, or read again | Taps either | App backgrounds, or the terms return | Fails for an existing person if no route to their data is offered (UX-7). |
| 5 | (later) Settings, About, "Terms of use" with version and date | That legal text lives under About | Taps the row | Pushed screen with Back | "About" holds one row today. Discoverability is plausible but unverified. |

## Findings

**UX-1. Documentation or requirement gap. High. Confidence high (searched).**
- No MM-242 ticket, terms text, version model or acceptance criteria exist.
- Impact: the screen cannot be reviewed against anything.
- Remediation: write the ticket with Gherkin criteria (proposed set below) and link the story under `## UI/UX`.
- Domain: requirements, chair.

**UX-2. Design/usability improvement. Medium. Confidence high on source.**
- No shared footer action-bar component exists. `Screen.footer` is unstyled (`Screen.tsx:25`), and the only always-visible action bar is onboarding's private CSS with the safe-area inset (`onboarding.css:17-21`).
- Impact: a screen-local footer would duplicate it and risks sitting under the gesture bar.
- Remediation: add one design-system component for footer actions (engineering principle 8), with a story.
- Domain: react-capacitor, product-designer.

**UX-3. Usability problem found by inspection (of the proposal against `Screen.tsx:22-25`). Medium. Confidence medium.**
- In linear screen-reader order, the actions come after the whole legal text.
- Expected: a TalkBack user knows at the top that the actions exist and where they are.
- Remediation: the orienting sentence in the lead, real `h2` headings, and the footer as a labelled region.
- Verification: needs TalkBack on a device.

**UX-4. Evidence-supported domain concern. Medium. Confidence medium.**
- Gating acceptance on scroll position, or on a silently disabled `MmButton` (`MmButton.tsx:26`), adds an accessibility barrier without retrieved evidence of better comprehension.
- Remediation: no scroll gate, and the button always operable.

**UX-5. Usability problem found by inspection. Medium. Confidence high on source.**
- The existing failure pattern would not be spoken and could be off-screen. `Notice` has no live role (`Notice.tsx:33`), and ThemeChooser places it in the body (`ThemeChooserScreen.tsx:70`).
- Rule: WCAG 4.1.3.
- Remediation: put the failure message in a live region adjacent to the actions.
- Domain: react-capacitor for the component change.

**UX-6. Design/usability improvement, with an owner decision. Medium. Confidence medium.**
- Where the guard sits in the order matters in two ways.
  - It must sit before `AdultsOnlyScreen`. That guard pushes Settings (`AdultsOnlyScreen.tsx:31`), and pushed layers cover the root (`NavigatorHost.tsx:63-70`).
  - Placed before `ThemeChooserScreen`, the long text is read in the default Martian palette with no chance to choose another. Placed after, a preference is saved before acceptance.
- UX preference: theme, then terms, then onboarding for a new person; and terms before every other guard for an existing person.
- Legal and privacy input is needed.

**UX-7. Unverified hypothesis requiring investigation (privacy and recovery). High. Confidence medium.**
- An existing person who declines changed terms has no in-app route to erase their data, because Erase is inside Settings (`SettingsScreen.tsx:198-203`), behind the guard.
- Remediation: offer "Erase all data" with the existing confirm on the decline state for existing people, and say plainly that data stays on the device until then.
- Needs the privacy reviewer and the owner.

**UX-8. Unverified hypothesis requiring investigation. Medium. Confidence low.**
- No focus management exists when the root screen is swapped (fact 12). After acceptance, focus may fall to the document, and what TalkBack announces is unknown.
- This is an existing condition for ThemeChooser to Onboarding as well.
- Needs device verification. If confirmed, it becomes a BUG ticket with a regression test.

**UX-9. Documentation or requirement gap (stories and tests). Medium. Confidence medium (scenario files not read).**
- A new root guard will intercept every first-run story and test that starts from `newInstallScenario` (`FirstRun.stories.tsx:14-74`), and possibly the demo scenarios, unless acceptance is seeded or walked.
- Each state listed in section 2 needs a story.
- Domain: react-capacitor, QA.

**UX-10. Unverified hypothesis requiring investigation. Medium. Confidence low.**
- At 200% text on a 320 CSS px wide screen, a footer with two buttons may consume too much height, or the labels may wrap badly.
- Whether the Android WebView applies the system font scale to rem text was not inspected.
- Rules: WCAG 1.4.4 (F69) and 1.4.10.
- Needs a render and a shell check.

**UX-11. Design/usability improvement. Medium. Confidence high on source.**
- The acceptance record needs its own loading and failed-to-read states that fail closed and offer a retry. Otherwise a read error either admits the person or traps them.
- Pattern exists at `AppRoot.tsx:39-51`.

## Research

- **Status:** performed, partly blocked.
- **Surface:** direct, with WebSearch for discovery and WebFetch for retrieval. Access date for everything is 2026-10-12.
- **Questions:** which WCAG 2.2 criteria apply; Android/Material guidance for full-screen dialogs and consent; evidence on scroll-to-accept versus explicit action; recognised dark patterns.
- **PANEL_RESEARCH_BLOCKED (retrieval) for:**
  - Material Design 3 dialog guidelines (`m3.material.io/components/dialogs/guidelines` and `/overview`, plus `m2.material.io/components/dialogs`): only the page title was returned.
  - Obar and Oeldorf-Hirsch journal and SSRN pages: 403.
  - EDPB Guidelines 05/2020, European Commission terms-and-conditions study summary, Behavioural Insights Team literature review, FTC report: the PDFs came back as unreadable binary.
  - Kitkowska et al. CHI 2022 full paper: not retrieved, so its effect sizes are unverified.
- No claim below rests on those documents' contents. No Material rule is asserted beyond the one retrieved line.

## Sources and evidence

| URL | Title, date | Supported claim | Applicability and limits |
|---|---|---|---|
| https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | Understanding SC 2.5.8 (date null) | AA: targets at least 24 by 24 CSS px, with exceptions; consider the stricter 2.5.5 for important controls | Normative text. A web standard applied to a WebView app. 48px rows exceed it on source, unmeasured. |
| https://www.w3.org/WAI/WCAG22/Understanding/reflow.html | Understanding SC 1.4.10 (null) | AA: no two-dimensional scrolling at 320 CSS px; fixed content can make reading "difficult if not impossible" | Supports a minimal footer. The footer sizing rule is my inference. |
| https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html | Understanding SC 1.4.4 (null) | AA: resize to 200% without loss; F69 covers clipping, truncation and obscuring | Direct. |
| https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html | Understanding SC 2.4.11 (null) | AA: a focused component is not entirely hidden by author content; sticky footers are named | The flex-sibling footer avoids this by construction (inference). |
| https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html | Understanding SC 4.1.3 (null) | AA: status messages are programmatically determinable; `role="status"` for results, `role="alert"` for errors | Direct, for UX-5. |
| https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html | Understanding SC 2.4.6 (null) | AA: "Headings and labels describe topic or purpose" | Direct. |
| https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html | Understanding SC 2.4.3 (null) | A: focus order preserves meaning and operability | It does not address actions placed after long content; that reading is mine. |
| https://www.w3.org/TR/coga-usable/ | Making Content Usable for People with Cognitive and Learning Disabilities, W3C Note, 29 Apr 2021 | Patterns 4.4.8 (summary of long documents), 4.2.1, 4.3.4, 4.8.3; user need "short summary for long pieces of content" | Non-normative. Only the first 100,000 characters were read, with pattern headings but not bodies. |
| https://support.google.com/accessibility/android/answer/7101858 | Android Accessibility Help, touch target size (null) | Targets "at least 48dp" | Official platform guidance. |
| https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture | Predictive back (null) | At the root, the system performs back-to-home unless a callback consumes it | Supports leaving back alone on the guard. This is a Capacitor app, so the shell's handling is uninspected. |
| https://github.com/material-components/material-components-android/blob/master/docs/components/Dialog.md | Material Components Android, Dialog (null) | Full-screen dialogs are for "actions that require a series of tasks to complete" | Weak. Suggests a plain screen fits better than a full-screen dialog; inference. |
| https://www.priv.gc.ca/en/about-the-opc/what-we-do/consultations/completed-consultations/consultation-on-consent-under-pipeda/submissions-received-for-the-consultation-on-consent/sub_consent_11/ | J. Obar submission to the OPC, Oct 2016 | NameDrop study: N=543; 74% skipped the policy; mean reading 73 s and 51 s; 98% missed planted clauses; information overload predicted not reading | The author's own summary of a study then under review. US undergraduates, a fictitious social network. Not a test of scroll gating. |
| https://www.kau.se/en/news/blog-do-we-truly-have-agree-online-terms-and-conditions-blindly | Kitkowska blog, Karlstad University, 29 Mar 2022 | Experiment, N=987 (Swedish sample, fictional store): a reading-time cue affected opening rate; icons with simplified text and forced scrolling affected awareness; the same techniques could be misused as dark patterns | An author's blog with no effect sizes. The paper was not retrieved. A purchase context, not a first-launch guard. |
| https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers | FTC press release, 15 Sep 2022 | Names burying key terms in "dense terms of service documents", "pre-checked boxes, hard-to-find-and read disclosures", and steering | A US regulator's summary, not the report itself. |

**Conflicting evidence.** The Kitkowska blog points to forced scrolling raising awareness, which cuts against my recommendation not to gate. I weigh the accessibility cost, and the absence of any retrieved comprehension result, more heavily. The chair should treat this as contested.

**Freshness.** Revalidate the WCAG and Android pages if the review is reused after a WCAG or Android release.

## Confidence and limitations

- **Overall: medium.**
  - High for the repository facts (read directly).
  - Medium for the structure recommendation.
  - Low for anything about rendered layout, TalkBack and large text.
- No render, device, assistive technology or contrast measurement was available.
- I am one model reviewing a design I also proposed. That is not independent evidence or user research.
- Nothing here is legal advice.

## Proposed acceptance criteria and edge cases

All are proposed; none exist today.

1. Given a new installation, when the app opens past the theme choice, then the terms screen is shown before any setup step and before any profile or health data is asked for.
2. The screen has one `h1` (the title), a version and effective-date line, an "In short" section, and the full text expanded, with each section under an `h2` that describes it.
3. "Agree and continue" (primary) and "Decline" (secondary) are both visible without scrolling at all times, are at least 48 CSS px high, and neither is pre-selected, timed or gated on scroll position.
4. If a checkbox is required, it is an `MmCheckRow`, unticked by default, and pressing the button with it unticked shows a message that says why.
5. Given a save failure, then nothing is recorded, the person stays on the screen, a message appears beside the actions and is announced by a screen reader, and the action can be tried again.
6. Given Decline, then the person is told plainly that the app cannot be used without the terms, is offered "Read the terms again" and "Close the app", and is shown no shaming wording.
7. Given the hardware back button on the guard, the app goes to the background. On reopening, the guard shows again with no reference to the earlier visit.
8. Given an existing person and a newer terms version, the screen says the terms changed, shows what changed first, shows the version previously accepted, leaves their data untouched, and on decline offers a way to erase the data.
9. Given the acceptance record cannot be read, the app does not proceed and offers "Try again".
10. At 320 CSS px wide and at 200% text there is no horizontal scrolling, no clipped or truncated text or buttons, and the body remains readable above the footer (threshold to be set from the render).
11. With TalkBack: the title is announced on arrival; the lead says where the actions are; sections are reachable by heading navigation; both buttons have their visible labels as names; after acceptance the next screen's heading is announced.
12. Settings, About shows a "Terms of use" row with the version and date accepted. It opens a pushed screen with Back, the same text, and no accept or decline controls.
13. The screen uses only shared controls: `Screen`, `MmButton`, `Notice`, `MmListRow`, `MmListGroup`, `GroupHeader`, optionally `MmCheckRow`, and a shared footer-actions component. There is no raw `<button>` or `<input>`.
14. Stories exist for: first run, saving failed, declined, changed version, read-only from Settings, and acceptance record unreadable. Existing first-run stories still reach their screens.

Edge cases:
- Erase all data: does acceptance reset? (owner decision)
- Device date changed after acceptance.
- Acceptance stored but the terms text version is missing.
- Very long section headings at 200% text.
- Landscape and split-screen heights.
- Demo mode.

## Dark patterns to exclude

- Pre-ticked acceptance.
- A Decline that is hidden, greyed, a small text link, or reachable only by scrolling.
- Confirmshaming copy on Decline.
- Scroll gating, countdowns or timers.
- Terms behind a link or collapsed by default while Agree is prominent.
- A summary that omits or softens what the text says.
- Bundling other consents (reminders, Health Connect, future analytics) into this acceptance.
- Repeated prompts or guilt wording on return.
- An interstitial dialog asking "are you sure?" on Decline.
- Auto-accept on continued use or on back.
- Changing terms silently without the changed-version screen.
- Making a declining person's existing data unreachable.

## Dependencies and chair requests (bounded)

1. **Legal counsel or owner (no lawyer is on the panel).** Is a single labelled button sufficient assent, or is a checkbox required? Is a plain-language summary above the binding text acceptable? The answer decides criterion 4 and the "In short" section.
2. **Privacy reviewer.**
   - May a theme preference be stored before acceptance (guard order, UX-6)?
   - Must a person who declines changed terms be offered erase or export (UX-7)?
   - Does "Erase all" clear the acceptance record?
3. **react-capacitor.**
   - Does the Android WebView apply the system font scale to rem text?
   - Can a root-screen swap move focus to the new heading (UX-8)?
   - Is a shared footer-actions component and a live-region `Notice` variant acceptable (UX-2, UX-5)?
   - Do existing scenarios need seeded acceptance (UX-9)?
4. **product-designer.** Visual hierarchy of the two footer buttons such that Decline is not de-emphasised into invisibility; reading measure for long text.
5. **QA.** TalkBack and hardware-back verification on a device; 320 px and 200% renders of the story.

## Safety concerns

- No clinical issue.
- Privacy and autonomy: UX-7 (data stranded behind a declined guard) stays open until the privacy reviewer or the owner decides.
- "None found" elsewhere is not clearance.

## Unresolved product decisions (authority: product owner, with legal advice)

- Guard position relative to the theme chooser.
- Checkbox or button-only.
- Whether a summary is shown.
- What Decline does for an existing person's data.
- Whether acceptance can be withdrawn from Settings.
- Whether every text change, or only material ones, triggers the changed-version guard.
- Whether erasing all data resets acceptance.

## Verification

- No tests were run and no commands were executed; this is a read-only role.
- Tests inspected: `apps/mobile/test/gallery/stories.test.tsx` only.
- Requested of the edit owner once the screen is built:
  - the story renders at 320x568 and 360x640, at 100% and 200% text, in every palette;
  - a TalkBack pass on a device;
  - a hardware-back check on a device;
  - the walkthrough repeated on the built story.

---

_Added by the chair when saving. The reviewer wrote everything above; the sections below are the shared template's headings that the report did not use by name._

## Novice mobile experience (when UX/product design is assigned)
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Acceptance criteria and edge cases
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Dependencies
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Unresolved product decisions
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Targeted challenges
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".
