---
id: MM-667
title: Unified Coach and Progress tab with Executive Summary card and collapsible telemetry
kind: story
component: coach-insights
status: done
priority: P1
created: 2026-10-27
updated: 2026-10-27
---

# Unified Coach and Progress tab with Executive Summary card and collapsible telemetry

## Statement

Consolidate the bottom navigation bar from five destinations (`Dashboard`, `Food`, `Train`, `Progress`, `Coach`) into four (`Dashboard`, `Food`, `Train`, `Coach`), merging the `Progress` screen's weight trend chart, weigh-in entry, body measurements, sleep, weight events, period days, strength trends, and progress photos into the unified `Coach` screen.

Add a top-level **Executive summary** section (`ExecutiveSummaryCard`) powered by `ExecutiveBrief` and `CoachNarrator` (Track 1 deterministic archetype with optional Track 2 BYOK LLM narration), highlighting 7-day calorie adherence, 7-day protein floor hits, and today's remaining runway. Retire the 14-day `Recent insights` history feed on the `Coach` screen, and make background engine telemetry sections (`Your metabolism`, `Coach confidence`, `Body`) collapsible at the bottom of the screen.

## Acceptance criteria

- The bottom navigation bar (`destinations.ts`) has four destinations: `Dashboard`, `Food`, `Train`, and `Coach`.
- The unified `Coach` screen renders the `Executive summary` card (`ExecutiveSummaryCard`), the weight trend chart with its `30d | 90d` selector and uncertainty band, today's weigh-in entry, and the body/progress sections (`Weight events`, `Period days`, `Sleep`, `Waist`, `More measurements`, `Recomp signal`, `Strength trends`, `Progress photos`).
- The 14-day `Recent insights` feed (`RecentInsightsSection`) is removed from the `Coach` screen.
- The background engine telemetry sections (`Your metabolism`, `Coach confidence`, `Body`) sit at the bottom of the `Coach` screen and are collapsible (`collapsible` with persistent fold state).

## Verification

Automated test (`apps/mobile/test/coach/unifiedCoachTab.test.tsx`).
