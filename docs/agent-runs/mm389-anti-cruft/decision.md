# Panel decision: lines that narrate the layout (MM-389), a past day heard as today (MM-390)

- **Facts versus proposals and traceability.** Two read-only audits at 6646354 (product, ux-accessibility) and two reviews of the working tree (product-designer, the UX guard). The chair edited, ran the tests and wrote this record. No role rendered anything; the chair ran the stories and the suite.
- **Verdicts.** Product designer: PASS. UX guard: BLOCK on B1, fixed (below); its other checks passed.
- **Findings and disposition.**
  - *The Food line, the Train and Workout intros, the Coach and Progress empty lines, "Press to change", the estimate caption, "Encrypted backup is coming", the theme chooser's slogan and preview label, Coach's repeated check-in row, the Dashboard's "Training", the per-card storage line, the 14-day sentence* (PR-1 to PR-12, PR-14, UX-1, UX-3, UX-7 to UX-9, UX-11): **accepted**, built in MM-389.
  - *The database described as for scanning only* (PR-13): **accepted**, the Settings row and the screen's intro name search.
  - *Folds over empty sections; the figure spoken twice; the welcome arc described* (UX-4 to UX-6): **accepted**, built.
  - *The directions prescribing filler* (UX-2, the product role's list): **accepted**, `design/screen-direction.md` rewritten and a "No narration" limit added to `design/anti-cruft-and-anti-slop.md`.
  - *A past day heard as today* (the UX referral): **accepted** as a bug, MM-390; a third place found by its test, the page's hidden heading. Fixed with failing-first tests.
  - *B1, the test asserting no button names today*: **accepted**, the test and MM-390's criterion narrowed to the headings and the day's disclosure; "Copy breakfast to today" keeps its name.
  - *A fold kept across days hides a first food* (PD-1, the guard's UX-1): **accepted**, confirmed failing first, fixed in `MmSection`: a section that cannot fold forgets its fold.
  - *Two routes to the check-in* (UX-10, PD-5): **opened** as MM-391 with the designer's recommendation.
  - *The unmarked day's subtitle* (the guard's UX-2, PD-6): **opened** as MM-392, pending the coaching and safety roles.
  - *Train's reason line in body text instead of lead* (PD-3): **declined for now**, a preference.
- **Owner decisions taken by the chair ("say if any is wrong", in MM-389):** Train keeps its one reason line; Progress says "No trend yet."; "Encrypted backup is coming" removed.
- **Edit owner:** the parent session (chair).
- **Verification:** `apps/mobile/test/food/emptyDayCruft.test.tsx` (failing on main, passing here), the updated stories and tests, `mm check`. Not verified on a phone or with TalkBack; on the phone checklist.
