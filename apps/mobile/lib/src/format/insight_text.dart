import 'package:mm_engine/mm_engine.dart';

import 'fmt.dart';
import 'stall_text.dart';

/// The fixed words of each insight rule (MM-141), filled from the insight's
/// own figures: a title, what was observed, and the evidence as label and
/// value pairs. Nothing is generated; nothing praises eating less, calls food
/// or the user a moral name, compares with other people or predicts a date.
(String title, String body, List<(String, String)> evidence) insightText(
  Insight i,
  Fmt fmt,
) {
  int n(String key) => (i.figures[key] ?? 0).round();
  final period = ('Period', 'Last ${i.basisDays} days');
  switch (i.rule) {
    case InsightRule.partialDays:
      return (
        'Many days are partly logged',
        'Of the last ${n('loggedDays')} days you logged, ${n('partialDays')} '
            'were partial. Partial days are left out of the estimate, so the '
            'coach is working from fewer days than it looks.',
        [
          period,
          ('Days logged', '${n('loggedDays')}'),
          ('Partial days', '${n('partialDays')}'),
        ],
      );
    case InsightRule.estimatesRising:
      final share = ((i.figures['estimatedShare'] ?? 0) * 100).round();
      return (
        'Most of your calories are estimates',
        'About $share% of your calories over the last two weeks came from '
            'estimated meals. Estimates are fine now and then; the coach '
            'learns faster from days that are mostly measured.',
        [
          period,
          ('Fully logged days', '${n('wholeDays')}'),
          ('Calories from estimates', '$share%'),
        ],
      );
    case InsightRule.weighInTiming:
      return (
        'Weigh-ins have been sparse',
        'You weighed in ${n('weighIns')} ${n('weighIns') == 1 ? 'time' : 'times'} '
            'in the last two weeks. With four or more a week the coach can '
            'tell a real change from water sooner.',
        [period, ('Weigh-ins', '${n('weighIns')}')],
      );
    case InsightRule.proteinShort:
      return (
        'Protein has been under your minimum',
        'You met your protein minimum on ${n('metDays')} of ${n('wholeDays')} '
            'fully logged days. On the other days you were about '
            '${n('averageShortfallG')} g short on average.',
        [
          period,
          ('Fully logged days', '${n('wholeDays')}'),
          ('Days at or above the minimum', '${n('metDays')}'),
          ('Average shortfall', '${n('averageShortfallG')} g'),
        ],
      );
    case InsightRule.stall:
      final stall = i.stall!;
      final (body, options) = stallText(stall, fmt);
      final slope = stall.slopeKgPerWeek;
      final intended = stall.intendedKgPerWeek;
      return (
        'Progress has slowed',
        options.isEmpty ? body : '$body Options: ${options.join('; ')}.',
        [
          period,
          ('Fully logged days', '${stall.usableFoodDays}'),
          ('Weigh-ins', '${stall.weighIns}'),
          if (slope != null) ('Trend', '${fmt.weightDelta(slope)} a week'),
          if (intended != null)
            ('Intended', '${fmt.weightDelta(intended)} a week'),
        ],
      );
  }
}
