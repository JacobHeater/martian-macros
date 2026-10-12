# Panel decision: Add food, walked

- Facts versus proposals and requirement traceability: the sheet was walked
  as built at `ca3ff57`, against MM-38, MM-42, MM-48, MM-150, MM-167 and the
  design documents. Every proposal is in a ticket marked proposed; nothing in
  the app was changed.
- Consolidated inspected/uninspected coverage, evidence methods and referrals:
  walked on source and six screenshot tests: the opened sheet, the typed form,
  search, the amount step, estimate, editing. Walked from source only: other
  edit states, the saved-food form, raw or cooked, cooking oil, estimate before
  a maintenance figure. Surveyed: barcode scanning, recipes, the label reader.
  Not looked at: Light and Martian, larger text, the keyboard open, any device
  or screen reader. Methods: source inspection, render inspection, task
  walkthrough. Two reviewers, neither shown the other's report or told what to
  look for.
- Deduplicated classified findings and confirmed issue-to-ticket routing:
  - **Defects, confirmed by a test that fails:** MM-213 route labels break
    mid-word (seen by both, first found by the chair on the first screenshot);
    MM-216 changing the method clears the amount silently, against MM-167
    (designer's edge case, confirmed by the chair); MM-217 a hand portion of a
    found food reads as exact, against MM-167 and MM-46 (UX F-12).
  - **Usability problems found by inspection, by cause:**
    what will be logged is not said (F-01, PD-01, F-07, PD-09, F-13) to
    MM-218; finding and typing are not told apart and ways in vanish (PD-02,
    F-02, F-03, PD-05, PD-06, F-14) to MM-219; the action is out of view,
    silent when off, and the sheet has no way out (F-04, PD-03, PD-04, F-08,
    F-05, PD-14, F-09, PD-15) to MM-220; editing hides what was typed (F-06,
    PD-08, F-10, PD-07, F-11, PD-13) to MM-221.
  - **Requirement gap:** `design/screen-direction.md` describes a different
    sheet (F-17, PD-14): an owner question, carried in MM-220 and the handoff.
- Accepted/rejected findings with reasons and sources: all of the above
  accepted as classed. Rejected as findings, kept as notes: PD-10 and PD-11
  (emphasis, chip headings and density) and F-15 (keyboard and field order)
  are design improvements with no failing step; they are mentioned in MM-219
  and MM-220 where they bear, and not ticketed on their own. One external
  source was read by the designer (the FDA label page) for an ordering remark
  only.
- Disposition of every finding (ticket, owner question, verified now, or
  rejected) and each reviewer request for evidence, answered: every finding
  above has a ticket or a stated reason. F-16 (screen reader, focus, large
  text) cannot be verified here: it goes to the repository handoff as needing
  a phone. Requests for evidence: the edit of an entry typed per serving was
  supplied (`add_food_edit_per_serving_dark`) and confirms F-06 and PD-08.
  Declined for now, and recorded in the handoff: screenshots with the keyboard
  open, at the largest text size, in Light and Martian, of estimate with no
  maintenance figure, of search with no results, of a cooked food with oil; an
  emulator check of how the sheet is dismissed; a screen-reader pass. A test
  pinning what F-01 logs already exists ("typed totals are never multiplied
  by the servings").
- Targeted challenges, alternatives and remaining conflicts: none run. One
  difference kept: the designer judged the two calorie bases in search results
  told apart in words; an outside reviewer had called them inconsistent. The
  panel's reading stands as a pass for that step, with the opposite behaviour
  of the two rows as the finding (PD-06).
- Safety/privacy blockers and qualified review needs: none. Both reviewers
  note that F-01 can under-record intake without the person knowing, which
  the coach then reads; whether that matters to a safeguard is for the
  measurement and safety roles, which were not in this run.
- Actual owner decisions (not persona consensus): none taken. Four questions
  are open in the tickets.
- Acceptance criteria, edge cases and cross-domain dependencies: in MM-218 to
  MM-221, each marked proposed.
- Designated single edit owner and exact paths: the chair, for this folder
  and the tickets and tests named above.
- Verification plan, actual results and remaining limits: three guards run
  enabled once and seen to fail, then skipped under their tickets; the
  screenshot tests pass on Linux. Nothing was run on an emulator or a phone,
  and nobody was observed using the sheet.

## What this run shows about the review method, and what it does not

The reviewers were not told the concerns an outside reviewer had raised about
this sheet. They reached most of them: the mixed first screen, what the typed
numbers are for against the amount, editing that hides the basis, the estimate
with no reviewable result, the calories that will be kept, and the oil. They
did not raise one (the calorie bases in results, judged a pass) and treated
another as low (overlapping units). The chair did know the concerns and chose
this sheet, so the choice of target is not evidence; the counting rule would
have chosen it, which is evidence of a weaker kind.
