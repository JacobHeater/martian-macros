# What Martian Macros will not do

Each line closes a door on purpose. A ticket that proposes one of these is not
accepted unless it cites the line's **reopen if** condition and shows that it
has been met. The detail is in the tickets named on each line;
[MM-144](../requirements/coach-insights/TASK.non-goals.MM-144.md) holds the
list itself.

Some of it is enforced, not just written down: the banned-word test
(`apps/mobile/test/voice.test.ts`, MM-108) fails on language this document
rules out, and the forbidden insight subjects are tested with MM-141.

The fixed product constraint that the app models biological sex as male or
female and nothing else (MM-14) is a decision already recorded, not a non-goal
to be argued here.

**Whose judgement.** Where a reason says *(panel)*, it is the review panel's
position, not something the product owner has decided. The product owner
should read this list as closely as any feature.

## Energy and targets

### No "exercise calories" added to the daily target

- **Why:** Wearable and machine estimates of exercise energy are too
  inaccurate, and "eating back" double-counts activity the expenditure
  estimate already contains.
- **Detail:** MM-23
- **Reopen if:** Never; it contradicts the engine's design.

### No automatic compensation for an over or under day

- **Why:** It trains a restrict-after-overeating cycle.
- **Detail:** MM-124
- **Reopen if:** The product owner decides otherwise, in a ticket that says
  what changed.

### No aggressive pace, protein-sparing modified fast, or very-low-calorie mode

- **Why:** They need medical supervision.
- **Detail:** MM-128
- **Reopen if:** Supervision is part of the product, which it is not.

### No reverse dieting as a metabolic strategy

- **Why:** No evidence of benefit.
- **Detail:** MM-130
- **Reopen if:** Trial evidence of benefit appears.

### No "metabolic damage", "starvation mode" or "toning" language anywhere

- **Why:** Adaptive reduction in expenditure is real, modest and described as
  such; these phrases overstate it or mean nothing. The banned-word test
  enforces it.
- **Detail:** MM-108
- **Reopen if:** Never.

### No contest-preparation or peak-week features

- **Why:** Water, sodium and carbohydrate manipulation for a show or a
  weigh-in is not safe to automate and needs supervision. *(panel)*
- **Reopen if:** Supervision is part of the product, which it is not.

### No weight-cut tools for weight-class sports

- **Why:** Rapid weight cutting is not safe to offer an unsupervised user.
  *(panel)*
- **Reopen if:** Supervision is part of the product, which it is not.

## Food and nutrition

### No meal plans and no prescribed foods

- **Why:** The app sets numbers and the user chooses food. Meal plans are
  low-adherence and stray into dietetic practice. *(panel)*
- **Reopen if:** A registered dietitian is part of the product.
- **Overruled in part by the product owner (2026-10-24, MM-607, MM-608):**
  the coach's analysis may offer a single food as a trade for one the person
  logs, at about the same calories. It offers foods the person logs first, and
  a catalog food of the same group after. Meal plans, prescribed menus or
  portions, and any food offered other than as a trade stay non-goals.

### No fasting windows, meal-frequency rules or nutrient-timing requirements

- **Why:** Evidence for an effect on body composition beyond total intake is
  weak. Users may eat on any schedule and the app is indifferent. *(panel)*
- **Detail:** MM-125
- **Reopen if:** Trial evidence of an effect beyond total intake appears.

### No supplement recommendations, including creatine and protein powder

- **Why:** Recommending products is outside a coaching app's remit. The app
  asks about creatine only because it moves the scale. *(panel)*
- **Detail:** MM-136
- **Reopen if:** A registered dietitian reviews supplement guidance.

### ~~No food scoring or grading~~ (overruled), and no "clean" and "junk" labels

- **Why:** Moral labels on food are associated with disordered eating and
  contradict the app's rule that it states and does not judge.
- **Detail:** MM-108
- **Grading overruled by the product owner on 2026-10-17** (MM-370, MM-371): every
  food is graded A+ to D- on the app's own nutrient-density measure (MM-380,
  which replaced the published tables MM-369 had chosen), never a moral word. "Clean" and "junk" labels, meal plans and
  prescribed foods stay out, and MM-108's banned words stay banned.
- **Reopen if:** Never, for the labels.

### ~~No micronutrient targets~~ (overruled)

- **Overruled by the product owner on 2026-10-14** (MM-306), without the
  coverage measurement: the app now tracks minerals and key vitamins, shows
  each against a reference amount, and lets the user set a sodium limit
  (MM-305). The concern below is carried into the design instead: every
  total says how much of the day it covers, and a missing value is never
  counted as zero (MM-310).
- **Why it was a non-goal:** For now the data is too patchy to be right.
- **Detail:** MM-49, MM-305, MM-306
- **Was to reopen if:** The food sources' coverage is measured and found
  adequate. The first pack built with MM-307 measures it.

### No calorie or macro estimation from a meal photo by the app

- **Why:** Portion size from a photo has a large and unvalidated error, and
  the app's estimates are only as good as the intake it is given.
- **Detail:** MM-44
- **Reopen if:** An on-device method's error is measured and acceptable.
- **Amended by the product owner (2026-10-22, MM-586):** the person may
  analyse a meal with their own AI assistant, outside the app, and paste its
  answer back. The app still estimates nothing from a photo and never sees
  one; every imported number says where it came from and is reviewed before
  it is logged.

## Body and measurement

### No body-fat percentage from a photo, a smart scale reading taken at face value, or any single measurement

- **Why:** Such methods are off by several points and vary day to day; the app
  treats body fat as an estimate with a range. *(panel)*
- **Detail:** MM-34, MM-132
- **Reopen if:** A method's error is measured and small enough to act on.

### No "ideal weight", "ideal body" or "goal physique" imagery, and no comparison with other users

- **Why:** Comparison against an ideal or against other people is a known harm
  in this area, and the product is about the user's own trend. *(panel)*
- **Reopen if:** Never.

### No body-fat or muscle figures stated more precisely than they are known

- **Why:** A line such as "you gained 0.9 kg of muscle" is false precision.
- **Detail:** MM-133
- **Reopen if:** The quantity is measured, not estimated.

### No BMI as a headline number

- **Why:** BMI is a poor measure of fatness in muscular people. It is used
  internally for the underweight guard and the protein reference weight only.
- **Detail:** MM-111, MM-120
- **Reopen if:** Never as a headline; its internal uses are as ticketed.

## Training

### No training programs, periodization, deload scheduling or exercise prescription

- **Why:** The app logs, tracks strength and volume, and suggests the next
  set. Programming is a coach's job and carries injury risk.
- **Detail:** MM-79
- **Reopen if:** A qualified coach is part of the product.

### No "burn it off"

- **Why:** "Burning off" food moralizes eating and encourages compensation.
  Cardio and steps are a standing part of a fat-loss or recomp program (the
  owner, 2026-10-28: MM-677, MM-678), held to floors and ordered by the coach;
  they are never said as making up for food, and no calories are worked out
  from them (MM-23). The earlier "no cardio prescriptions" (MM-140) was
  reopened by the owner on 2026-10-28.
- **Detail:** MM-140, MM-677, MM-678
- **Reopen if:** Never as "burn it off".

## Health

### No diagnosis, no condition named to a user, no interpretation of lab values, no medication advice

- **Why:** These are a clinician's job and carry liability the app cannot
  carry. The app says to talk to a clinician and does not say what a condition
  is or what to do about it.
- **Detail:** MM-96, MM-113
- **Reopen if:** A clinician-reviewed pathway is part of the product.

### No hormone, thyroid, cortisol or "adrenal" explanations for progress

- **Why:** Such explanations for a plateau are speculation the app cannot
  check, and they send users to unproven fixes. *(panel)*
- **Reopen if:** Never as an explanation the app gives itself.

## Product

### No social feed, leaderboards, challenges or public sharing of weight

- **Why:** Body weight is sensitive health data, the product is offline-only
  with no accounts, and comparison between users is a known harm.
- **Detail:** MM-74
- **Reopen if:** The offline-only constraint is lifted by the product owner.

### No streaks or rewards tied to weight, deficit or under-eating

- **Why:** Rewarding a lower number or a bigger deficit rewards compulsion and
  restriction.
- **Detail:** MM-92
- **Reopen if:** Never for weight, deficit or under-eating.

### No AI-generated advice at run time

- **Why:** Every sentence the coach says is a reviewed rule; generated text
  cannot be reviewed in advance.
- **Detail:** MM-141
- **Reopen if:** Generated text can be bounded to reviewed content.
- **Amended by the product owner (2026-10-27, MM-664, MM-665):** the coaching
  numbers, targets, swaps and runway invariants remain 100% deterministic, and
  the app ships with offline whole-situation paragraph archetypes. A person who
  wants natural-language phrasing may optionally enter their own API key
  (Gemini, OpenAI or Anthropic) in Settings; the model phrases only the
  deterministic brief it is given, its answer is checked against the brief's
  numbers, banned words and safety invariants (`verifyCoachNarration`), and any
  failed check or offline state falls back immediately to the deterministic
  archetype.

### No engagement notifications

- **Why:** Nothing is sent to bring the user back for its own sake.
- **Detail:** MM-146
- **Reopen if:** The product owner decides otherwise, in a ticket that says
  what changed.
