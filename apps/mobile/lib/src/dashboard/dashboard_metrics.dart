import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../app/home_destination.dart';
import '../app/home_tab_provider.dart';
import '../charts/history_chart.dart';
import '../charts/history_series.dart';
import '../charts/history_series_kind.dart';
import '../charts/trend_chart.dart';
import '../coach/recovery_card.dart';
import '../format/coach_confidence_text.dart';
import '../format/fmt.dart';
import '../providers.dart';
import '../ui/info_card.dart';
import '../ui/metric_facts.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';
import 'dashboard_history.dart';
import 'dashboard_range_provider.dart';

class DashboardMetrics extends ConsumerWidget {
  const DashboardMetrics({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final setup = ref.watch(setupProvider).value;
    if (setup == null) return const SizedBox.shrink();
    final today = ref.watch(todayProvider);
    final days = ref.watch(dashboardRangeProvider);
    final intake = ref.watch(intakeDaysProvider);
    final weights = ref.watch(weightsProvider);
    final waist = ref.watch(waistProvider);
    final history = ref.watch(targetsHistoryProvider);
    final pauses = ref.watch(pausesProvider);
    final recovery = ref.watch(recoveryCheckInsProvider);
    final sources = [intake, weights, waist, history, pauses, recovery];
    if (sources.any((source) => source.hasError)) {
      return const Notice(
        kind: NoticeKind.caution,
        text: 'Dashboard history could not be loaded. Reopen the app to retry.',
      );
    }
    if (sources.any((source) => source.isLoading)) {
      return const InfoCard(
        title: 'Your history',
        child: Text('Loading your recorded metrics…'),
      );
    }
    final snapshot = ref.watch(coachProvider);
    final allowed =
        snapshot?.policy.targetsAllowed ??
        CoachingPolicy.derive(
          profile: setup.profile,
          screening: setup.screening,
          today: today,
        ).targetsAllowed;
    final facts = DashboardHistory(
      today: today,
      days: days,
      intake: intake.value!,
      history: history.value!,
      pauses: pauses.value!,
      weights: weights.value!,
      onboardedOn: setup.onboardedOn,
      targetsAllowed: allowed,
    );
    final fmt = Fmt(setup.unitSystem);
    final waists = waist.value!
        .where((w) => !w.date.isBefore(facts.start) && !w.date.isAfter(today))
        .toList();
    final estimates = {
      for (final record in history.value!)
        if (record.tdeeStatus == TdeeStatus.updated)
          record.effectiveFrom: record.tdeeKcal,
    };
    void open(HomeDestination tab) =>
        ref.read(homeTabProvider.notifier).select(tab);
    Widget detail(String label, HomeDestination tab) => MmButton(
      label: label,
      kind: MmButtonKind.text,
      onPressed: () => open(tab),
    );
    Widget chart(List<HistorySeries> series, String unit) =>
        HistoryChart(series: series, today: today, days: days, unit: unit);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        if (facts.calories.isEmpty)
          const Text('Log food to populate your intake history.'),
        Wrap(
          spacing: 12,
          runSpacing: 8,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text('Your metrics', style: Theme.of(context).textTheme.titleLarge),
            MmSegmented<int>(
              compact: true,
              segments: const [
                MmSegment(7, '7 days'),
                MmSegment(30, '30 days'),
              ],
              selected: {days},
              onChanged: (selection) => ref
                  .read(dashboardRangeProvider.notifier)
                  .select(selection.single),
            ),
          ],
        ),
        const SizedBox(height: 12),
        InfoCard(
          title: 'Nutrition history',
          trailing: detail('Food details', HomeDestination.food),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MetricFacts(
                facts: {
                  'Average logged intake': facts.meanCalories == null
                      ? 'Not recorded'
                      : Fmt.kcal(facts.meanCalories!),
                  'Days with intake records':
                      '${facts.calories.length} / $days',
                },
              ),
              const SizedBox(height: 16),
              chart([
                HistorySeries(
                  label: 'Logged intake',
                  values: facts.calories,
                  kind: HistorySeriesKind.energy,
                ),
                HistorySeries(
                  label: 'Target in force',
                  values: facts.calorieTargets,
                  kind: HistorySeriesKind.target,
                  dashed: true,
                ),
              ], 'kcal'),
              const SizedBox(height: 8),
              const Text(
                'Missing logs are gaps, not zero intake. Averages use recorded '
                'days, including today’s unfinished log.',
              ),
              if (pauses.value!.any(
                (p) => !p.to.isBefore(facts.start) && !p.from.isAfter(today),
              ))
                const Text(
                  'Paused days remain visible as observations; targets and '
                  'coverage counts exclude them.',
                ),
            ],
          ),
        ),
        InfoCard(
          title: 'Protein history',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MetricFacts(
                facts: {
                  'Average logged protein': facts.meanProtein == null
                      ? 'Not recorded'
                      : Fmt.grams(facts.meanProtein!),
                  'Recorded days used': '${facts.protein.length}',
                },
              ),
              const SizedBox(height: 16),
              chart([
                HistorySeries(
                  label: 'Logged protein',
                  values: facts.protein,
                  kind: HistorySeriesKind.protein,
                ),
                HistorySeries(
                  label: 'Minimum / target',
                  values: facts.proteinTargets,
                  kind: HistorySeriesKind.target,
                  dashed: true,
                ),
              ], 'g'),
              if (facts.protein.isEmpty)
                const Text(
                  'Log protein-containing food to populate this history.',
                ),
            ],
          ),
        ),
        InfoCard(
          title: 'Weight trend & uncertainty',
          trailing: detail('Progress', HomeDestination.progress),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 190,
                child: Semantics(
                  image: true,
                  label:
                      'Weight trend in ${fmt.weightUnit}, $days days, '
                      'with observations and uncertainty band.',
                  child: TrendChart(
                    trend: snapshot?.trend ?? const [],
                    weights: weights.value!,
                    today: today,
                    rangeDays: days,
                    fmt: fmt,
                  ),
                ),
              ),
              Text(
                '${fmt.weightUnit} · Dots are measurements; the line is the '
                'estimated trend. The band shows uncertainty.',
              ),
            ],
          ),
        ),
        InfoCard(
          title: 'Waist history',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MetricFacts(
                facts: {
                  'Latest in range': waists.isEmpty
                      ? 'Not recorded'
                      : fmt.length(waists.last.waistCm),
                  'Measurements': '${waists.length}',
                },
              ),
              const SizedBox(height: 16),
              chart([
                HistorySeries(
                  label: 'Recorded waist',
                  values: {
                    for (final w in waists) w.date: fmt.lengthFromCm(w.waistCm),
                  },
                  kind: HistorySeriesKind.measurement,
                  connectRecordedPoints: true,
                ),
              ], fmt.lengthUnit),
              if (waists.isEmpty)
                const Text(
                  'Add waist measurements in Progress to see history.',
                ),
            ],
          ),
        ),
        InfoCard(
          title: 'Logging coverage',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MetricFacts(
                facts: {
                  'Food days recorded':
                      '${facts.loggedDays} / ${facts.activeDays}',
                  'Days marked complete':
                      '${facts.completeDays} / ${facts.activeDays}',
                  'Weigh-in days': '${facts.weighInDays} / ${facts.activeDays}',
                  'Window': '$days days',
                },
              ),
              const SizedBox(height: 8),
              const Text(
                'Counts describe available records, not a score. Paused days '
                'and days before onboarding are excluded.',
              ),
            ],
          ),
        ),
        InfoCard(
          title: 'Coach & expenditure',
          trailing: detail('Coach details', HomeDestination.coach),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (snapshot == null || !allowed)
                const Text('No coaching estimate available.')
              else ...[
                MetricFacts(
                  facts: {
                    'Coach confidence': confidenceLabel(
                      snapshot.confidence.level,
                    ),
                    snapshot.tdee.status == TdeeStatus.updated
                            ? 'Measured expenditure range'
                            : 'Starting / held estimate range':
                        '${Fmt.whole(snapshot.tdee.kcal - snapshot.tdee.sigmaKcal)}–'
                        '${Fmt.whole(snapshot.tdee.kcal + snapshot.tdee.sigmaKcal)} kcal',
                    'Food log evidence': confidenceLabel(
                      snapshot.confidence.foodLog,
                    ),
                    'Weight evidence': confidenceLabel(
                      snapshot.confidence.weighIns,
                    ),
                  },
                ),
                const SizedBox(height: 12),
                Text(confidenceNextStepText(snapshot.confidence)),
                const SizedBox(height: 16),
                chart([
                  HistorySeries(
                    label: 'Measured estimates at check-ins',
                    values: estimates,
                    kind: HistorySeriesKind.estimate,
                    connectRecordedPoints: true,
                  ),
                ], 'kcal/day'),
                const Text(
                  'Check-in estimates are not daily expenditure measurements.',
                ),
              ],
            ],
          ),
        ),
        const RecoveryCard(),
        if (recovery.value!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Text(
              'Recovery observations: '
              '${Fmt.shortDay(recovery.value![recovery.value!.length > 8 ? recovery.value!.length - 8 : 0].date)}'
              '–${Fmt.shortDay(recovery.value!.last.date)}. '
              'Each line is a separate answer, not a combined score.',
            ),
          ),
      ],
    );
  }
}
