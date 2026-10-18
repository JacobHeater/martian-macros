# Product: copy cruft across the app (audit, 6646354)

Method: source inspection, no render. Confidence high on PR-1 to PR-6, medium on the rest.

- **PR-1 (must-fix, remove)** `food/FoodScreen.tsx:73` "Nothing logged yet. Start with breakfast.": narrates the empty meals and the zero hero; repeats what Add food and "+" invite. Copy yesterday stays.
- **PR-2 (must-fix, remove)** `train/TrainScreen.tsx:83` "Log your training here, set by set. …": a "here you can" intro over Start workout.
- **PR-3 (must-fix, remove)** `train/WorkoutScreen.tsx:94` "Add the first exercise. …": narrates Add exercise beneath.
- **PR-4 (must-fix, rewrite)** `coach/CoachScreen.tsx:121` "Log a weigh-in to get started." → "The coach starts from your first weigh-in."
- **PR-5 (should-fix, rewrite)** `progress/ProgressScreen.tsx:94` → "No trend yet."
- **PR-6 (should-fix)** `food/FoodCompletenessRow.tsx` "… Press to change.": narrates the chevron.
- **PR-7 (should-fix, remove)** `food/AddFoodSheet.tsx:466` "Enter calories and macros for this food.": restates the field labels.
- **PR-8 (should-fix)** `settings/SettingsScreen.tsx:208` "Encrypted backup is coming.": a roadmap promise in Settings.
- **PR-9 (should-fix)** `app/ThemeChooserScreen.tsx` "Make it your planet." over a second headline; "A little color preview".
- **PR-10 (should-fix, remove)** Coach "Next check-in" row repeating the hero's status.
- **PR-11 (should-fix, remove)** Dashboard "Training" subtitle under "N workouts this week".
- **PR-12 (should-fix)** "It is stored on this phone…" on every pack card: say once.
- **PR-13 (accuracy)** the food database described as for barcode scanning only; it is for search too.
- **PR-14 (keep, trim)** recent insights' "Each is listed here for 14 days" repeats the summary.
- Kept on purpose: SetTimerBar's "Tap Add set when the set is done.", the split ring's empty line, trend and safety lines, failed-read notices, the welcome tagline.
- Directions prescribing filler: `screen-direction.md` lines 98, 102-104, 335-336.
