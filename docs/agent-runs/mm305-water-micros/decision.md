# Panel decision

The chair's outcome for every finding of the five reviews of water, sodium and micronutrients (MM-305,
2026-10-14). The panel advises; the owner decides. **The UX guard passed** on its re-review (no open
blocking finding). The two other blocking findings (PD-1, CO-1) were resolved: PD-1 by the owner's
answer, CO-1 by the build.

## Owner answers (2026-10-14, asked in the interactive session)

- **Micros on the Food screen only** (PD-1): the Dashboard and Coach offer Grams | Split and show Grams
  for a remembered Micros; the long card is accepted on Food.
- **"Goal" kept for water** (CO-7): the glossary now allows "goal" for an amount a person chooses to aim
  for (`design/voice-and-wording.md`).
- **Water goal up to 6 L, with a note above 4 L** (SA-5).
- **Sodium limit from 1,500 mg** (SA-7).

## Findings and where each went

| Finding(s) | Outcome |
|---|---|
| PD-1 (Micros hero too long on Dashboard and Coach) | Owner: Food only. Built (`CalorieHero microsOffered`); story Today/Micros Remembered; test. |
| PD-2, UX-1 (states with no story) | Built: Micros Under Limit, Not Stated, Kidney, Surgery, Eighteen; Water Removed, Other Open, Other Refused; Sodium Limit Refused, Nutrition Goals Kidney, Water Goal High; Today Micros Remembered. No-profile Micros is unreachable (Food needs a setup). UX-1 closed on re-review. |
| PD-3, UX-10 (`--info` fill, marker lost over the fill) | Built: a neutral `--text3` fill; the marker stands above and below the bar with a surface-colour gap. |
| PD-4, UX-3 (bare "+" on the Dashboard; no sizes) | Built: the row opens nothing and carries a visible "+ Add a glass"; Food's buttons say "Glass, 250 ml" / "Bottle, 17 fl oz" in two columns with no-break spaces; "Other amount" as a text action with `aria-expanded`. After the owner saw the first sized version wrap mid-unit, the layout was redrawn and looked at in three palettes. |
| PD-5 (water section outweighs the meals) | First built as a card of sized buttons above the rows: the wrong outcome. The finding's evidence (meals are sections with entry rows) meant Water should be one of them; the owner said so. **Superseded by MM-318**: Water is a section like the meals (`docs/agent-runs/mm318-water-section/`), and rule 9 of the screen direction was written. |
| PD-6 (one marker glyph for limit and reference) | Not built: the note says "your limit"; recorded for a later design pass. |
| PD-7 (local uppercase label; loose rows) | Built: the plain `SectionLabel`. Row tightening: not built. |
| PD-8, UX-9 ("today" on a past empty day) | Bug MM-316, regression test; the line removed. |
| PD-9 (Settings details) | Built: "Amount" rows. Not built: a sodium icon of its own; grouping the typed number. |
| UX-2 (no announcement; focus lost) | Built: a snack naming the day, with Undo, for every add and removal; focus return fixed as MM-317 after the re-review's UX-12. |
| UX-4 (generic refusal) | Built: `NumberEntry refusal`; "That limit is out of range." with the range in the hint; same for the water goal and another amount. |
| UX-5, CO-6, MN-9 (MM-311 wording stale) | MM-311 updated to the built "2,600 of 2,300 mg · 300 mg over your limit". |
| UX-6, MN-4, SA-1 (what "reference" means; one day against usual intake; healthy adults) | Built: one line above the rows. |
| UX-7 (limit invisible below Full detail) | Built: the switch's subtitle says where it shows and the person's level. |
| UX-8 (rows heard in pieces) | Built: one visually hidden sentence per row with units spelled out. TalkBack unverified. |
| UX-11 (group name "Macro picture") | Built: "What the card shows". |
| UX-12 (focus not returned) | Bug MM-317, regression test. |
| UX-13 (removal snack without the day; stale total on Food) | Built. |
| CO-1 (sodium insight would reach an eating-disorder history; blocking) | Built: `InsightRule.otherIntake`, filtered with `limitToProteinAndLogging`; test. |
| CO-2 (lopsided denominator) | Built: "on 5 of 8 days with enough sodium data" and evidence rows for days judged and left out. |
| CO-3 (unsourced claim; nudge) | Built: softened to "In many diets, most sodium comes from packaged and restaurant food."; no "where to look"; the claim's row in `docs/evidence.md`. |
| CO-4 (a changed limit rewrites the past) | Built: `sodium_limit_since_epoch_day`; only days since are judged; test. |
| CO-5 (catalog place) | Built: after `proteinShort`, before `proteinByMeal`; test. |
| CO-7 (goal vs target) | Owner: keep "goal"; glossary amended. |
| CO-8 ("Goal reached" acceptable) | No change; MM-313 says the Dashboard never says it. |
| CO-9, SA-5 (water ceiling; kidney) | Owner: 6 L with a note above 4 L; a kidney subtitle on the water switch. |
| SA-2 (kidney wording) | Built: "some of these amounts may be different for you; ask your care team." |
| SA-3, MN-6 (MM-310 out of date; bariatric) | Built: withheld after bariatric surgery; MM-310 lists all four reasons and lines. |
| SA-4, MN-1 (no tests) | Built: `test/domain/micronutrients.test.ts` (every DRI band edge, withholding order, 18/19, coverage with a stated 0). |
| SA-6 ("usual adult limit") | Built: "2,300 mg is the US guideline for adults." |
| SA-7 (500 mg floor) | Owner: 1,500 mg. |
| SA-8 (evidence register) | Built: eleven rows; the register test now reads `NutritionGoals`. |
| SA-9 (supplement labels; capped bar) | Not built: an owner question for later, in MM-309's notes. |
| MN-2 (Open Food Facts vitamin A and folate) | Built: left unknown in `extract.sql`; MM-307 says why. |
| MN-3 (loose maxima) | Built: each from a named top food; MM-307 lists them. |
| MN-5 (reason for no ULs) | MM-310's reason replaced. |
| MN-7 (RAE, DFE) | Built: the custom food fields say "µg RAE" and "µg DFE". |
| MN-8 ("No data yet") | Built: "Not stated by any food", once per group. |

## Verification

Renders at 412 by 915 from the static Storybook, Martian, Light and Dark for the main states, before and
after the changes. `mm check` on the branch (see `state.json`). Not looked at: the phone, TalkBack, 200%
text. The chair is also the edit owner, so its view of the result is not independent; the UX guard's
re-review is.

## Process notes for the next run

- The reviewers were briefed with the findings template named in a shared instruction file and the run
  folder created first, as the last run's notes asked.
- A change made after the review (sizes on the water buttons) shipped to Storybook before it was looked
  at, and the owner caught it wrapping mid-unit. Look at every post-review change in the browser before
  saying it is done.
