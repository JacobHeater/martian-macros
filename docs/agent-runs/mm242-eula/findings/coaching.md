# Review report: coaching and behavior change, MM-242 (terms-of-use guard)

## Scope and traceability

- **Role:** coaching (`C:\Users\jacob\dev\martian-macros\agents\roles\coaching.md`); a review lens, not a credential. Not a lawyer and not a clinician.
- **Reviewer:** read-only subagent, model claude-opus-5-5, session of 2026-10-12.
- **Branch and commit:** `feature/mm237-storybook-material` at `40c8d1b`, as given in the brief. I could not confirm it myself because I have no shell.
- **Requirement:** MM-242 has no ticket file yet. `requirements/HANDOFF.md:45` names MM-242 as the next ID. This is a planning review of a proposed behavior change.
- **Input hashes:** not computed, because I have no command execution. The chair needs to hash the inspected files listed below.
- **Config read in full:** `AGENTS.md`, `agents/roles/coaching.md`, `agents/panel-protocol.md`, `agents/review-contract.md`. None was missing.

## Existing facts versus proposals

### Facts from source inspection (nothing was run)

1. **No terms exist today.** A search of the repository for "EULA", "terms of use", "licence agreement" and "MM-242" found no terms, no terms screen and no acceptance record. The only hits were the handoff's next-ID line and food-data licensing tickets.
2. **First-run order** (`apps/mobile/src/app/AppRoot.tsx:53-54`): `ThemeChooserScreen` when there is no setup and the theme is unselected, then `OnboardingScreen`.
3. **Guards after setup** (`AppRoot.tsx:55-62`), in order: adults-only, resume, welcome back, health re-check, then home.
4. **The only "not medical advice" text in the app** is a caption under the health-check list, at `apps/mobile/src/onboarding/HealthStep.tsx:78-81`: "This app is not medical advice. Talk to your clinician before changing your diet if you have a medical condition." A search of `apps/mobile/src` outside the gallery found no other instance, including in Settings.
5. **MM-96 (status proposed)** asks for "not medical advice" in onboarding, Settings and the store listing (`requirements/release/TASK.review-health-claims.MM-96.md:21,34`).
6. **The welcome screen** says "everything stays on this phone" (`apps/mobile/src/onboarding/WelcomeStep.tsx:44-46`).
7. **Voice rules** are in `design/voice-and-wording.md:10-23`: plain and specific, state do not judge, honest about uncertainty, "the user is an adult; the app recommends and explains; it does not scold or nag". The glossary uses "targets", "estimate", "trend weight" and "energy expenditure".
8. **The voice test** (`apps/mobile/test/voice.test.ts:13-32`) bans: good, bad, clean, junk, guilt, cheat, oops, earn, burn off, lbs, true weight, sinful, naughty, indulg, deserve, starvation mode, metabolic damage, toning.
   - Words of four letters or fewer match on word boundaries; longer ones match as substrings (line 103).
   - It scans every quoted string and JSX text in `src/**/*.ts(x)` except the folders in `notShown` (lines 48-54).
9. **Safeguard wording rules:**
   - MM-110: safeguards are non-diagnostic and never name a condition to the person (`requirements/safeguards/EPIC.safeguards.MM-110.md:33-35`).
   - MM-114: the under-eating notice leads with the innocent explanation, praises nothing, and says "Eating at your target will not slow your progress the way it feels like it will" (`requirements/safeguards/STORY.persistent-under-eating-notice.MM-114.md:28-33`).
   - MM-11: an eating-disorder history removes deficit goals (`requirements/onboarding/STORY.health-screening.MM-11.md:22`).
10. **Return-screen promise:** MM-147 says "one screen is shown before the dashboard… Nothing else" (`requirements/adherence/STORY.returning-after-a-gap.MM-147.md:21-22`). MM-112 re-asks the health check every 90 days as one screen (`requirements/safeguards/STORY.expanded-and-repeated-health-screening.MM-112.md:36-37`).
11. **Adults only:** under 18 is blocked by date of birth; age is self-declared (`requirements/onboarding/STORY.adults-only.MM-13.md:17,39`).
12. **Repetition as a principle:** MM-158 says the day-zero screen "is a preview, not the only telling" (`requirements/onboarding/STORY.what-to-expect.MM-158.md:49-50`).

### Proposals

Everything under Findings, Recommended wording and Proposed acceptance criteria is a proposal. None of it is approved requirement text, and all of it needs legal and safety review.

## Audit coverage

- **Audit mode:** change (planning), with a targeted audit of existing first-run and disclaimer behavior.
- **Method:** source inspection only. No tests were run, nothing was rendered, and no story was viewed.

**Inspected**

- `C:\Users\jacob\dev\martian-macros\apps\mobile\test\voice.test.ts`
- `C:\Users\jacob\dev\martian-macros\apps\mobile\src\onboarding\HealthStep.tsx`
- `C:\Users\jacob\dev\martian-macros\apps\mobile\src\onboarding\WelcomeStep.tsx`
- `C:\Users\jacob\dev\martian-macros\apps\mobile\src\app\ThemeChooserScreen.tsx`
- `C:\Users\jacob\dev\martian-macros\apps\mobile\src\app\AppRoot.tsx`
- `C:\Users\jacob\dev\martian-macros\apps\mobile\src\app\AdultsOnlyScreen.tsx`
- `C:\Users\jacob\dev\martian-macros\design\voice-and-wording.md`
- `C:\Users\jacob\dev\martian-macros\requirements\safeguards\EPIC.safeguards.MM-110.md`
- `C:\Users\jacob\dev\martian-macros\requirements\safeguards\STORY.expanded-and-repeated-health-screening.MM-112.md`
- `C:\Users\jacob\dev\martian-macros\requirements\safeguards\STORY.persistent-under-eating-notice.MM-114.md`
- `C:\Users\jacob\dev\martian-macros\requirements\onboarding\STORY.health-screening.MM-11.md`
- `C:\Users\jacob\dev\martian-macros\requirements\onboarding\STORY.adults-only.MM-13.md`
- `C:\Users\jacob\dev\martian-macros\requirements\onboarding\STORY.what-to-expect.MM-158.md`
- `C:\Users\jacob\dev\martian-macros\requirements\adherence\STORY.returning-after-a-gap.MM-147.md`
- `C:\Users\jacob\dev\martian-macros\requirements\release\TASK.review-health-claims.MM-96.md`
- Search results only (files not opened): clinician and doctor wording in `src/format/cautionMessage.ts`, `modeReasonExplanation.ts`, `targetFlagMessage.ts`, `underEatingText.ts`, `domain/Caution.ts`.

**Not inspected**

- `OnboardingScreen.tsx` and the other onboarding steps, `WelcomeBackScreen.tsx`, `HealthRecheckScreen.tsx`, and Settings screens beyond the search.
- The rest of `design/`, and `requirements/coach-insights/*` (listed only).
- MM-145, MM-146, MM-148, MM-149, MM-113, MM-115 to MM-118, MM-29, MM-92, MM-108.
- `docs/evidence.md`, `docs/non-goals.md`, `requirements/HANDOFF.md` beyond one search hit.
- The gallery stories and the Android shell.
- Whether a data export exists.

**Cross-domain referrals**

- **Safety:** the "who should check with a clinician" sentence, and the missing MM-29 sign-off.
- **Privacy:** whether "stays on this phone" is true once Health Connect, pack download and backup are counted.
- **UX and product design:** placement, scroll behavior, button prominence, and a render of the guard.
- **Legal:** a human lawyer, who is not on the panel. Questions: whether a summary can sit above binding text, which prevails, and whether forced scroll or a checkbox is needed.
- **Measurement:** the "estimates" sentence.

## Findings

### C-1. A summary-first layout does not by itself produce comprehension, so the safety facts must not live only on the guard

- **Classification:** evidence-supported domain concern. **Severity:** high. **Confidence:** medium (the evidence is indirect; see Sources).
- **Evidence:**
  - In one experiment about three-quarters of people accepted policies without opening them (Obar and Oeldorf-Hirsch 2022).
  - Layered notices were faster to use but less accurate than full text (McDonald et al. 2009).
  - Simplified and warning-box disclosures had little or no effect on comprehension in one randomized survey (Ben-Shahar and Chilton 2016).
  - Improved consent forms did raise understanding in research consent, though inconsistently (Nishimura et al. 2013).
- **Interpretation (mine):** assume most people read the summary at most, and many read neither layer. The guard records agreement. It cannot be relied on to inform.
- **Expected:**
  - Each of the four safety facts appears in the summary itself, not only in the full text.
  - Each is said again where it becomes true: on the health check, on the targets and plan screen, on estimate cards, and in Settings. MM-158 already sets this pattern.
  - The summary says plainly that the full text contains more than it does.
- **Observed:** no guard exists. The only disclaimer is the single caption at `HealthStep.tsx:78-81`.
- **Remediation:** write the summary as below, keep the HealthStep caption, and add the Settings entry MM-96 already asks for.
- **Verification:** not verifiable until the guard is built. Comprehension is not measured by any test, and nobody was observed.

### C-2. The guard must not become the replacement for the contextual disclaimer

- **Classification:** documentation or requirement gap. **Severity:** medium. **Confidence:** high for the fact, medium for the risk.
- **Observed:** "not medical advice" exists only at `HealthStep.tsx:78-81`, as a caption after up to twelve checkboxes, and not in Settings. MM-96 is proposed and asks for onboarding, Settings and the listing.
- **Risk:** once terms exist, the caption may be removed as redundant. The terms are the least-read surface in the app.
- **Remediation:** MM-242 should say the HealthStep caption stays. The summary and full terms should be reachable from Settings at any time, with their version and date. That also meets MM-96's Settings criterion.

### C-3. Standard liability language conflicts with the app's voice and with the under-eating and eating-disorder safeguards

- **Classification:** evidence-supported domain concern. The rule is in the repository; the behavioral effect is my inference. **Severity:** high. **Confidence:** medium.
- **Rules:** voice rule 2 (state, do not judge) and rule 6 (does not scold); MM-110 (non-diagnostic, never names a condition to the person); MM-114 (the innocent explanation first; eating at target is the message).
- **Risk, by inference (I retrieved no direct study):**
  - Fear-worded risk clauses at the front door teach a person that the app will hold their answers against them. The predictable response is to leave the health check unticked, which defeats MM-11 and MM-112.
  - Wording that frames eating, training or losing weight as dangerous can reinforce restriction-related anxiety in the people MM-114 exists for.
- **Remediation:** see "Wording to avoid" below. In the summary, point to the health check rather than restating risk as a threat.

### C-4. The voice test will scan the legal text if it lives in `src/`, and ordinary legal phrases fail it

- **Classification:** documentation or requirement gap, found by source inspection. **Severity:** medium. **Confidence:** high on the mechanism; I did not run the test.
- **Evidence:** `voice.test.ts:103` builds `\bgood\b` and `\bbad\b`, and substring patterns for "clean", "guilt", "cheat", "deserve" and "indulg". The phrases "good faith", "bad faith" and "good standing" would fail if the terms are quoted strings or JSX text in a `.ts` or `.tsx` file outside `notShown`. "Goods" and "learn" would pass.
- **Remediation:** decide deliberately. My recommendation is to keep the terms inside the test's reach and write them without those phrases ("honestly", "in keeping with these terms"). The alternative is a named exemption for the terms file. Do not solve it by placing the text where the test happens not to look. The lawyer decides whether the plain alternative is acceptable.

### C-5. A terms-change guard can stack with welcome-back and the health re-check, breaking MM-147's "one screen, nothing else"

- **Classification:** documentation or requirement gap. **Severity:** medium. **Confidence:** medium (`WelcomeBackScreen` and `HealthRecheckScreen` not opened; inferred from `AppRoot.tsx:55-62`, MM-147 and MM-112).
- **Scenario:** a person returns after 90 or more days, and the app has updated in the meantime. They would meet changed terms, then welcome back, then the health re-check, before seeing anything of their own. MM-147's context says that the likeliest response to an unwelcoming return is to close the app.
- **Remediation:** MM-242 must state the guard order and amend MM-147's wording. The terms-change screen should be as short as the proposal below and carry no return or lapse language.

### C-6. Re-acceptance holds months of a person's own records behind a decision

- **Classification:** unverified hypothesis requiring investigation; it is a product decision. **Severity:** high. **Confidence:** medium.
- **Concern:** if "Not now" on changed terms locks the whole app, the person's logs, weigh-ins and trend become leverage. That is coercive in effect even with neutral words, and no wording fixes it.
- **Remediation:** an owner decision, with legal advice, on what stays available after "Not now". My recommendation is that the person can at least see and export their own data, and that coaching (new targets, check-ins) is what waits. I did not check whether an export exists.

### C-7. The clinician sentence should point to the health check, not duplicate its list

- **Classification:** design or usability improvement. **Severity:** medium. **Confidence:** medium.
- **Reason:** two lists of conditions (the terms and `HealthStep.tsx:62-77`) will drift apart. MM-112's own notes say "a long list gets skimmed". The condition list is unreviewed product judgement pending MM-29.
- **Remediation:** one short sentence naming the broad groups, and the health check does the specific work. Safety owns the content of that sentence.

### C-8. Stale path in the voice guide

- **Classification:** documentation gap. **Severity:** low. **Confidence:** high.
- `design/voice-and-wording.md:43` cites `apps/mobile/test/voice_test.dart`; the test is `apps/mobile/test/voice.test.ts`. It is outside MM-242 and should be tracked, not fixed silently.

### C-9. "Clinician" versus "doctor"

- **Classification:** unverified hypothesis. **Severity:** low.
- The app says "clinician" in most places and "a doctor or a registered dietitian" in `underEatingText.ts`. "Clinician" may be less familiar to some readers. I retrieved no evidence on this. I kept "clinician" below for consistency; UX may prefer "doctor or other clinician".

## Recommended wording (proposals)

I checked every string below, by reading, against all 18 entries in `voice.test.ts:13-32` using the test's own matching rule. None contains a banned word or substring. I did not run the test; the edit owner should.

### First-run summary, above the full terms

Heading: **Before you start**

1. Martian Macros is a coaching tool, not medical advice; it does not diagnose or treat anything.
2. Its numbers are estimates worked out from what you log, and they can be off.
3. If you are pregnant or breastfeeding, have a medical condition, take medication that affects your weight or blood sugar, or have a history of an eating disorder, talk to your clinician before changing how you eat.
4. You stay in charge: the app recommends and explains, and what you eat and how you train is your decision.
5. The app is for adults 18 and over.
6. The full terms below say this in more detail and cover more, including the limits of what we are responsible for.

Notes on the summary:

- **Sentence 3** is safety's to approve and has no clinical sign-off (MM-29). It mirrors the groups in `HealthStep.tsx`. It may be followed on the health-check screen, not here, by the existing caption.
- **Sentence 6** is there for honesty. The layered-notice evidence says people stop at the summary, so the summary must admit what it leaves out. The lawyer must confirm that a summary is permissible and say which text governs.
- **Optional seventh point,** only if privacy confirms it is true without qualification: "What you enter stays on this phone." It would replace sentence 5 or 6, not add to them.
- **Glossary:** I used "estimates" and avoided "goals" for targets, per `voice-and-wording.md:29-39`.

### Actions

- **Accept:** `I agree`
- **Decline:** `Not now`

Conditions on the actions:

- Both are real buttons, both visible without scrolling past the summary, and neither is a faint link.
- If there is a checkbox, it is never pre-ticked. A single explicit "I agree" press with no checkbox is simpler.
- No timer, no "limited", no "last step", no progress bar implying the person is nearly done.
- No animation or mascot on this screen.
- Whether the full text must be scrolled before "I agree" enables is unresolved. I retrieved no evidence that forced scrolling improves comprehension, and it adds friction. That is a legal and UX call.

### After "Not now" on first run

Heading: **That is fine**

"The app needs your agreement to the terms before it can coach you. No health details have been entered yet. You can read the terms again whenever you like."

Button: `Read the terms again`

The second sentence is true only if the guard sits before the profile step. A saved theme is not a health detail.

### Wording to avoid

| Avoid | Why | Say instead |
|---|---|---|
| "Use at your own risk", "you assume all risks", capitalised warning blocks in the summary | Frames ordinary eating and training as hazardous; the person stops reading | Sentences 1, 2 and 4; any capitalised block belongs in the full text only if a lawyer requires it |
| "Dieting can be dangerous", "may cause serious injury or death" | Frightens people away from ordinary behavior, and is harmful framing for people with restriction anxiety | Sentence 3 |
| "You are solely responsible for any harm", "we are not to blame if you…", "failure to follow…" | Implies the app will blame them; contradicts voice rule 6 | "What you eat and how you train is your decision" |
| "You must consult a doctor before using this app" | Untrue as a universal claim; an instruction nobody follows teaches that the rest can be ignored too | Name who should, as in sentence 3 |
| "You confirm you do not have an eating disorder" or any self-certification of health | Pushes people to hide what the health check needs to hear (MM-11, MM-112); reads as diagnosis and exclusion (MM-110) | Let the health check ask, with its consequences stated there |
| "Misuse", "abuse of the app", "non-compliance", "violation" applied to eating or logging | Moralises; conflicts with MM-114's innocent-explanation-first | Do not describe eating or logging behavior in the terms' summary at all |
| "Results not guaranteed", "results may vary", "your weight-loss journey" | "Results" presumes weight loss as the purpose, when recomp, gain and maintenance exist; MM-96 forbids outcome talk | Sentence 2 |
| "I understand and accept the risks to my health" as the accept label | Fear label on the action | `I agree` |
| "No thanks, I don't care about my health", "Exit", "Decline and lose access" | Shaming or punitive decline | `Not now` |
| "We care about your safety", "for your protection", "to serve you better" | Unverifiable warmth; `voice-and-wording.md` rule 1 (plain and specific) | Say what the thing is |
| "Good faith", "bad faith", "good standing" | Fails `voice.test.ts` if the text is in `src/` (C-4) | "Honestly"; lawyer to confirm |

### When the terms change (a person months in)

Principles:

1. Ask again only for a change that matters to the person, not for corrections of wording. That needs a "material version" distinct from the text's revision.
2. Lead with what changed, in one to three plain sentences written by hand for that version.
3. Say what did not change.
4. Say what happens to their data either way, truthfully (C-6).
5. No mention of how long they have used the app, of streaks, of days away, or of the health check.
6. Not on the same screen as welcome-back.
7. An offline app receives new terms only with an app update, so there is no advance notice to give. Say so plainly rather than implying a deadline.

Heading: **The terms have changed**

"This version of the app comes with new terms. What changed: [one to three sentences for this version]. What has not changed: the app is not medical advice, its numbers are estimates, and what you eat and how you train is your decision. Your logs, weigh-ins and targets are on this phone, and your answer here does not remove them."

Actions: `I agree` / `Not now`, with a `Read the full terms` link.

After "Not now", subject to the C-6 decision: "Coaching is on hold until you agree to the current terms. Your logs and weigh-ins are still here." with `Read the terms again`.

I checked these strings against the banned list in the same way. None matches.

## Research

- **Status:** performed, partially blocked.
- **Question:** do people read and understand terms and consent documents, and do plain-language or layered summaries improve comprehension?
- **Trigger:** an explicit research request in the brief, plus a material behavioral claim.
- **Surface:** direct, using this subagent's own WebSearch for discovery and WebFetch for retrieval.

**PANEL_RESEARCH_BLOCKED (partial).** Retrieval failed for:

- Obar and Oeldorf-Hirsch's original paper, `https://papers.ssrn.com/abstract=2757465` (HTTP 403).
- The FTC staff report PDF, `https://www.ftc.gov/system/files/ftc_gov/pdf/P214800%20Dark%20Patterns%20Report%209.14.2022%20-%20FINAL.pdf`. It downloaded but was unreadable because no PDF renderer is installed.
- The revised Common Rule "key information" text, from ecfr.gov (redirected to an unblock page) and hhs.gov (HTTP 403).
- The PubMed and Springer pages for Nishimura. The Europe PMC record was retrieved instead.

Claims that depend on those sources are marked below. I did not research the effect of legal notices on trust in a coaching relationship, or on people at risk of eating disorders. Statements on those are inference.

## Sources and evidence

All accessed 2026-10-12.

1. **Nishimura A, Carey J, Erwin PJ, Tilburt JC, Murad MH, McCormick JB. "Improving understanding in the research informed consent process: a systematic review of 54 interventions tested in randomized control trials." BMC Medical Ethics 14:28, July 2013.** DOI 10.1186/1472-6939-14-28.
   - Retrieved: the abstract, from the Europe PMC record at `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:23879694%20AND%20SRC:MED&resultType=core&format=json`.
   - Finding: 39 trials, 54 interventions. Enhanced consent forms improved understanding (SMD 1.73, 95% CI 0.99 to 2.47), as did extended discussion (SMD 0.53, 0.21 to 0.84). Multimedia did not reach significance. By count, 41% of enhanced-form interventions showed a significant gain. No category harmed satisfaction or accrual.
   - Population: research participants, often with a person present.
   - Strength: a systematic review with high heterogeneity. Applicability to an app's terms is indirect.
   - Limit: I did not retrieve what "enhanced" comprised, so I do not claim it means "shorter".
2. **McDonald AM, Reeder RW, Kelley PG, Cranor LF. "A Comparative Study of Online Privacy Policies and Formats." Privacy Enhancing Technologies, Springer, 2009.**
   - Retrieved: the abstract, at `https://www.springerprofessional.de/doi/10.1007/978-3-642-03168-7_3`.
   - Finding: in an online study of 749 people, participants could not reliably understand practices in any format. Layered policies were faster but less accurate. Better readability scores did not improve performance. All formats were disliked.
   - Strength: a single study, dated, about privacy policies. Full text not retrieved.
3. **Ben-Shahar O, Chilton A. "Simplification of Privacy Disclosures: An Experimental Test." Journal of Legal Studies 45(3), 2016.**
   - Retrieved: the abstract page, at `https://chicagounbound.uchicago.edu/jls/vol45/iss3/3`.
   - Finding: in a randomized survey, best-practice simplification and warning boxes had "little or no effect on respondents' comprehension of the disclosure", on sharing or on expectations of rights.
   - Strength: a single experiment in a privacy context. It conflicts in direction with source 1.
4. **York University news, 6 December 2022, on Obar and Oeldorf-Hirsch, "Older Adults and 'the Biggest Lie on the Internet'", International Journal of Communication.** `https://www.yorku.ca/news/2022/12/06/service-agreement-sees-internet-users-consenting-to-give-up-a-kidney/`
   - Finding: 500 adults aged 50 and over. 77.6% agreed to the privacy policy by clickwrap without opening it. Those who opened the documents read for about 70 to 81 seconds. 83.4% accepted terms containing an absurd clause. Participants called the policies long and complicated. The authors blame clickwrap design.
   - Strength: an institutional press release about one experiment with a fictitious service, not the paper itself.
   - Not verified: the 2018 study's figures (N=543, 74% skipped) appeared only in a search snippet. Treat them as unverified.
5. **FTC press release, 15 September 2022, "FTC Report Shows Rise in Sophisticated Dark Patterns Designed to Trick and Trap Consumers".** `https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers`
   - Finding: it names false-urgency countdown timers and burying key limitations in terms people do not see. It mentions pre-checked boxes and hard-to-read disclosures as older forms of the same tactics.
   - Strength: a regulator's summary of a US staff report. The report itself was not read. I did not find "confirmshaming" in retrieved primary text; that term rests on search-snippet commentary only.

**Conflict and interpretation (mine).** Sources 2 and 3 say format changes do little for privacy notices. Source 1 says better forms help in research consent. The settings differ in motivation and in whether a human is present. The defensible product position is to write the summary well because it costs little and no category in source 1 caused harm, but to plan as though it will not be read and to repeat the safety facts in context. One study each for 2, 3 and 4 does not establish a rule.

**Freshness.** Revisit if a lawyer's advice or a platform policy changes the layout. The evidence is old (2009 to 2022) but I know of no reversal.

## Confidence and limitations

- **Overall: medium.**
- High for repository facts, which I read directly.
- Medium for the comprehension evidence, which is indirect, drawn from privacy and research-consent settings, and partly blocked.
- Low to medium for claims about trust, disclosure on the health check, and effects on people with restriction anxiety. Those are behavior-change reasoning with no retrieved study.
- No render of any screen, no test run, no users observed.
- Wording proposals are untested with readers. Reading level was not measured.
- No lawyer and no clinician is involved; MM-29 sign-off is missing and stays missing.

## Acceptance criteria and edge cases (all proposed; none exist)

- The summary has at most six sentences and contains all four safety facts: not medical advice, estimates, who should talk to a clinician, and the person decides.
- The summary states that the full terms cover more than it does.
- Accept and decline are both design-system buttons, visible together. No control is pre-selected. No timer or urgency text appears.
- The decline label is "Not now". Declining shows a calm screen with a way back to the terms and no judgement.
- No string on the guard, the decline screen or the change screen matches the voice test. The full terms are either inside the test's reach or exempted by name with a reason.
- The `HealthStep` caption remains. The terms and summary can be reread from Settings with a version and date.
- A terms change shows what changed first, what did not change, and what happens to the person's data. It does not mention time away, streaks or days missed.
- A change that is not material does not re-prompt.
- The guard order is defined for a person who is due changed terms, welcome-back and the health re-check together. MM-147's text is amended to match.
- An under-18 profile, a person who taps "Not now" repeatedly, and a person who force-closes on the guard each land in a defined state with nothing recorded as accepted.
- Screen-reader order: summary, then actions reachable, then full text (UX to confirm).
- A story exists for the guard, the decline screen and the change screen, as AGENTS.md requires for any new screen.

## Dependencies

- **safety:** approve or replace summary sentence 3 and the eating-disorder wording. Challenge C-3.
- **privacy:** challenge "stays on this phone", and what an acceptance record stores.
- **ux and product-designer:** placement, button weight, scroll behavior, a render. Challenge C-1's assumption that the summary fits one screen at large text sizes.
- **measurement:** challenge "they can be off" for sentence 2.
- **react-capacitor (implementation):** where the text lives relative to the voice test (C-4), and the guard order in `AppRoot.tsx`.
- **Human lawyer (outside the panel):** whether a summary is allowed, which text governs, whether plain substitutes for "good faith" are acceptable, age wording, and re-acceptance rules.
- **Related tickets:** MM-96, MM-11, MM-13, MM-29, MM-108, MM-110, MM-112, MM-114, MM-147, MM-158.

## Safety concerns

- Fear-worded risk clauses could reduce honest answers on the health check, weakening the pregnancy, insulin and eating-disorder protections. This is inference, not measured.
- Self-certification clauses about health would conflict with MM-110 and MM-11.
- Holding a person's records behind re-acceptance is coercive in effect (C-6).
- A person who reads only the summary may believe the summary is the whole agreement; sentence 6 is the mitigation.
- The clinician sentence has no clinical review.
- None of this is clinical or legal clearance.

## Unresolved product decisions

1. **Where the guard sits: before the theme chooser, between theme and welcome, or after the welcome screen and before the first question.**
   - My preference is after `WelcomeStep` and before any personal detail. The person then knows what they are agreeing to use, and "no health details have been entered yet" is true.
   - Authority: owner, with a lawyer.
2. **What remains usable after "Not now" on changed terms: nothing; view and export only; or everything except new coaching.**
   - Authority: owner, with a lawyer.
3. **Whether the summary is part of the agreement or an explanation of it.**
   - Authority: lawyer.
4. **Forced scroll and checkbox, or a single press.**
   - Authority: lawyer and UX.
5. **Whether the terms text is inside the voice test or exempted by name.**
   - Authority: owner.
6. **What counts as a material change that re-prompts.**
   - Authority: owner, with a lawyer.
7. **Whether the "stays on this phone" sentence appears in the summary.**
   - Authority: privacy, then owner.

## Verification

- **Tests inspected:** `apps/mobile/test/voice.test.ts`, by reading. No test was run; read-only roles cannot run them.
- **Requested from the edit owner:** run `npx vitest run test/voice.test.ts` inside `apps/mobile` once the strings exist, and `mm check` before completion. Compute SHA-256 for the inspected inputs.
- **Evidence labels:** all repository claims are source inspection. There was no runtime reproduction and there are no test results.
- **Banned-word check of the recommended strings:** done by reading against the list and the matching rule at line 103; not executed.

---

_Added by the chair when saving. The reviewer wrote everything above; the sections below are the shared template's headings that the report did not use by name._

## Novice mobile experience (when UX/product design is assigned)
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Acceptance criteria and edge cases
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Targeted challenges
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".
