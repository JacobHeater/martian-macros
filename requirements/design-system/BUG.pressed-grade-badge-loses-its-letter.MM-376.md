---
id: MM-376
status: done
component: design-system
related: [MM-370, MM-375, MM-267]
---

# Bug: A filled grade badge lost its letter while pressed

## Context
The grade badges took colour fills (MM-370, 2026-10-17). The badge's pressed state came from the design system's shared
pressed rule (MM-267), which sets `background: var(--selected)`. That rule outranked the band's fill while the letter kept
its ink colour (`--on-grade`), so for as long as a badge was held its letter sat at 1.8:1 in Martian (`#110C35` on
`#3F3684`) and about 1.3:1 in Dark. Found by the UX guard (`docs/agent-runs/mm375-warm-martian/`, UX-1) from the
stylesheet; not seen on a phone.

## Description
A pressed grade badge keeps its fill and its letter, and still shows that the press landed.

## Acceptance Criteria
```gherkin
Scenario: Pressed
  When a filled grade badge is pressed and held
  Then its fill and its letter stay as they were
  And a ring in the text colour shows the press landed
```

## Notes
Guarded by `apps/mobile/test/ui/gradePressed.test.ts`, which failed before the fix: no pressed rule of the badge may set a
background or a colour. Fixed in `ui.css`: the badge left the shared pressed rule and has its own, a 2 px ring in
`--text`, with its `.mm-pressed` twin (MM-267's rule test passes).
