# UX and accessibility review: online food lookup (MM-58, MM-57), 2026-10-20

Read-only, source, stories and tests inspected (no render, no screen reader, no text-scale or contrast measurement).
Verdict: no blocking findings; 9 should-fix and 7 consider.

- F1 should-fix. "Just this once" lasts the whole run of the app, not once: the label does not describe the effect.
  Either reset after one lookup or say it ("Just for now", "until you close the app"), in the question and the terms.
- F2 should-fix. Settings' "The only thing this app ever fetches." is now false.
- F3 should-fix. The question appears silently for a screen reader: the status region is emptied and the ask drawn
  outside it (WCAG 2.2 SC 4.1.3).
- F4 should-fix. Focus is dropped to the document after every answer and after "Search online", since the pressed
  button unmounts (WAI-ARIA 1.2 §4.3.1). Keep the buttons mounted and off while the lookup runs.
- F5 should-fix. Two Ember fills at the consent moment in the scan step (rule 6).
- F6 should-fix. "Never" is undoable but neither said nor pointed to; "in Settings" does not name the Data section,
  which starts folded.
- F7 should-fix. The empty-database sentence omits the online path it sits above.
- F8 should-fix. Online results and "nothing found" are not announced; the spinner's status region is created with its
  text (MDN: establish the live region before updating its content).
- F9 should-fix. The privacy disclosure on the sources screen is caption-size muted text, four to six lines long.
- F10 consider. The group's aria-label duplicates the Notice's first sentence.
- F11 consider. "Always" does not say what it commits to.
- F12 consider. Always and Never identical half-width secondaries side by side; Never persists.
- F13 consider. The sources screen states the choice but offers no way to change it.
- F14 consider. The lock row's sentence is wrong for a build with no online source.
- F15 consider. "in builds that include it" is developer language in the terms.
- F16 consider. Online rows lack the grade; "Found online" is an h2 at the sheet title's level; no story draws online
  results beside pack results.

Answers to the brief: what is sent and to whom is said before any request (tests assert no request before an answer);
reachable by DOM order but not announced (F3) and focus dropped (F4); Never is undoable in Settings, Data (tested), its
discoverability resting on one unlocated pointer (F6, F13); the no-database search flow works but its sentence
contradicts the button (F7); nothing is conveyed by colour alone; nothing is clipped on the sources screen but the
privacy sentence is the smallest text (F9). Research: MDN "ARIA live regions" (modified 2026-09-11), WAI-ARIA 1.2 §4.3.1,
WCAG 2.2 Understanding SC 4.1.3, all accessed 2026-10-20. Chair requests: TalkBack and VoiceOver verification of the
status region and of where focus lands (not possible this session); the owner on F1.
