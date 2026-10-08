---
id: MM-35
status: proposed
component: adaptive-coach
related: [MM-22, MM-18, MM-23, MM-26, MM-34]
---

# Spike: One model for weight, water, fat, lean mass and expenditure

## Context
Today the engine works in two steps: a filter over weight (level, slope, water; MM-18), then a windowed energy balance on its output
(MM-23). Planning described a single state-space model instead, tracking fat mass, fat-free mass, glycogen-bound water, expenditure and a
bias per scale, updated by every kind of measurement at once. The two-step version was built first because it could be tested sooner.

## Description
Decide whether the joint model is worth building, by answering:
1. **Does it estimate expenditure better?** Run both against the simulator, including a truth model whose partition differs from the
   engine's assumption (MM-30), and compare bias, spread and honesty of uncertainty.
2. **Can carbohydrate intake predict water?** Glycogen binds three to four grams of water per gram. If recent carbohydrate intake explains
   a useful share of the water state, the trend sharpens. Needs real logs to judge.
3. **Is it identifiable?** With only weight and intake observed, can fat and lean be separated at all, or does the model just return its
   prior? What do waist and body-fat readings add?
4. **What does it cost** in code, in test difficulty, and in explaining a number to a user?

## Acceptance Criteria
```gherkin
Scenario: A recommendation
  Then this ticket records whether to build the joint model, keep the two-step model, or extend the two-step model with a glycogen term
  And the simulator results the recommendation rests on

Scenario: The honest case
  Given the joint model is no better on the simulator
  Then the recommendation is not to build it
```

## Notes
- MM-34 needs *some* model for body fat. If the answer here is "keep two steps", MM-34 still needs a small filter of its own.
- The step-limit and floors apply to whatever model produces the estimate; they are not in question.
