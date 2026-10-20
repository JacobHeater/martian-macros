# Accessibility rules every screen meets

The rules of MM-106, as decided there (WCAG 2.1 AA), what checks them by
machine, and what only a person with a screen reader can check. A new or
changed screen is reviewed against the checklist in section 3 before it
ships, in the three palettes (`mm storybook`), and the UX-accessibility role
of the panel grades it against the same list.

## 1. The rules

1. **Contrast.** Text holds 4.5:1 against its background (3:1 at 24 px, or
   19 px bold); chart lines, bars, icons that carry meaning and the
   boundaries of controls hold 3:1. The tokens are checked, not the
   screens: every text role on every surface level, Ion on every level, the
   field border, the grade letters, Ember's label on Ember, the lead action
   and the current destination in Ember on the canvas and the surface, the
   semantic colours (caution, info, danger, positive) as text and icon, and
   the macro colours on their track (`test/tokens.test.ts`).
2. **Touch targets.** Everything pressable is at least 48 by 48 dp. No
   pressable control in the design system's stylesheet (`ui.css`) sets a
   smaller minimum height in px (`test/ui/targets.test.ts`; screens' own
   stylesheets and heights in rem are not read by it); a status chip, which
   does nothing when touched, is the one smaller chip.
3. **Text scaling.** Every screen works at 200% text: layouts wrap or
   scroll, they do not clip. Every type size is in rem. What is known: on
   Android the system font scale reaches the web view as text zoom, which
   scales fonts and not lengths; the stories set the root size to 200%,
   which scales both, so they approximate the phone rather than reproduce
   it; whether the iOS web view follows the phone's text size is not yet
   checked (`test/app/largeTextLayout.test.ts` reads the rules
   that make the navigation labels, the app bar and the row actions wrap);
   the large-text stories are the check by eye (`Screens/Today` Dashboard
   Large Text and Not Weighed Today Large Text, `Screens/Progress` Progress
   Large Text, `Screens/Coach` Coach Large Text, `Screens/Food` Food Large
   Text, and the `Designs/Coaching insights` stories at 200%).
4. **Never colour alone.** Anything shown by colour is also shown by a
   label, an icon or a position: a macro bar carries its name and figures;
   a notice carries its icon and its word; the current destination is
   `aria-current` with a heavier label and an indicator; a chosen segment
   carries a check mark (and `aria-pressed`, which is the spoken cue only);
   a text action is underlined, since it shares the text colour and weight
   with the values and titles beside it (MM-288); a record is a mark with its words; the method of a
   food entry is an icon beside its word (`test/gallery/accessibility.test.tsx`).
5. **Screen readers.** Every control has a name; a figure is read with its
   unit and meaning ("Trend weight 184.1 lb"; the arc's spoken figure); a
   chart is an image with a sentence ("Weight trend over the last 30 days.
   Trend weight 184.1 lb, from 71 weigh-ins."); reading order follows the
   layout, and on Food the floating action comes right after the bar
   (MM-286). Names are checked on every destination story
   (`test/gallery/accessibility.test.tsx`); the order and the sense of it by
   hand (section 4).
6. **Every gesture has a visible alternative.** A row that swipes away
   also offers Delete from its "More actions" menu; the test finds a menu
   button inside every swipe row (`test/gallery/accessibility.test.tsx`).
7. **Motion** respects the phone's reduce-motion setting: every transition
   and animation takes its duration from a `--motion-*` token, and the
   tokens go to 0 ms under `prefers-reduced-motion` (the spinner turns
   slowly, fades keep 100 ms); the pressed scale becomes an opacity change;
   a bar that pours is at its level at once (`test/ui/reducedMotion.test.ts`,
   `test/ui/waterBarReducedMotion.test.tsx`).
8. **No time limits** on reading or acting, except a timer the person
   started (the rest timer). A snack with an action waits until it is
   dismissed or acted on (MM-272).
9. **Nothing native shows, and nothing native is relied on** (MM-262): the
   design system draws every control and every state, and the native
   element underneath exists only for the keyboard and assistive
   technology.

## 2. What is checked by machine

| Rule | Where | What jsdom can honestly say |
|---|---|---|
| Contrast | `test/tokens.test.ts` | Ratios between the palette's tokens, by arithmetic. Not what a screen composes from them: a screen never picks a colour, so the pairs are the tokens' (`test/architecture.test.ts`). |
| Touch targets | `test/ui/targets.test.ts` | Every pressable rule's minimum height. Not a measured box: nothing lays out in jsdom. |
| Text scaling | `test/app/largeTextLayout.test.ts` | The rules that let the bar, the labels and the row actions wrap. Not whether a label fits: the large-text stories are looked at in a browser. |
| Names | `test/gallery/accessibility.test.tsx` | Every button, field, switch, slider and image drawn on every destination story has an accessible name, computed as a reader computes it. Folded sections draw no rows, so what sits inside a fold is not checked here. |
| Colour alone | `test/gallery/accessibility.test.tsx` | Each notice has an icon and words; each macro bar a name and figures; the current destination `aria-current`; a chosen segment its check mark. |
| Gestures | `test/gallery/accessibility.test.tsx` | Every swipe row has a "More actions" button beside it; the menu's contents are not opened here. |
| Motion | `test/ui/reducedMotion.test.ts` | Every duration is a token; the tokens go to 0 ms under reduced motion. |
| Figures and charts | `test/charts/charts.test.tsx`, `test/progress/progressHero.test.tsx` | The trend figure's spoken form; the chart's `role="img"` and a name with words and a figure (the destination test checks only that shape, the chart tests the sentence itself). |

The checks are of markup and stylesheets. They cannot say whether the app
makes sense by ear.

## 3. The checklist for a new or changed screen

- [ ] Every control has a name a reader would say; two alike are told
      apart ("Save weigh-in", "Save waist").
- [ ] Every figure is read with its unit and what it is.
- [ ] Every chart has a sentence; every icon that carries meaning has a
      word beside it or a label.
- [ ] Nothing is said by colour alone.
- [ ] Every pressable is 48 dp; targets do not overlap.
- [ ] 200% text: looked at in the browser; nothing clips, everything is
      reachable, the primary action stays in view or reachable.
- [ ] The design width is 412 dp (screen direction rule 7; smaller phones
      are not designed for, the owner's call). At 360 dp nothing may be
      unreachable; a squeeze is acceptable, a lost control is not.
- [ ] Both themes and Martian, together.
- [ ] Focus: after a save in place, focus is on what replaces the entry
      (MM-304); a dialog traps focus and gives it back; the ring is never
      clipped (MM-275).
- [ ] Reading order follows the layout; the primary action comes early.
      The one exception: the floating action is the first stop after the
      app bar though it is drawn at the bottom (MM-286), so the by-hand pass
      checks that it is announced as what it is.
- [ ] A swipe has a button; a long press has a visible alternative.
- [ ] Reduced motion: no movement, the state change stays.
- [ ] No time limit the person did not start.

## 4. What needs a by-hand pass with a screen reader

Not done as of 2026-10-20, and not claimable from jsdom. On a phone with
TalkBack (Android) or VoiceOver (iOS):

1. Onboarding end to end: every step's question, choices and Continue are
   announced in order; the sex question has no default; under 18 blocks
   with a reason read aloud.
2. Log a food: Add food from the Dashboard's bar and from Food's floating
   action; search, pick a result, hear the "Logs …" line before the button;
   the entry's row reads name, macros, method and calories; Delete from
   More actions; the Undo snack is announced.
3. Record a weigh-in on the Dashboard: the field, its hint, Save; after
   saving, focus lands on the trend row and it is read; "Open Progress" is
   found on the snack.
4. Progress: the trend figure reads "Trend weight …"; the chart reads its
   sentence; the Waist section's header reads its state when folded; the
   three fields are told apart.
5. The navigation bar: each destination and which is current.
6. 200% text with the reader on: nothing unreachable.

Record the pass under `docs/agent-runs/` with the device, OS and reader
versions, what was heard that was wrong, and a ticket for each defect.

7. Text size: the phone at its largest system font, on Android and on iOS,
   for Today, Food, Progress and Coach; nothing clips and every control is
   reachable. The stories approximate this (section 1, rule 3); they do not
   replace it.
