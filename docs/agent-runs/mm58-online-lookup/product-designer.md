# Product-designer review: online food lookup UI (MM-58, MM-57), 2026-10-20

Read-only, source and stories inspected (no render). Verdict: sound in shape and honest in words, but the ask state showed
two Ember fills on one sheet, three sibling patterns were departed from without a written reason (side-by-side answer
buttons, a Settings group header inside the add sheet, paragraph-length row subtitles on the sources screen), and two
privacy sentences the feature made untrue were not reworded.

1. Blocking. Two Ember fills in the ask state: the camera button stayed primary while the question's "Just this once" was
   primary (rule 6, anti-cruft §3). The hierarchy check runs destination stories only, so a sheet escaped it.
2. Should-fix. "Nothing is uploaded." on the scan step and "The only thing this app ever fetches." in Settings, both untrue
   once a barcode may be sent on request.
3. Should-fix. Three answers are the right shape (Android's own one-time grant is the precedent), but Always and Never as
   equal half-width twins invite a mis-tap on the one answer a novice cannot undo without finding Settings. Ladder by
   consequence and stack like the step's own buttons: primary, secondary, text.
4. Should-fix. "Looking it up online…" as a static info notice reads as a message, not waiting; search uses a spinner row,
   as the Food database screen does.
5. Should-fix. Unreachable states differ between the parts and narrate buttons already shown; no Try again on scan; an
   Ember text Try again under a notice on search where the notice rule asks for a secondary button.
6. Should-fix. "Found online" header drawn over "Nothing found online".
7. Should-fix. A Settings `GroupHeader` (h2) inside the add sheet, whose siblings use a `food-label` paragraph.
8. Consider. Online rows lack the `FoodGrade` the pack rows carry.
9. Should-fix. Sources screen rows used as paragraphs: 40 to 60 words of caption text under non-pressable rows.
10. Should-fix. Attribution and "On this phone" in two homes (Food database and the sources screen).
11. Consider. A read-only copy of the Settings choice on the sources screen.
12. Should-fix. The Data group states the sending rule three times, once untruthfully in a build with no source.
13. Consider. "found online" lowercase after two capitalised segments.

Wording audit otherwise passes: no "verified", no praise; the Settings row matches the Units pattern; "Search online"
matches "More results"; the ask reuses the step's Notice. Research: Android 11 permission dialogs offer "Only this time"
beside allow and deny (developer.android.com/about/versions/11/privacy/permissions, accessed 2026-10-20). Chair requests:
heading level of the group (UX-accessibility); whether text addresses satisfy MM-57's "with links"; whether any "nothing is
uploaded" sentence should remain on the scan step (owner).
