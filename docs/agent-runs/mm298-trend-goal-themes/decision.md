# Panel decision

The chair's outcome for every finding of the two reviews of the weight
row's trend and today (MM-298), the goal first on Coach (MM-299) and the
disabled button in every palette (MM-297), 2026-10-14. **The UX guard
passed**; the product designer approved with changes. Neither raised a
blocking finding.

## Findings and where each went

| Finding(s) | Outcome |
|---|---|
| PD-1, UX-1 ("Trend · Today 183.9 lb" read as the trend's value today) | Built: the figure names itself, "Trend 184.1 lb"; the line is "Today 183.9 lb · 7 days −0.6 lb". UX-1's form chosen over PD-1's verb ("weighed 183.9 today") because it fixes the heard order too. |
| UX-2 (day 1 duplicates the value, "7 days —", the no-trend branch unreachable) | Built: with fewer than two trend points the row shows today's weight once with "Today’s weigh-in · the trend starts tomorrow"; "7 days" is left out with no point a week back; MM-298's scenario 3 rewritten and tested. |
| PD-6, UX-3 ("Last trend" ambiguous) | Built: "Trend so far 189.6 lb". The subtitle in the field's description: pending (could). |
| PD-2, UX-4 (disabled primary reads as an enabled secondary) | Built: disabled label at 38% of `--text` and outline at 16%, by `color-mix`, in every palette (the platform convention PD-2 cites); no new palette hex values. Looked at in States in Light, Martian and Dark. |
| PD-5 (MM-297 text, States cells) | Built: MM-297 states the built rule with PD-2's acceptance; States draws Disabled after Primary, Secondary and Text. |
| PD-7, UX-6 (field border contrast at the margin) | Built: `test/tokens.test.ts` asserts `--outline-strong` ≥ 3:1 against `--surface`, `--raised` and `--canvas` in every palette (all pass; Light 3.55, Dark 3.33 against surface). |
| UX-5 (field and disabled Save differ) | Accepted: met; better after PD-2. |
| PD-3, UX-8 (rule 7, the register row, comments, no story with the one thing due) | Built: rule 7 and the Coach register row amended (the goal first; small phones out of scope, the owner's call); `CoachScreen` and the Coach stories' comments; `Screens/Coach/Check In Due` (`checkInDueScenario`). At 412 by 915 with a caution the one thing to do is in the first viewport. |
| UX-7 ("Change" with no object) | Built: "Change goal". |
| PD-4 (the Goal section heavier than its fact; a row instead) | Not built: the owner asked for the goal as the first thing; the section as he saw it is kept. Offered to the owner as an option. |
| Anchoring (both reviewers' bounded request to measurement) | Open: the owner decided to show the trend before the weigh-in; placement relative to the field is the measurement role's question, not asked in this run. |
| Goal switching (PD's request to safety/coaching) | Open: a goal change already goes through the health re-check; not asked in this run. |

## Owner decisions recorded

- Small phones (360 by 740) are not designed for (2026-10-14): the
  pending decision `MM291-first-viewport-360` of `mm291-weigh-in` is
  rejected by the owner, and rule 7 says so.
- Trend before the weigh-in and today's entry after it: yes (MM-298).
- The goal first on Coach under the figures and warnings (MM-299).

## Verification

Renders after the build at 412 by 915: Not Weighed Today in Light; the
demo Dashboard and First Day in Martian; Coach Check In Due in Martian;
States in Light, Martian and Dark. The new tests in `dashboard.test.tsx`
and `coachFlows.test.tsx` failed on the previous commit's source and pass
on the branch; the token test is a guard and passed on both. The chair is
also the edit owner, so its view of the result is not independent.
