import 'package:flutter/material.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../format/recomp_review_text.dart';
import '../format/waist_amount.dart';
import '../theme/mm_colors_context.dart';
import '../ui/stat_row.dart';

/// What a recomp review says and rests on (MM-133): the verdict in words,
/// the period, and what was seen of weight, waist and strength. The same on
/// the Coach screen and in the monthly report.
class RecompReviewBody extends StatelessWidget {
  const RecompReviewBody({required this.review, required this.fmt, super.key});

  final RecompReview review;
  final Fmt fmt;

  static String _direction(MeasuredChange? change) => switch (change) {
    MeasuredChange.down => 'Down',
    MeasuredChange.up => 'Up',
    MeasuredChange.noClearChange => 'No clear change',
    null => 'Not enough logged',
  };

  static String _lifts(List<String> names) =>
      names.map((name) => name.toLowerCase()).join(', ');

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final weight = review.weightChangeFraction;
    final waistCm = review.waistChangeCm;
    final strength = switch (review.strength) {
      MeasuredChange.up => 'Up: ${_lifts(review.liftsUp)}',
      MeasuredChange.down => 'Down: ${_lifts(review.liftsDown)}',
      MeasuredChange.noClearChange => 'Held',
      null => 'Not enough logged',
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          recompReviewText(review),
          key: const ValueKey('recomp-review-text'),
          style: text.bodyMedium,
        ),
        const SizedBox(height: 8),
        StatRow('Period', '${review.periodDays} days'),
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
    );
  }
}
