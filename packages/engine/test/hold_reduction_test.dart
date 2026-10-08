import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-138: the user may keep last week's targets, once, for an ordinary
/// reduction.
void main() {
  final start = CalendarDate(2026, 1, 1);

  TargetsRecord record(
    int week,
    double kcal, {
    Set<TargetFlag> flags = const {},
    List<ExplanationLine>? lines,
    double? previousKcal,
  }) => TargetsRecord(
    effectiveFrom: start.addDays(7 * week),
    mode: GoalMode.fatLoss,
    tdeeKcal: 2800,
    tdeeSigmaKcal: 250,
    tdeeStatus: TdeeStatus.updated,
    targets: DailyTargets(
      kcal: kcal,
      proteinG: 170,
      fatG: 70,
      carbsG: 240,
      weeklyRateFraction: -0.0075,
      flags: flags,
    ),
    explanation: lines == null
        ? null
        : TargetsExplanation(
            lines: lines,
            previousKcal: previousKcal,
            newKcal: kcal,
            estimateStatus: TdeeStatus.updated,
          ),
  );

  const ordinary = [
    ExplanationLine(
      ExplanationReason.expenditureEstimate,
      -75,
      from: 2900,
      to: 2825,
    ),
  ];

  List<TargetsRecord> reduction() => [
    record(0, 2400),
    record(1, 2325, lines: ordinary, previousKcal: 2400),
  ];

  test('an ordinary reduction can be held', () {
    expect(canHoldReduction(reduction()), isTrue);
  });

  test('holding returns last week\'s numbers on the same day, flagged, and '
      'the lines still add up', () {
    final h = reduction();
    final held = holdReduction(h);
    expect(held.effectiveFrom, h.last.effectiveFrom);
    expect(held.targets.kcal, 2400);
    expect(held.targets.proteinG, h.first.targets.proteinG);
    expect(held.targets.flags, {TargetFlag.heldByUser});
    final e = held.explanation!;
    expect(e.change, 0);
    expect(e.linesTotal, closeTo(0, 1e-9));
    expect(e.lines.last.reason, ExplanationReason.userHold);
    expect(e.lines.last.kcal, 75);
  });

  test('not twice running: the week after a hold offers no hold', () {
    final held = holdReduction(reduction());
    final next = record(
      2,
      2250,
      lines: const [
        ExplanationLine(
          ExplanationReason.expenditureEstimate,
          -75,
          from: 2825,
          to: 2750,
        ),
      ],
      previousKcal: 2400,
    );
    expect(canHoldReduction([record(0, 2400), held, next]), isFalse);
  });

  test('it can be offered again two check-ins later', () {
    final held = holdReduction(reduction());
    final next = record(2, 2300, lines: ordinary, previousKcal: 2400);
    final later = record(3, 2225, lines: ordinary, previousKcal: 2300);
    expect(canHoldReduction([record(0, 2400), held, next, later]), isTrue);
  });

  test('never for an increase', () {
    final history = [
      record(0, 2325),
      record(
        1,
        2400,
        lines: const [
          ExplanationLine(ExplanationReason.expenditureEstimate, 75),
        ],
        previousKcal: 2325,
      ),
    ];
    expect(canHoldReduction(history), isFalse);
  });

  test('never for a safety change', () {
    for (final flag in [
      TargetFlag.raisedForSafePace,
      TargetFlag.heldAfterSafetyRaise,
      TargetFlag.underweightMaintenance,
      TargetFlag.modeNotAllowed,
      TargetFlag.dietBreak,
    ]) {
      final history = [
        record(0, 2400),
        record(1, 2325, flags: {flag}, lines: ordinary, previousKcal: 2400),
      ];
      expect(canHoldReduction(history), isFalse, reason: flag.name);
    }
  });

  test('never for a change the user made, or one with a safety cause', () {
    for (final reason in [
      ExplanationReason.goalChange,
      ExplanationReason.profileCorrection,
      ExplanationReason.healthRule,
      ExplanationReason.underweightRule,
      ExplanationReason.bodyFatEstimate,
      ExplanationReason.dietBreak,
      ExplanationReason.safetyRaise,
      ExplanationReason.calorieFloor,
    ]) {
      final history = [
        record(0, 2400),
        record(
          1,
          2325,
          lines: [ExplanationLine(reason, -75)],
          previousKcal: 2400,
        ),
      ];
      expect(canHoldReduction(history), isFalse, reason: reason.name);
    }
  });

  test('not without an explanation, and not for the first targets', () {
    expect(canHoldReduction([record(0, 2400), record(1, 2325)]), isFalse);
    expect(canHoldReduction([record(0, 2400)]), isFalse);
    expect(canHoldReduction(const []), isFalse);
  });
}
