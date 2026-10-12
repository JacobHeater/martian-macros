import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

/// What the coach says at a recomp review (MM-133): the verdict in plain
/// words with a next step, or what has to be logged before there can be
/// one. It recommends; it changes nothing and gives no orders.
String recompReviewText(RecompReview review) {
  final weeks = (review.periodDays / 7).round();
  switch (review.verdict) {
    case RecompVerdict.working:
      return 'It is working. A smaller waist with strength held or rising '
          'is what a recomp looks like. Carry on.';
    case RecompVerdict.slowCut:
      return 'You are losing weight, which is fine. It is a slow fat loss '
          'more than a recomp, and it helps to call it what it is.'
          '${review.nextGoal == GoalMode.fatLoss ? ' Fat loss at the Gentle pace would match what is happening.' : ''}';
    case RecompVerdict.probablyWorking:
      return 'Probably working, slowly. Strength is the earliest signal, '
          'and yours is up. Keep going, and measure your waist every week.';
    case RecompVerdict.tooEarly:
      return 'Too early to tell. Eight weeks is short for a recomp, and '
          'neither your waist nor your strength has clearly moved yet. '
          'Keep going and measure your waist every week. The next review '
          'is at twelve weeks.';
    case RecompVerdict.notWorking:
      const seen =
          'neither your waist nor your strength has moved the '
          'right way';
      return switch (review.nextGoal) {
        GoalMode.fatLoss =>
          'Not working so far: over $weeks weeks $seen. At your body fat a '
              'fat loss phase is likely to show more for the same effort.',
        GoalMode.leanGain =>
          'Not working so far: over $weeks weeks $seen. Lean and trained, '
              'building needs a surplus: a lean gain fits better.',
        GoalMode.maintenance =>
          'Not working so far: over $weeks weeks $seen. Holding at '
              'maintenance for a while is a sound next step.',
        GoalMode.recomp || null =>
          'Not working so far: over $weeks weeks $seen. Recomp still fits '
              'you, so the training is the place to look first: enough hard '
              'sets each week, and loads or reps that go up over time.',
      };
    case null:
      final needs = [
        if (review.missing.contains(RecompMeasure.waist))
          'at least four waist measurements over the period, one of them '
              'in the last two weeks (there are ${review.waistMeasurements}); '
              'once a week is enough',
        if (review.missing.contains(RecompMeasure.strength))
          'two lifts trained in at least six different weeks, and in the '
              'last two',
        if (review.missing.contains(RecompMeasure.weight))
          'weigh-ins going back to the start of the period',
      ];
      return 'No verdict yet. The review needs ${needs.join('; and ')}.';
  }
}
