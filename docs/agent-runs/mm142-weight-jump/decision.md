# Panel decision: a weigh-in's explanation and the waist's drawing and chart (MM-142, MM-155)

- **Facts versus proposals and traceability.** Two M2 tickets built on `wt/measure` (from `feat/m2` at 24130ec) and
  reviewed in one round from the brief by two read-only roles, neither seeing the other: the product designer (PD-1 to
  PD-14) and the UX guard (UX-1 to UX-12). No render in this session: the stories were read from source. The chair
  (the parent session) edited after the reviews, ran the tests and wrote this record.
- **Verdicts.** UX guard: **no blocking finding**; one high (UX-1), two medium (UX-2, UX-3). Product designer: one high
  (PD-1), several medium. The two reports agree where they overlap (PD-1/UX-2, PD-2/UX-5, PD-8/UX-7, PD-14/UX-4) and
  differ on nothing material.
- **Consolidated coverage.** Inspected by both: the Dashboard trend row and its line, the Progress chart and note, the
  Waist section with the drawing, steps, fields and chart, the stories, the tests, the direction documents. Not
  inspected by anyone: a render in any palette, a device, assistive technology, the engine's thresholds.
- **Findings and disposition** (deduplicated by cause):
  - *The closed line is a paragraph; the layer below repeats it* (PD-1 high, UX-2 medium): **accepted.** The line is
    the distance and the likely cause(s) (or "nothing in your log" and its offer; a low reading keeps "will probably
    come back"). The arithmetic is the last of the figures, once; after an overshoot the figures say "Over target by",
    "Fat this could have stored: at most about 0.3 kg" and "The rest of the difference: water and food". The chair
    answers the designer's request 1 for the coaching role: MM-142's "carries the arithmetic line once" is met once per
    explanation, and the "not fat" message stays where the person opens the figures; recorded in MM-142's Decisions.
  - *"Settings for" lands on a screen with nothing to set* (UX-1 high): **accepted**, remedy (b). `InlineInsight`
    draws the Settings button only for a line of a listed kind (one that logs itself). The rebound note shared the gap:
    **MM-418**, done, guarded in `weightJump.test.tsx` and by the volume-jump route test. The line has no switch: it
    goes with the weight display (MM-118) and the safeguards (the guard's safety note, answered in MM-142).
  - *A picked and explained reading is said twice* (PD-2, UX-5): **accepted.** The caption carries the reading alone
    when the line is beneath it.
  - *The pick is pointer-only* (UX-3 medium, UX-8): **accepted**, the smaller remedy. The pickable chart takes focus;
    ArrowLeft/ArrowRight move the pick, Home/End to the ends; the note sits in a polite live region that exists before
    its text. The readings list the direction names is noted as the fuller answer, not built.
  - *Nothing says a dot can be tapped* (PD-14, UX-4): **accepted.** One clause in "How to read this".
  - *The offer points a person on Progress to Progress* (UX-6): **accepted.** "add it under Weight events below" there.
  - *With one or two entries the waist chart draws what its caption does not describe* (PD-8, UX-7): **accepted.** Dots
    alone under three measurements; the caption says the line comes from the third. The chair answers the designer's
    request 2 for the measurement role: a middle of fewer than three is what the change function falls back to at an
    end, not a line worth drawing.
  - *The `plain` line is indented against the hero's captions* (PD-3): **accepted**, scoped to the note (`--note-start`
    and `--note-end` 0 there).
  - *The band sentence is separated from its chart* (PD-4): **accepted.** Chart, band sentence, note, disclosure.
  - *The picked dot takes Ion* (PD-5): **accepted.** `--text` at the larger radius with the canvas ring.
  - *The figure's tape is Ion* (PD-6): **accepted.** The tape is `--text`, the heaviest stroke; the figure is monochrome
    like its siblings.
  - *The navel is probably too small* (PD-7, hypothesis): **accepted in part.** Navel r 2.6 units; the tape's front
    ends now show. The render in three palettes is the owner's look.
  - *"Waist over time" has the section title's type role* (PD-9): **accepted.** A sub-head in the label type.
  - *The waist block's controls sit on the canvas* (PD-10): **deferred to the owner.** The fields have sat in the
    section since MM-257 and the Weight events section's add button is the same pattern; said in MM-155.
  - *Steps' markers and wording* (PD-11): **accepted in part.** A numbered list; the Dashboard row's one-line hint
    (MM-301) is kept, the drawing belongs to the Progress entry (UX-9, said in MM-155).
  - *The report's waist line is a sentence in the value column* (PD-12): **accepted.** Value "Down 2.5 cm" / "No clear
    change", the ends and threshold as the row's `detail`.
  - *The measurement colour is a macro hue* (PD-13): **owner's question**, pre-existing; no change.
  - *The alternative restates the steps* (UX-10): **accepted.** "Drawing: where the tape sits, level around the waist at
    the navel."
  - *Dead CSS* (UX-11): **accepted**, removed.
  - *iOS text scale may not follow rem* (UX-12, hypothesis), *TalkBack double-tap on the chart* (UX-3b), *the render
    of the figure and the 200% stories*: **device and render checks on the owner's list** (handoff).
- **Targeted challenges.** None run: the reports agree where they overlap.
- **Safety and privacy.** No new hazard in either report; the guard's concern (a per-reading line with no off switch)
  is answered: the line is withheld under 18, with an eating-disorder history and with weight hidden, and MM-118's
  setting is its switch. Health data stays on the phone.
- **Owner decisions.** PD-10 (controls on the canvas in a section), PD-13 (the measurement colour), the first drawing
  of a person (the designer's question 1), the renders by eye in the three palettes of `WeighInJump`,
  `WeighInJumpNothingInLog`, `WeighInOvershoot`, `ProgressWeightJump`, `ProgressPickedJump`,
  `ProgressWaistFirstMeasurements`, `ProgressWaistChart`, the device checks (UX-3b, UX-12).
- **Edit owner:** the parent session (chair).
- **Verification.** Typecheck clean after the edits; the engine, format, voice, architecture and layer suites pass;
  the dashboard, progress, charts and coach suites and `npm run unseen` are recorded in the ticket's handback once
  the machine is free of the sibling worktrees' runs (four coach tests timed out under that load before the edits
  and are rerun).
