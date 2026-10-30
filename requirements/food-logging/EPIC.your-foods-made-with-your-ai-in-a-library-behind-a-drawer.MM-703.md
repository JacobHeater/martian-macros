---
id: MM-703
status: in-progress
component: food-logging
related: [MM-44, MM-45, MM-153, MM-586, MM-599, MM-602, MM-616, MM-665, MM-682, MM-704, MM-705, MM-706, MM-707, MM-708, MM-709, MM-710]
---

# Epic: Your foods, made with your AI, kept in a Library, reached from a side drawer

## Context
The owner, 2026-10-30: "I'd be more inclined to lean on recording my own foods if the process was easier, but right
now it feels disconnected and cumbersome to create foods in the app. This arguably is the next big swing for the
application." Two things are wrong. Making a food means typing eight to twenty numbers by hand, and the label reader
(MM-44) helps only when there is a label: a biscuit on a plate has none. And managing foods happens inside the
add-food sheet's Saved step, which is for logging: "I might not really want to log a food, but just manage my foods and
create foods."

The owner's idea for the first: take AI meal analysis (MM-586) as the model. A photo of the biscuit goes to the
person's own frontier assistant with a prompt the app writes; the assistant works the food out and answers with JSON
in the app's own schema, macros and micros; the person pastes it back. "No one wants to type that out by hand, but
copying and pasting some JSON from the AI harness is trivial, takes a couple of minutes at most, and probably with
greater precision than hand-entering or guessing."

For the second, the owner first thought of a front door on the Food tab or a fifth tab, then, in the Q&A, concluded
"the nav bar is becoming a liability" and chose a proper menu: a side drawer with hardware-accelerated motion.

Everything below was settled with the owner in an eight-round interactive Q&A on 2026-10-30, before any ticket. It is
recorded here so nothing is re-asked.

## Decisions (the owner's, 2026-10-30)

**Making a food with the person's own AI (MM-708, MM-709, MM-710)**
- **Copy-paste only.** The app writes the prompt, the person works with their own assistant, the answer is pasted back.
  The app never calls a model for this, with or without the BYOK coach key (MM-665). (Offered and declined: the in-app
  path with the saved key, and both paths with copy-paste first.)
- **Photos are held only while they are sent**, through the share sheet, exactly as the meal flow does (MM-599). Nothing
  is stored. (Declined: photos only in the assistant; keeping the photo on the saved food.)
- **Before the prompt, the app asks**: the food's name, the brand or restaurant, what one serving is (optional; the
  assistant proposes one when blank), a barcode scan if the food has one (skippable), anything else for the assistant
  (MM-602's line), and whether it is **homemade**. A homemade food comes back with the assistant's list of what went into
  it, which the person corrects in the review; it is saved as **a single food**, not a recipe.
- **The JSON states numbers per 100 g, plus a serving description and its grams.** The app derives the per-serving
  numbers the saved food stores. (Declined: per serving only; the model declaring a basis.)
- **Every field in the schema is required**: calories, protein, carbohydrate, fat, fiber, and all fifteen of
  `Micronutrient` (sodium, potassium, calcium, iron, magnesium, zinc, vitamins A, C, D, B12, folate, total sugars,
  saturated fat, cholesterol), with sugar alcohols. (Declined: the grade's inputs only; calories and macros only.)
- **A food group from the fixed list (`FoodGroup`, MM-616) is required** in the JSON and editable in the review, so the
  coach's same-group swap can offer the person's own foods. The typed form gains the same chooser.
- **The evidence rule is the meal format's** (cited with a specific source, else matched in the app's packs by the plain
  name, else the assistant's unverified estimate; changed by the person, "yours"), **and it is stored on the saved
  food**, shown as its trust mark (MM-153) in the Library and in search.
- **An array of foods makes one saved food each**, ticked in the review. **Nothing is logged from this flow.**
- **A food with the name of one already saved** offers "Update it" or "Keep both" on its row. Updating never touches what
  was logged (MM-45).
- **The flow ends with Save**; the Library's Foods fold opens on the new foods with a notice that says how many were
  saved.
- **It is offered only from the Library's New food**, not from the add-food sheet. (Declined: on "nothing found"; on an
  unknown barcode.)

**Navigation: a side drawer; the bottom bar stays (MM-704, MM-705)**
- **A drawer slides in from the left**, on a transform that the compositor alone pays for, zeroed under reduced motion.
  **The bottom bar keeps Dashboard, Food, Train and Coach.** (Declined: the drawer replacing the bar; a "More" item on
  the bar; a full-screen menu page.)
- **Opened by a menu button at the left of the app bar. Closed by a tap on the scrim or by dragging it back.** No swipe
  from the left edge opens it: MM-582 keeps the edge swipes for the destinations and the pushed screens.
- **Its head is the Martian Macros lettering** (the owner's PNG, pasted on 2026-10-30; `design/brand/lettering-art.png`).
- **Its rows**: the four destinations, then Profile, Library, Settings. Profile, Library and Settings open as pushed
  screens over the current destination, with a back button, as Settings opens today. The settings gear leaves the app
  bar.
- **"Settings are settings, but profile is profile."** Profile takes the profile section (sex, date of birth, height,
  health check) **and nutrition goals** out of Settings. Everything else stays in Settings.

**The Library (MM-706, MM-707)**
- A pushed screen that opens straight into its sections, **each collapsed by default, in this order: Foods, Recipes,
  Meals, Usual foods, Exercises**, with **New food at the top** offering With my AI, Scan a label, Type it in and New
  recipe. (Declined: a profile card first; a search box first.)
- **Usual foods** are the foods the person logs often, from the log (MM-639's rule), each with "Save as a food", so a
  pack food logged every week becomes theirs to edit.
- **A row shows** the name, the serving, calories and macros, the trust mark, when it was last logged and how many
  times, and the grade letter. Rows are sorted by times logged; never logged sits at the end.
- **The add-food sheet's Saved step becomes a picker**: it keeps listing the person's foods and meals to log them, and
  ends with "Manage in Library". New food, edit and delete move to the Library. (Declined: unchanged; picker without a
  link.)

**Delivery**
- **Three PRs in parallel from `origin/main`, worktree-per-PR**: the drawer with the profile split (MM-704, MM-705), the
  Library with the Saved step (MM-706, MM-707), and AI food creation with its format and schema (MM-708, MM-709,
  MM-710). The agent manages them end to end: watches the checks, rebases, resolves conflicts, merges green PRs.
- The tickets land first in their own PR, so every sibling can refer to them.

## Choices made without asking (say if any is wrong)
- **The format is `martian-macros-food`, version 1**, in the same JSON-in-a-code-block envelope as the meal format, read
  the same forgiving way (chatter around the block ignored), with the same "Copy fixes for AI" loop.
- **Zero satisfies a required nutrient** the food lacks: the assistant writes 0, never leaves a field out.
- **Homemade ingredients are kept as text on the saved food** (a list of name and grams) and shown under "About this
  food" (MM-642); they are not recipe lines, and changing them later does not recompute anything.
- **A barcode scanned before the prompt is tied to the food when the answer holds one food**; with several, to none,
  and the review says so.
- **The drawer closes as a sheet closes**: Escape, and the phone's back (MM-232), close it before they leave a screen.
- **Label-read foods carry the evidence "label"** and typed or corrected ones "yours", so every saved food has a mark.
- **A fold's title carries its count** ("Foods · 12"), so a closed Library still says what it holds.
- **The Library row's menu** holds Edit and Delete (and Save as a food on a usual food), the sibling of the Saved step's
  menu today.
- **The Library remembers its folds and scroll across visits** within a session, as destinations do (MM-286); the owner
  chose a pushed screen and this costs nothing.

## Narrative
- MM-704: the drawer, its head, its rows, the menu button; the gear leaves.
- MM-705: Profile as its own screen; Settings without those sections; what opened Settings on them opens Profile.
- MM-706: the Library screen, its folds, rows, usage, New food's chooser.
- MM-707: the Saved step as a picker with "Manage in Library".
- MM-708: Make a food with my AI: the questions, the photos, the share or copy, the paste, the review, Save.
- MM-709: the food format, its reader, its checks, the evidence rule, the prompt and the fix message.
- MM-710: schema 32: a saved food's group, evidence and ingredients; the group chooser on the typed form; the trust
  mark on saved foods; the coach's same-group swap may offer a saved food with a group.

## Acceptance Criteria (narrative)
Done when the owner, on the phone, opens the drawer from the menu button, reaches the Library, presses New food, With my
AI, answers the questions, sends a photo of a biscuit to their assistant, pastes the answer, sees the biscuit with its
group, serving, every number and its evidence, corrects what is wrong, saves it, and finds it in the Foods fold with its
trust mark and, once logged, its count; when Profile holds who they are and their goals and Settings no longer does;
and when the Saved step on the add-food sheet still logs a saved food in two taps.

## Notes
- Not run locally; CI validates. The owner reads every screen on the phone before any of this is called done.
- Schema 32 is MM-710's and the only schema change among the three PRs (`apps/mobile/src/data/AGENTS.md`).
- The AI step (MM-708) is reached from the Library (MM-706), and the Library from the drawer (MM-704) and the Saved step
  (MM-707). Built in parallel, each PR wires what exists on `main` when it merges; the PR that lands later adds the
  missing row or route. Nothing is stubbed.
