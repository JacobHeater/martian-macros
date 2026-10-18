# Panel decision: every rule that holds on an item shows its own line (MM-393)

- **Facts versus proposals and traceability.** The owner logged biscuits as several servings: only the portion check showed, because MM-362 kept one insight per item; the protein line that also held was hidden. The owner chose "All, stacked by priority". Two read-only reviews of the working tree: the product designer and the UX guard. The chair edited, ran the tests and wrote this record. No role rendered anything.
- **Verdicts.** Product designer: PASS. UX guard: PASS.
- **Findings and disposition.**
  - *Each line keeps its own mark; no CSS change: the gap keeps two controls from reading as one paragraph* (the designer): **accepted**, nothing changed.
  - *Three food rules can hold on one entry; draw the worst case* (PD-1, the guard's chair request): **accepted**. "Mostly fat" and "Light on protein" can hold together (for example 920 kcal, 57% from fat, 7% from protein), so the story `FoodThreeInsightsOnOneEntry` draws three lines.
  - *Focus after snoozing one of two lines lands on a neighbouring line, not always the item; the comment and MM-379 say "the item"* (UX-1): **accepted**, both reworded.
  - *No test snoozes one of two lines interactively* (UX-2): **accepted**, "snoozing the second of two lines puts the focus on the first".
  - *Should "Mostly fat" give way when "Light on protein" holds?* **declined**: the owner's rule is that one rule never hides another.
- **Edit owner:** the parent session (chair).
- **Verification:** `test/coach/foodAndBodyInsights.test.tsx` (two lines in order under one entry, failing before the fix; one snoozed; focus after a snooze), `test/engine/allowedItemInsights.test.ts`, the stories `FoodTwoInsightsOnOneEntry` and `FoodThreeInsightsOnOneEntry`, `mm check`. Not seen in the three palettes or on a phone; on the phone checklist.
