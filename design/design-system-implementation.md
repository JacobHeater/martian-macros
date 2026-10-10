# Design system implementation (Flutter)

Direction for implementation. Requirements and the roadmap decide **when**
(WS-03). The app is still small and styles inline; nothing here is shipped.

## Where it lives

MM-104 proposes a shared `packages/ui`. Until that package boundary is confirmed,
the theme can live in `apps/mobile/lib/src/theme/`. Keep it free of domain and
engine imports. Files:

```
theme/
  tokens.dart        // raw values: colors, spacing, radii, durations
  mm_theme.dart      // ThemeData for light and dark; ThemeExtension
  typography.dart    // text roles
  signature.dart     // HorizonArc, OrbitHairlines, LimbGlow painters
```

## No seed palette

Build both `ColorScheme`s explicitly. Do not call `fromSeed`. Map Material roles
to tokens so stock widgets (buttons, fields, switches, sheets) inherit the system:

```dart
const darkScheme = ColorScheme(
  brightness: Brightness.dark,
  primary: Tokens.emberDark,          // #FF6A45
  onPrimary: Tokens.onEmberDark,      // #1A0802
  primaryContainer: Tokens.selectedDark, // #1C2842 (NOT an Ember tint)
  onPrimaryContainer: Tokens.textDark,
  secondary: Tokens.ionDark,          // #3FD8F0
  onSecondary: Color(0xFF031A20),
  secondaryContainer: Tokens.selectedDark,
  onSecondaryContainer: Tokens.textDark,
  tertiary: Tokens.ionDark,
  onTertiary: Color(0xFF031A20),
  error: Tokens.dangerDark,
  onError: Color(0xFF2A0606),
  surface: Tokens.surfaceDark,        // #101624
  onSurface: Tokens.textDark,         // #ECF0F8
  onSurfaceVariant: Tokens.text2Dark, // #A9B4CA
  outline: Tokens.outlineStrongDark,  // #5A6A8C
  outlineVariant: Tokens.outlineDark, // #2B3853
  surfaceContainerLowest: Tokens.canvasDark,
  surfaceContainerLow: Tokens.surfaceDark,
  surfaceContainer: Tokens.surfaceDark,
  surfaceContainerHigh: Tokens.raisedDark,
  surfaceContainerHighest: Tokens.overlayDark,
  // …scrim, shadow, inverse*, surfaceTint: Colors.transparent
);
```

Set `surfaceTint: Colors.transparent` (and Material 3's tint overlay off) in both
schemes: M3 elevation tint is another source of muddy color. Do the same for the
light scheme with its tokens. Set `scaffoldBackgroundColor` to `canvas`.

## App-specific tokens

A `ThemeExtension<MmColors>` for everything Material has no slot for, with
`lerp` implemented: `protein`, `carbs`, `fat`, `energy`, `trend`, `trendBand`,
`reading`, `positive`, `caution`, `info`, `danger`, `track`, `selected`,
`sunken`, `raised`, `overlay`, `limbGlow`. Access through one
extension: `context.mm.protein`. Screens never call `Theme.of(context).colorScheme`
for meaning.

Note `secondary` and `tertiary` both map to Ion above so a stray stock widget
never produces an off-palette color. Treat that as a guard rail, not a license to
use them in screens.

## Component theming

Set these once in `ThemeData` rather than per widget:

- `NavigationBarThemeData`: height 72, `raised` background, no surface tint,
  indicator `selected` 56 × 32 full-round, selected icon/label `ember`, unselected
  `text2`, labels always shown, label `label` role.
- `FloatingActionButtonThemeData`: `ember` background, `onEmber` foreground,
  `extendedPadding` 20, 16 radius, zero elevation in every interaction state
  and no decorative shadow wrapper in either theme (MM-181).
- `FilledButtonThemeData`: 48 dp min height, 12 radius, `ember`/`onEmber`.
  `OutlinedButton`: `outlineStrong` border, `text` label. `TextButton`: `ember`.
- `InputDecorationTheme`: filled `sunken`, 12 radius, `outlineStrong` 1 dp border,
  focused 2 dp `text` border (not Ember: focus is not an action).
- `CardThemeData`: `surface`, 16 radius, light 1 dp `outline` + soft shadow, dark
  no shadow and a 1 dp top highlight via a decoration.
- `ChipThemeData`, `SegmentedButtonThemeData`, `SwitchThemeData` (Ember thumb
  track when on), `DividerThemeData` (`outline`, 1 dp), `BottomSheetThemeData`
  (`raised`, 24 top radius, drag handle), `SnackBarThemeData` (`overlay`).
- `PageTransitionsTheme`: default platform transitions.

## Fonts

Bundle Space Grotesk and Inter (OFL) as app assets and declare them in
`pubspec.yaml`; **do not** use the `google_fonts` package, which fetches over the
network and contradicts the offline-only rule. Verify the licenses in `NOTICE`
handling (MM-109/store). Figures use `FontFeature.tabularFigures()`.
Expose roles as `TextTheme` overrides plus an `MmText` extension (`figureXL`,
`figure`, `title`, `heading`, `body`, `label`, `caption`); screens use
`context.text.figure`, never a raw `TextStyle(fontSize: …)`.

Respect `MediaQuery.textScaler`; test at 200%.

## Shared components (build order)

1. `MmSurface` (groups: canvas/surface/raised, hairline, radius)
2. `FigureWithUnit`, `MacroBar` (label, value, bar; protein emphasis), `StatRow`
3. `HorizonArc` (CustomPainter; `value`, `target`, `over`, semantics label)
4. `Notice.info/caution/required` (no fills)
5. `EntryRow`, `MealGroup`, `StatusRow`
6. `SectionLabel`, `ChoiceCard`
7. `AddSheet`, `EmptyState`, `ErrorState`, `SkeletonBlock`
8. `TrendChart` wrapper over `fl_chart` (already a dependency) with the grammar
9. `OrbitHairlines`, `LimbGlow`, `Starfield` (seeded, static)

Components take **meaning** (`NoticeKind.caution`, `Macro.protein`), not colors,
radii or padding. Prefer assembling from these over generic configurable widgets.

### Painting notes

- `HorizonArc`: draw the track and fill as a stroked path along a circular arc
  (`Path.arcTo`) using round caps; compute the progress point from
  `PathMetric.getTangentForOffset`; paint the body dot there. Animate `value`
  with an `AnimationController`/`TweenAnimationBuilder` in `slow`; run the
  `reveal` fill only once per cold start (provider flag). Wrap in `Semantics`
  with a label like "1,420 of 2,480 calories eaten, 1,060 left". Exclude the
  painter itself from the semantics tree so it is not read twice.
- `LimbGlow`: a `RadialGradient` `DecoratedBox` clipped to the card, alpha from the
  token. `OrbitHairlines`: a `CustomPainter` of three arcs; pass `isDark` from the
  theme.
- The primary FAB is flat; do not add a glow or shadow wrapper (MM-181).

## Spacing, radii, durations

Constants, not magic numbers: `Gap.s4…s32` as `SizedBox`es, `MmSpace`, `MmRadius`
(16, 12, 8, full), `MmMotion.fast/base/slow/reveal`. A lint or review rule flags
any padding or radius outside the scale in a screen file (MM-103).

## Accessibility implementation

- Compute contrast in a test over every token pair per theme and fail under the
  thresholds in the color doc (text 4.5, graphics 3). Keep the token list
  machine-readable (`design-map.json`) so the test and the doc cannot drift.
- `Semantics` on every chart and on the arc; chart caption = semantic summary.
- Min tap target 48 dp: use `MaterialTapTargetSize.padded` (default) and test it.
- Reduce motion: wrap animation durations in a helper that returns `Duration.zero`
  when `MediaQuery.disableAnimations`.
- Focus ring: 2 dp `text`, via `FocusTheme`/`ButtonStyle.side` with `states`.
- Color-blind check: render the gallery through a CVD filter in a golden or by
  inspection; macro rows must still read via label and lightness.

## Verification expectations

- **Component gallery (MM-105):** every component in light and dark, plus a
  "palette sheet" of tokens with their contrast numbers. This is where MM-102's
  rendered review happens.
- Golden tests on one platform (Linux CI, per MM-105) for the gallery and the
  Today screen with fixed data, in both themes, at 100% and 200% text.
- Widget tests for behavior: preselected meal from "+", Undo on delete, notice
  kinds, arc semantics, hide-weight on charts.
- Manual: TalkBack and VoiceOver pass on Today and the add sheet before release.

## Migration plan (sketch, subject to WS-03)

1. Land tokens, `ThemeData` and fonts. Delete `colorSchemeSeed`. Existing screens
   instantly lose the muddy palette without layout change.
2. Land the component set and migrate Today, then Coach, Progress, Onboarding,
   Settings. Delete private card/notice twins as each migrates.
3. Add the signature painters and motion after the screens read well in plain
   flat form: the system must look good before the arc is added.
