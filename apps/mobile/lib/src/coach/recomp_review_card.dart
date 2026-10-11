import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../format/recomp_review_text.dart';
import '../format/waist_amount.dart';
import '../providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/info_card.dart';
import '../ui/stat_row.dart';
import 'recomp_review_provider.dart';

/// The recomp review (MM-133), on the Coach screen for two weeks from 8
/// and 12 weeks on recomp and every 8 after: a verdict with what was seen,
/// or what is missing. It recommends and changes nothing; the goal is the
/// user's to change.
class RecompReviewCard extends ConsumerWidget {
  const RecompReviewCard({super.key});

  static String _direction(MeasuredChange? change) => switch (change) {
    MeasuredChange.down => 'Down',
    MeasuredChange.up => 'Up',
    MeasuredChange.noClearChange => 'No clear change',
    null => 'Not enough logged',
  };

  static String _lifts(List<String> names) =>
      names.map((name) => name.toLowerCase()).join(', ');

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final review = ref.watch(recompReviewProvider);
    final setup = ref.watch(setupProvider).value;
    if (review == null || setup == null) return const SizedBox.shrink();
    final fmt = Fmt(setup.unitSystem);
    final text = Theme.of(context).textTheme;
    final weight = review.weightChangeFraction;
    final waistCm = review.waistChangeCm;
    final strength = switch (review.strength) {
      MeasuredChange.up => 'Up: ${_lifts(review.liftsUp)}',
      MeasuredChange.down => 'Down: ${_lifts(review.liftsDown)}',
      MeasuredChange.noClearChange => 'Held',
      null => 'Not enough logged',
    };
    return InfoCard(
      key: const ValueKey('recomp-review'),
      title: 'Recomp review, week ${review.week}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            recompReviewText(review),
            key: const ValueKey('recomp-review-text'),
            style: text.bodyMedium,
          ),
          const SizedBox(height: 8),
          StatRow('Period', 'Last ${review.periodDays} days'),
          StatRow(
            'Trend weight',
            weight == null
                ? 'Not enough logged'
                : '${weight > 0 ? '+' : ''}'
                      '${(weight * 100).toStringAsFixed(1)}%',
          ),
          StatRow(
            'Waist',
            review.waist == MeasuredChange.noClearChange || waistCm == null
                ? _direction(review.waist)
                : '${_direction(review.waist)} ${waistAmount(waistCm, fmt)}',
          ),
          StatRow('Strength', strength),
          const SizedBox(height: 8),
          Text(
            'A tape and a scale cannot measure a pound of muscle. This is '
            'the direction of travel, not a measurement of it. Your goal '
            'stays as it is unless you change it.',
            style: text.bodySmall?.copyWith(color: context.mm.text2),
          ),
        ],
      ),
    );
  }
}
