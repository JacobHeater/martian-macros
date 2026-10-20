# Product-designer review, WS-03 close (2026-10-20)

Verdict: not ready. Option (a) holds for buttons, but Food and Progress still showed more than one Ember action, and two
Coach text actions could not be told from the values beside them. The Progress hero reads as one figure. The lift rows did
not match the Weight events rows beside them.

1. Blocking. The add plate's plus is Ember at rest (`ui.css` `.mm-icon-button-plate`): Food shows the floating action plus an
   Ember "+" per meal and Water; Progress the weigh-in Save plus Weight events' "+". `hierarchyProblems` counts only primary,
   floating and lead buttons.
2. Blocking. A text action (`--text`, 600, 0.9375rem) looks like a stat value (`--text`, 600, 1rem): Coach's "Pace … Steady"
   then "Change pace"; StallCard's actionable option among plain option lines. Give text actions a non-colour cue.
3. Should-fix. The relief offer's primary and the lead Add food can both be Ember on a weighed Dashboard.
4. Should-fix. Lift rows in an `MmListGroup` surface; the Weight events rows beside them sit on the canvas (rule 1).
5. Consider. The 30d/90d range sits above the figure, which ignores it; "since start" may be read as the range's start.
6. Consider. Three ways into Progress land in different places.
7. Should-fix. Leaving through a link does not save the scroll; only the navigation bar calls `leave`.
8. Consider. The waist status line in `--text` outweighs its how-to caption; the how-to wording differs between Dashboard and
   Progress.
9. Consider. The icon `action` kind now looks the same as `standard`.
10. Consider. MM-288's ticket has not caught up with its decision; the States story has no pressed Text or Lead.
Chair questions: can a newcomer tell 600-weight text actions from values (UX); does the reveal survive `setup` loading (React).
