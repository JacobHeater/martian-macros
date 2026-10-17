# Review: product, run `mm375-warm-martian`

Saved by the chair, as returned by the read-only reviewer (Claude Opus 5.5 subagent, 2026-10-17). Planning mode.

## Scope and traceability
Read: MM-184 (done), MM-370 (proposed), MM-108 by grep; `brief.md`, `design/color-and-theme-system.md`,
`tokens.css` 7-37; renders food-with-insights, dashboard-with-insights, workout-with-insights,
coach-recent-insights, settings-coach-section (martian). Hashes not computed. Not inspected: `tokens.test.ts`,
`flutterTheme.json`, component CSS, other renders.

## Facts
- MM-184's approved Gherkin pins "deep grape surfaces, cream text and acid-lime actions" and "cyan, pink and violet
  macros" (lines 48-52). Changing the surface hue or moving fat off violet amends a done, owner-approved requirement;
  MM-375 must supersede those lines.
- ion and protein are the same hex in Martian, `#43f5e0` (tokens.css 22, 25), against doc §4.
- MM-370 said "no traffic-light colours … neutral outlined badge"; the owner now asks for fills.
- §1.3 "Ember is the only warm hue" is already untrue for Martian (ember is lime; carbs, caution, danger are warm).

## 1. Purple washout, in product terms (visual reading, not measured)
- One field, no figure and ground: canvas, cards, nav bar, selected pill, tracks, outlines, outlined buttons, toggle
  off-state and the fat bar share one grape hue; cards separate only by a lavender hairline.
- Text hierarchy is lilac on violet: `text2`/`text3` share the ground's hue, so detail lines read as background.
- Workout has no accent: violet, cream, lavender only; "Add set" and "Add exercise" weigh the same as the cards.
- Purple on purple carries meaning: the fat bar on its track; the selected nav pill.
- Lime is the only colour that pops and does every job; nothing warm shows on these five screens.

## 2. 90s references (WebSearch, WebFetch; accessed 2026-10-17)
| Reference | Gives Martian | Dates badly |
|---|---|---|
| Early-90s sports teal and purple (Hornets, Marlins, Sharks) | Martian's current aqua on grape: both cool, hence the washout | Teal was "a fad color during the 1990s" |
| Nickelodeon orange splat (1984-2009) | One loud flat orange as the warm voice ("Always orange. Different shape.") | Splats and slime read as kids' TV; take the colour only |
| Memphis / Saved by the Bell | Clashing warm brights on a dark ground beside teal and purple | Squiggles and confetti; polarizing, mocked; take hues, never patterns |
| 90s Nike ACG | Black base with bold touches of orange, purple and red: the closest fit | Red (MM-108) |
| Lisa Frank / Trapper Keeper | Permission for hot pink (carbs has it) | Rainbow neon, glitter, juvenile; neon grade stickers would read as parody |
| Windows 95 teal `#008080` | Nothing warm | Grey bevels are parody |

Limits: popular-press and encyclopedia sources; Uni Watch and MLB.com failed to load; resale listings not used.
Reading: a dark ground plus one or two flat, saturated warm accents (Nickelodeon, ACG), not the patterned rainbow side.

## 3. Where warmth enters, in priority
1. `text2`/`text3` warmed toward cream (breaks the lilac haze everywhere at once).
2. Fat moved off violet (tangerine/orange; ≥10 L* from carbs, apart from caution gold).
3. Neutrals toward plum/aubergine and/or lower chroma in higher layers; larger steps between levels.
4. Grade fills: four non-red solids as warm points.
5. Action stays lime (approved in MM-184); a swap to orange is the owner's decision.
6. State colours: caution and danger already warm; leave unless they collide.

Rule collisions: overrule the warm-neutral ban only for Martian text roles (keep the ban on beige/brown/tan/sand
surfaces); keep peach/salmon ban and check `danger #FF938E`; keep the gradient and glow bans; restate "one hot accent" as
one action colour; keep the no-wash rule (a grade badge is a small solid, not a wash); overrule the one-ion budget for
insight lines (count them as one group) by the owner's instruction; keep macro-only colours and enforce them (protein and
ion must part; grades may not reuse macro hues).

## 4. Proposed acceptance criteria
(As returned; adopted, edited, into MM-375.) The washout gone in the owner's eyes on Food, Dashboard, Workout, Coach and
Settings; cards, nav and canvas distinct without outlines; secondary text not the surface hue; a warm element on every
screen; still Martian (dark purple-family canvas, cream text, flat solid action, no pattern, gradient or glow; MM-184
amended); contrast (text 4.5:1 on all four levels; graphics 3:1; text on fills 4.5:1); macros ≥10 L* apart and apart
from ion, water, grade fills and neutrals; CVD ΔE about 20 or the three-way fallback; grade fills distinct, none red,
none peach, letters always printed, not a traffic light; ion caption text 4.5:1 and apart from protein; tests updated.

## Findings
- P-1 (high, gap): MM-184's done Gherkin names grape and violet fat; MM-375 must supersede it with owner approval.
- P-2 (high, gap): MM-370's "no traffic-light colours" must be revised for fills.
- P-3 (medium, concern): ion equals protein in Martian; insight text in ion would read as protein.
- P-4 (low, gap): §1.3 is false for Martian; restate per palette.

## Unresolved owner decisions
1. Action colour: keep acid lime or move to a 90s orange.
2. Canvas: grape, or plum/aubergine.
3. Grade fills: distinct hues, or a single-hue lightness ramp (safer against "traffic light" and "judging" readings).

## Confidence
Medium. Visual reading of five renders; popular-press sources; no figures computed.

## Sources (accessed 2026-10-17)
- Teal, Wikipedia, https://en.wikipedia.org/wiki/Teal (edited 2026-10-05).
- Charlotte Hornets teal revolution, Dan Sfera, https://dansfera.com/hatbook/chapter/charlotte-hornets-teal-revolution (undated).
- The Shape of Fun, Fred/Alan, https://fredalan.org/post/810189020142387200/the-shape-of-fun (2026-03-04).
- The rise and fall (and return) of Memphis patterns, Envato, https://elements.envato.com/learn/memphis-patterns (2024-12-03).
- Why a once-hated 1980s design movement is making a comeback, Gizmodo, https://gizmodo.com/why-a-once-hated-1980s-design-movement-is-making-a-come-1602111413 (2014-07-10).
- The Nike Air Max 97 pays homage to iconic ACG colourway, Sneaker Freaker, https://www.sneakerfreaker.com/releases/the-nike-air-max-97-pays-homage-to-iconic-acg-colourway (2020-09-23).
- Lisa Frank, Wikipedia, https://en.wikipedia.org/wiki/Lisa_Frank (edited 2026-10-10).
