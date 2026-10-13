# Safety & evidence review: MM-242 (EULA / terms guard)

**Bottom line:** the agreement can be drafted on a general-wellness footing for the core product, but I could not read the FDA guidance text itself (`PANEL_RESEARCH_BLOCKED`, partial). Four condition-specific behaviours (S1) sit at the edge of that footing and need an attorney's ruling before the "not a medical device / does not treat" sentence is finalised. Nothing here is legal advice, clinical clearance or a substitute for MM-29.

## Scope and traceability
- **Role:** safety (`agents/roles/safety.md`), read-only subagent session; no credential claimed.
- **Task:** MM-242. No MM-242 ticket file exists yet (`requirements/HANDOFF.md:45` names MM-242 as the next free ID).
- **Commit:** 40c8d1b on `feature/mm237-storybook-material`, as briefed; I have no shell and did not verify it.
- **Input SHA-256 hashes:** not computed (no shell). The chair must record them.
- **Requirement files read:** MM-11, MM-13, MM-29, MM-95, MM-96, MM-112, MM-114 (paths under "Inspected").

## Audit coverage
**Audit mode:** change (planning). **Method:** source inspection only; nothing run, no render viewed.

**Inspected in full**
- `C:\Users\jacob\dev\martian-macros\AGENTS.md`, `agents\roles\safety.md`, `agents\panel-protocol.md`, `agents\review-contract.md`
- `apps\mobile\src\app\AppRoot.tsx`, `app\HealthRecheckScreen.tsx`, `app\AdultsOnlyScreen.tsx`
- `apps\mobile\src\onboarding\OnboardingScreen.tsx`, `HealthStep.tsx`, `WelcomeStep.tsx`, `BirthDateStep.tsx`
- `apps\mobile\src\domain\CoachingPolicy.ts`, `domain\ScreeningAnswers.ts`
- `apps\mobile\src\format\cautionMessage.ts`, `format\underEatingText.ts`
- `requirements\onboarding\STORY.health-screening.MM-11.md`, `STORY.adults-only.MM-13.md`
- `requirements\adaptive-coach\TASK.dietitian-review-of-safety-bounds.MM-29.md`
- `requirements\release\TASK.review-health-claims.MM-96.md`, `TASK.privacy-policy-and-store-data-declarations.MM-95.md`
- `requirements\safeguards\STORY.expanded-and-repeated-health-screening.MM-112.md`, `STORY.persistent-under-eating-notice.MM-114.md`

**Inspected in part**
- `docs\evidence.md` lines 1-125; `docs\non-goals.md` lines 30-44 and 155-167; `apps\mobile\src\settings\SettingsScreen.tsx` lines 165-208.
- Grep-only hits (single lines, files not opened): `onboarding\SexStep.tsx:15`, `coach\MetabolismSummary.tsx:51`, `format\modeReasonExplanation.ts:7,11`, `format\targetFlagMessage.ts:20`.

**Uninspected**
- MM-113, MM-115 to MM-118, MM-110, MM-94; the register table of `docs\evidence.md` (line 126 on); `HANDOFF.md` beyond a grep.
- `about\HowThisWorksScreen`, `settings\HealthCheckScreen.tsx`, `HealthConnectSection`, all coach and dashboard screens, all stories and tests, the Android shell, any store-listing text.
- This is not a whole-app claims audit; MM-96 remains that task.

**Absent implementation:** a grep of the repository for EULA, terms of use and licence agreement found no agreement, acceptance record or guard.

**Briefed facts I did not verify:** US-only; Health Connect read-only. Offline-only is supported by copy only (`SettingsScreen.tsx:189,196`, `WelcomeStep.tsx:45`), not by a network audit.

## Existing facts
- **Guard order** (`AppRoot.tsx:27-62`): setup load, theme load, theme chooser (only when there is no setup and no theme), onboarding, then with a stored setup: adults-only block, resume, welcome-back, health re-check, home.
- **Onboarding order** (`OnboardingScreen.tsx:144-215`): welcome, sex, date of birth, measurements, activity, training, health check, goal. The first health-related entry is biological sex at step 0.
- **Screened conditions** (`ScreeningAnswers.ts:1-14`): pregnant, breastfeeding, eating-disorder history, chronic kidney disease, androgen use, PCOS, menopause, thyroid condition, insulin or sulfonylurea, care-team confirmation, bariatric surgery, weight-affecting medication.
- **Derived, not asked** (`CoachingPolicy.ts:98-129`): under 18 (blocked), BMI below 18.5, low BMI, age 65 or over.
- **The only disclaimer in the app** is `HealthStep.tsx:78-81`: "This app is not medical advice. Talk to your clinician before changing your diet if you have a medical condition."
- **Settings has no such statement** (grep of `src\settings` for medical, clinician, wellness: none).
- **No emergency wording anywhere** (grep of `apps\mobile\src` for 911, 988, emergency, crisis, helpline: zero matches).
- **No resource is named for eating disorders**; MM-114 deliberately defers it to a release-time check (`MM-114.md:83-84, 99-101`).
- **Age is self-declared**, with no verification planned (`MM-13.md:39`).
- **No row of the evidence register has been reviewed by a professional** (`docs\evidence.md:28-31`); MM-29 is `proposed` and blocks release.
- **Non-goal:** "No diagnosis, no condition named to a user, no interpretation of lab values, no medication advice" (`docs\non-goals.md:159-165`).

## Findings

**S1. Four condition-specific behaviours strain the "unrelated to a disease or condition" footing.**
- Domain: safety (referral to nutrition, MM-29, attorney). Class: evidence-supported domain concern. Severity: high. Confidence: medium (statute read through secondary FDA pages; the legal conclusion is not mine to draw).
- Observed:
  - Protein capped at 0.8 g/kg for chronic kidney disease (`CoachingPolicy.ts:145`).
  - A fat-loss pace limit for insulin or sulfonylurea users, lifted by a self-ticked box (`CoachingPolicy.ts:120-122`, `HealthStep.tsx:73-75`).
  - "keep your treatment stable where you can" for thyroid conditions (`cautionMessage.ts:27-29`), which reads as treatment advice against the non-goal.
  - A lactation offset of 400 kcal (`CoachingPolicy.ts:144`).
- Expected: an agreement saying "does not treat or manage any condition" must be true of the product.
- My inference: the restrictions (no deficit, no targets, refer to a clinician) are consistent with wellness framing. A condition-specific number is the weakest point, the kidney-disease cap most of all.
- Remediation: the attorney rules on these four; MM-29 rules on the numbers; reword the thyroid line. Until then the agreement should describe these as limits the app places on itself, never as guidance for the condition.

**S2. "Prescribe" contradicts "not medical advice".**
- Class: evidence-supported domain concern. Severity: medium. Confidence: high (wording read directly).
- Observed: "will not prescribe a deficit" at `cautionMessage.ts:5-6` and `:9`, and `modeReasonExplanation.ts:7`.
- Remediation: "will not plan" or "will not suggest". Route to MM-96 and MM-108.

**S3. No emergency statement and no route to urgent help.**
- Class: documentation or requirement gap. Severity: high. Confidence: high within the grep scope.
- Remediation: the agreement and the guard's summary carry the emergency wording below. Whether a standing in-app line is also needed is a separate ticket.

**S4. Unqualified "safe" assurances.**
- Class: evidence-supported domain concern. Severity: medium. Confidence: medium (three of four are single grep lines).
- Observed:
  - "Your answers help keep your coaching safe" (`HealthRecheckScreen.tsx:71`).
  - "safe body-fat ranges" (`SexStep.tsx:15`).
  - "held at a safe limit" (`MetabolismSummary.tsx:51`).
  - "healthy range" (`cautionMessage.ts:26`).
- The agreement will say limits are cautious defaults that rest on self-reported answers and are not professionally reviewed. Prefer "cautious" or "the app's limit". The agreement must not state the limits are safe.

**S5. The welcome claim is an objective performance claim.**
- Class: evidence-supported domain concern. Severity: medium. Confidence: medium.
- Observed: "Coaching for fat loss and muscle gain that adapts to your body, not a formula." (`WelcomeStep.tsx:40`). The starting estimate is formula-based (`docs\evidence.md:66-70`).
- The FTC guidance, as relayed, judges the net impression and says a disclosure cannot contradict a claim. The agreement's "estimates only" would sit against "not a formula". Route to MM-96.

**S6. MM-96's "findable in Settings" criterion is unmet today.**
- Class: documentation or requirement gap (MM-96 is `proposed`). Severity: medium.
- Remediation: the accepted agreement is re-readable offline from Settings, under About.

**S7. Eating-disorder wording must not hardcode an unverified helpline.**
- Class: documentation or requirement gap. Severity: medium.
- The app is offline, so a stale number ships until the next update. I did not verify any helpline in this review. Name "a doctor, a registered dietitian or a mental-health professional" and add a named resource only after the release-time check MM-114 already requires.

**S8. The agreement must not overstate the screening.**
- Class: design improvement. Severity: medium.
- The screening is self-declared, incomplete by its own ticket (`MM-112.md:130-132`) and not clinically reviewed. The "talk to a clinician first" list needs a catch-all and must not imply that a person who ticks nothing is cleared.

## 1. Statements the agreement must contain (proposed wording)
These are proposals for the attorney to turn into the agreement, not settled text.

1. **Not medical advice.**
   - "Martian Macros is a general wellness app. It is not a medical device. It does not diagnose, treat, cure or prevent any disease or condition, and nothing in it is medical advice."
   - Reason: the app's status rests on intended use; Google Play requires near-identical words in the listing. Finalise only after S1.
2. **No clinician relationship.**
   - "Using the app does not make anyone your doctor, dietitian or coach. No health professional reviews your information or your numbers. The app is software that does arithmetic on what you enter."
   - Reason: "coaching" otherwise implies a person; it is also true that nobody reviews anything in an offline app.
3. **Who should talk to a clinician first.**
   - "Talk to a doctor or registered dietitian before you use the app's targets if you: are pregnant or breastfeeding; have or have had an eating disorder; have kidney disease; have diabetes, especially if you use insulin or a sulfonylurea; have a thyroid condition or PCOS; are in perimenopause or menopause; have had weight-loss surgery; take testosterone, anabolic steroids, or any medicine that changes your weight or appetite; are underweight; are 65 or older; or are being treated for any other condition. The app asks about some of these and limits what it will suggest. Those limits are not medical clearance, and the questions do not cover everything."
   - Reason: mirrors `ScreeningAnswers` and the derived rules, plus the catch-all from S8.
4. **Estimates and uncertainty.**
   - "Every number is an estimate: calories, macros, energy use, body fat, trend weight. Estimates can be wrong, sometimes by a lot, and food data can contain errors. The app's limits are our judgement. They have not been approved by a regulator." Add "or reviewed by a health professional" only while that remains true.
   - Reason: `docs\evidence.md:28-31`. The agreement must be updated once MM-29 completes.
5. **No promised results.**
   - "We do not promise that you will lose fat, gain muscle or reach any weight in any time."
6. **Emergencies.**
   - "The app cannot help in an emergency. If you think you may have a medical emergency, call 911. Stop following the app's targets and get medical help if you feel faint, dizzy or unwell, have chest pain, or have signs of low blood sugar."
   - Reason: S3. The symptom list needs MM-29 review.
7. **Eating disorders.**
   - "Tracking food and weight is not right for everyone. If it makes you anxious, leads you to eat much less than the app suggests, or starts to take over, stop using it and talk to a doctor, a registered dietitian or a mental-health professional. Do not use the app to eat below its targets."
   - Reason: MM-114's reading that tracking can maintain disordered eating in those who have it (graded moderate and cross-sectional in the ticket; I did not re-check the studies).
8. **Minors.**
   - "The app is for adults 18 and over. By continuing you confirm you are at least 18. Growing bodies need different guidance."
   - Reason: MM-13; age is self-declared.
9. **Your responsibility.**
   - "You decide what to eat and how to train. You are responsible for those choices, for answering the health questions truthfully, and for updating them when your health changes. If a professional's advice differs from the app, follow the professional."
   - Reason: the whole policy rests on self-report (`CoachingPolicy.derive`). How far this limits liability is the attorney's call.
10. **Your data.** One sentence consistent with the privacy policy (MM-95). Referral to privacy-security.

## 2. What the agreement must not say or imply
- That the app is safe, clinically validated, doctor-approved, dietitian-designed or FDA-cleared, approved or registered.
- That it treats, manages, prevents or reduces the risk of obesity, diabetes, kidney disease, eating disorders or any other condition.
- That the health check screens, clears or approves anyone, or is complete.
- "Prescribe", "treatment plan", "patient", "therapy", "diagnose".
- Any amount or rate of weight, fat or muscle change, or "personalized medical" anything.
- That acceptance replaces the health check, or that the limits depend on acceptance.
- A named helpline or statistic not verified at release.
- Anything about data that the privacy policy does not say.
- Current in-app wording that would contradict it: S2, S4, S5 and the thyroid line in S1.

## 3. Is the general-wellness framing supportable?
**Research status: performed, partly blocked.**

`PANEL_RESEARCH_BLOCKED` (partial): both FDA guidance PDFs downloaded as binary and could not be read (WebFetch could not extract text; local PDF rendering is not installed). This prevents me from quoting the January 2026 General Wellness guidance's own definitions, low-risk test and examples, and the Device Software Functions appendices. I could not check whether the guidance names obesity or eating-disorder claims as outside the policy. Request to the chair: supply the plain text of both documents.

**What the sources say** (all as relayed by WebFetch's small-model summary, not read verbatim by me):
- FDA's non-device examples include functions for individuals to log, track or make decisions about general fitness, health or wellness: tools to "promote or encourage healthy eating, exercise, weight loss"; "dietary logs, calorie counters, or make dietary suggestions"; "meal planners and recipes".
- The statutory exclusion (FD&C Act 520(o)(1)(B)) covers software for "maintaining or encouraging a healthy lifestyle" that is unrelated to "the diagnosis, cure, mitigation, prevention, or treatment of a disease or condition". Disease-related wellness claims stay in policy only as "may help to reduce the risk of" or "may help living well with"; other statements are "beyond the scope".
- The General Wellness guidance was reissued on 6 January 2026.
- Functions that help people "self-manage their disease or condition without providing specific treatment suggestions" fall under enforcement discretion.
- FDA's CDS FAQ points patient-facing software to the Device Software Functions policy; clinical decision support is framed around health professionals.
- The FTC tool says an app "cannot make deceptive or misleading claims to consumers – expressly or by implication", that health claims need scientific backing, and that it "is not offering legal advice". It also says most non-HIPAA health apps are likely subject to the Health Breach Notification Rule, particularly those drawing on multiple sources.
- The FTC Health Products Compliance Guidance says marketers answer for implied claims by "the net impression", that a disclosure "can't directly contradict a claim", and that fine print and hyperlinked disclosures are not clear and conspicuous. Health-related apps are in its scope.
- Google Play requires non-device health apps to state in the description that the app is "not a medical device and does not diagnose, treat, cure, or prevent any medical condition", and to remind users to consult a professional.

**My inference:**
- The core functions (food log, calorie and macro targets, weight trend, energy estimate, strength tracking) match FDA's own non-device examples closely. The framing is supportable for them.
- It is not established for the S1 behaviours, where the app changes a number because of a named disease.
- A disclaimer does not rescue a contradicting claim, so S2, S4 and S5 matter more than the agreement's wording.
- Clinical decision support guidance does not appear to apply to a consumer app.
- Confidence: medium for the core, low for S1.

**Conflicts and freshness:**
- One search result (an advocacy petition) referred to a "withdrawal" of the FTC Health Products Compliance Guidance. The page loaded with no withdrawal banner in the part read (first 100,000 of about 128,000 characters). Status unconfirmed; attorney to check.
- Revalidate all of this if any guidance is reissued or the app gains a sensor, a condition-specific feature or a disease claim.

## 4. Guard order and changes to the terms (proposals)
- **First run:** safety requires acceptance before any health or profile entry, so no later than before the sex step. Recommended: after the loading states, before onboarding. Whether it sits before or after the theme chooser is not a safety matter.
- **Existing installs:** a stored setup with no acceptance record sees the guard before every other post-setup screen and before any target is shown.
- **Never a substitute:** the adults-only block, the health check and the re-check stay exactly as they are, whether or not the terms were accepted.
- **Key points first:** the guard shows about five plain points above the full text (not medical advice, estimates only, who should ask a clinician first, emergencies, adults only), with the full text scrollable offline on the same screen. A lone link or a pre-ticked box is the fine print the FTC guidance warns about.
- **Declining:** no coaching and no data entry. For an existing user, declining must not destroy data; erase must stay a separate deliberate action. Whether a decliner can still export or erase is an owner decision.
- **Record:** version and date accepted, on the device only. Referral to privacy-security.
- **When terms change:** the text ships with the app, so a change arrives with an update. A change to any health-relevant statement requires re-acceptance before coaching resumes, with a plain summary of what changed. Trivial edits should not re-prompt, because repeated prompts train people to tap through. The attorney defines "material".
- **Triggers for a safety-driven revision:** MM-29 completing, a new screened condition, a new feature that changes scope, a changed helpline.

## 5. What a licensed attorney must review before release
1. The regulatory position: non-device or general-wellness status, specifically the S1 behaviours, and whether naming conditions in the agreement affects intended use.
2. The whole agreement: licence grant, warranty disclaimer, limitation of liability, assumption of risk, their conspicuousness, and what state consumer law forbids disclaiming.
3. Assent mechanics: whether the guard forms an enforceable agreement, the re-acceptance rule, and what "material change" means.
4. Age and capacity: a self-declared 18+ confirmation with no verification.
5. Every claim in the app and listing against the FTC Act (with MM-96), and the current status of the Health Products Compliance Guidance.
6. Health Breach Notification Rule and state consumer-health-data laws for an on-device app that reads Health Connect (MM-95).
7. Google Play Health Content and Services and Health Connect declarations, and the required disclaimer wording.
8. The emergency and eating-disorder wording, and whether naming or omitting a helpline creates exposure.
9. The US-only limitation, governing law, dispute terms, and the open food-data licences and attribution (MM-57).
10. Whether "coach" and "coaching" carry any professional-practice or dietetics-licensure implication in any state.

Separately, and not the attorney's job: a registered dietitian or physician under MM-29 for the clinical content of statements 3, 6 and 7.

## Sources (all accessed 2026-10-12)
| URL | Title | Date | Retrieved? |
|---|---|---|---|
| https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices | General Wellness: Policy for Low Risk Devices (landing page) | current as of 01/06/2026 | Yes, landing page only |
| https://www.fda.gov/media/90652/download | General Wellness guidance (PDF) | January 2026 | No, binary; blocked |
| https://www.fda.gov/media/80958/download | Policy for Device Software Functions and Mobile Medical Applications (PDF) | 09/28/2022 per search snippet | No, binary; blocked |
| https://www.fda.gov/medical-devices/device-software-functions-including-mobile-medical-applications/examples-software-functions-are-not-medical-devices | Examples of Software Functions That Are NOT Medical Devices | 09/29/2022 | Yes |
| https://www.fda.gov/medical-devices/digital-health-center-excellence/step-3-software-function-intended-maintaining-or-encouraging-healthy-lifestyle | Digital Health Policy Navigator, Step 3 | 09/27/2022 | Yes |
| https://www.fda.gov/medical-devices/digital-health-center-excellence/device-software-functions-including-mobile-medical-applications | Device Software Functions Including Mobile Medical Applications | 05/27/2026 | Yes |
| https://www.fda.gov/medical-devices/software-medical-device-samd/clinical-decision-support-software-frequently-asked-questions-faqs | Clinical Decision Support Software FAQs | 06/29/2026 | Yes |
| https://www.fda.gov/medical-devices/medical-devices-news-and-events/town-hall-refresh-general-wellness-policy-low-risk-devices-02112026 | Town Hall: General Wellness refresh | null | Yes; confirms reissue date only |
| https://www.ftc.gov/business-guidance/resources/mobile-health-apps-interactive-tool | Mobile Health App Interactive Tool | November 2024 | Yes |
| https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance | Health Products Compliance Guidance | null | Yes, first 100,000 characters |
| https://www.ftc.gov/business-guidance/resources/mobile-health-app-developers-ftc-best-practices | Mobile Health App Developers: FTC Best Practices | December 2022 | Yes |
| https://support.google.com/googleplay/android-developer/answer/16679511?hl=en | Health Content and Services, Play Console Help | null | Yes |

- Tools: this subagent's own WebSearch (discovery) and WebFetch (retrieval); direct path, not chair-delegated.
- All of these are regulatory guidance, non-binding and US-only. None is clinical evidence.
- `docs\evidence.md` supports only the "estimates" and "not professionally reviewed" statements.

## Confidence and limitations
- Overall: medium.
- High for repository facts read directly.
- Medium for the regulatory reading (summaries, not verbatim text; the central guidance unread).
- Low on anything legal.
- No render of any screen was viewed and no test was run.
- No clinician or attorney was involved.

## Proposed acceptance criteria (not existing criteria)
- Given a new install, then the agreement is shown before the sex step and no profile or health value can be entered until it is accepted.
- Given a stored setup with no acceptance record, then the agreement is shown before any target.
- Given the terms were declined, then nothing is stored except what already existed, and nothing is erased.
- Given acceptance, then the same text is readable offline from Settings.
- Given an under-18 date of birth after acceptance, then the adults-only block still applies.
- Given acceptance, then the health check and re-check behave exactly as before.
- Given a bundled terms version newer than the accepted one and flagged material, then re-acceptance is required before coaching and the change is summarised.
- Then the agreement text contains none of: prescribe, treat, cure, diagnose (except in the negative), guarantee, safe (as an assurance), a rate or amount of change.
- Then the guard has a Storybook story (AGENTS.md).
- Edge cases to cover: erase-all (should it clear acceptance?), restore from a future backup, an upgrade mid-onboarding, and a person who ticks eating-disorder history.

## Dependencies
- nutrition, and MM-29's reviewer: the kidney-disease, insulin and lactation numbers, and the emergency symptom list.
- privacy-security: the acceptance record, the data sentence, Health Breach Notification Rule (MM-95).
- product, coaching and voice (MM-108): reading level, prompt fatigue.
- react-capacitor: guard placement and schema.
- MM-96: S2, S4, S5.

## Safety concerns
- The largest risk is the agreement being treated as a safeguard: a disclaimer protects no one who taps through it. The screening, floors and re-check do that work and are themselves unreviewed (MM-29).
- A long legal screen ahead of the health check may also reduce attention to the health check; this is a hypothesis, not observed.
- None of this is clinical clearance.

## Unresolved product decisions (owner)
1. What a person who declines can still do: nothing, or export and erase only.
2. Whether erase-all clears the acceptance record.
3. Whether the S1 behaviours stay as they are, are reworded, or become refer-only, pending the attorney and MM-29.
4. Whether release is blocked on attorney review of the agreement. My position: yes, the same as MM-29 blocks release.

## Not applicable
- Novice mobile experience: none (not assigned).
- Task walkthrough: none (no built screen exists).

## Verification
None executed. Requests to the edit owner: a regression test for the guard order, a test scanning the agreement text for the forbidden words above, and the plain text of the two FDA PDFs so the blocked part of the research can be closed.

---

_Added by the chair when saving. The reviewer wrote everything above; the sections below are the shared template's headings that the report did not use by name._

## Existing facts versus proposals
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Novice mobile experience (when UX/product design is assigned)
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Sources and evidence
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Research
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Acceptance criteria and edge cases
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Unresolved product decisions
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Targeted challenges
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".
