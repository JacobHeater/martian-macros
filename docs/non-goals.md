# What Martian Macros will not do

Each line closes a door on purpose. A ticket that proposes one of these is not
accepted unless it cites the line's **reopen if** condition and shows that it
has been met. The detail is in the tickets named on each line;
[MM-144](../requirements/coach-insights/TASK.non-goals.MM-144.md) holds the
list itself.

Some of it is enforced, not just written down: the banned-word test
(`apps/mobile/test/voice_test.dart`, MM-108) fails on language this document
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

### No food scoring, grading, or "clean" and "junk" labels

- **Why:** Moral labels on food are associated with disordered eating and
  contradict the app's rule that it states and does not judge.
- **Detail:** MM-108
- **Reopen if:** Never.

### No micronutrient targets

- **Why:** For now the data is too patchy to be right.
- **Detail:** MM-49
- **Reopen if:** The food sources' coverage is measured and found adequate.

### No calorie or macro estimation from a meal photo

- **Why:** Portion size from a photo has a large and unvalidated error, and
  the app's estimates are only as good as the intake it is given.
- **Detail:** MM-44
- **Reopen if:** An on-device method's error is measured and acceptable.

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

### No cardio prescriptions and no "burn it off"

- **Why:** "Burning off" food moralizes eating and encourages compensation.
  The only activity suggestion anywhere is more daily walking, as one option
  in a stall.
- **Detail:** MM-140
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

### No engagement notifications

- **Why:** Nothing is sent to bring the user back for its own sake.
- **Detail:** MM-146
- **Reopen if:** The product owner decides otherwise, in a ticket that says
  what changed.
