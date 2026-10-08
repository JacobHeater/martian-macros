import 'package:flutter/material.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../ui/notice.dart';
import '../ui/stat_row.dart';

class MetabolismSummary extends StatelessWidget {
  const MetabolismSummary({
    super.key,
    required this.snapshot,
    required this.calibrating,
  });

  final CoachSnapshot snapshot;
  final bool calibrating;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final tdee = snapshot.tdee;
    final measured = tdee.status == TdeeStatus.updated;
    const estimator = TdeeEstimator();
    final needDays = estimator.minIntakeDays - tdee.usableIntakeDays;
    final needWeighIns = estimator.minWeighIns - tdee.weighIns;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${Fmt.whole(tdee.kcal)} ± ${Fmt.whole(tdee.sigmaKcal)} kcal / day',
          style: text.headlineSmall,
        ),
        const SizedBox(height: 4),
        Text(
          measured
              ? 'Measured from your logged food and weight trend.'
              : 'Starting estimate from your height, weight, age, and sex. '
                    'It gets replaced by a measurement of your body.',
          style: text.bodyMedium,
        ),
        const SizedBox(height: 12),
        if (measured) ...[
          StatRow('Logged days used', '${tdee.usableIntakeDays}'),
          StatRow('Weigh-ins used', '${tdee.weighIns}'),
          if (tdee.excludedPartialDays > 0)
            StatRow('Partial days left out', '${tdee.excludedPartialDays}'),
          if (tdee.clampedToBounds)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Notice(
                icon: Icons.warning_amber_outlined,
                text:
                    'Your logs and weight trend don’t add up to a plausible '
                    'number, which usually means food is going unlogged. '
                    'The estimate is being held at a safe limit.',
              ),
            ),
        ] else if (tdee.settlingUntil case final settlingUntil?)
          Notice(
            icon: Icons.hourglass_bottom,
            text:
                'Waiting for early water changes to settle. When how much '
                'you eat changes, the scale moves a few pounds that are not '
                'fat. Your measurement will use the days after '
                '${Fmt.longDate(settlingUntil)}, and needs two weeks of them.',
          )
        else
          Notice(
            icon: Icons.hourglass_bottom,
            text:
                'Needs ${[if (needDays > 0) '$needDays more fully logged day${needDays == 1 ? '' : 's'}', if (needWeighIns > 0) '$needWeighIns more weigh-in${needWeighIns == 1 ? '' : 's'}', if (needDays <= 0 && needWeighIns <= 0) calibrating ? 'two full weeks of data' : 'a little more consistent data'].join(' and ')} '
                'before your first measurement.',
          ),
      ],
    );
  }
}
