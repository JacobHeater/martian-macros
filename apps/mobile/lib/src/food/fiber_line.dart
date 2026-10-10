import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../theme/mm_colors_context.dart';

/// The day's fiber against its guide, at Full detail only (MM-126). A guide,
/// never judged: no "under", no streak. With too little of the day's calories
/// carrying a fiber value it says so instead of showing a total that would
/// treat missing as zero.
class FiberLine extends ConsumerWidget {
  const FiberLine({
    required this.entries,
    required this.kcalTarget,
    required this.sex,
    super.key,
  });

  final List<FoodEntry> entries;
  final double? kcalTarget;
  final BiologicalSex? sex;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final level = ref.watch(detailLevelProvider).value ?? DetailLevel.standard;
    if (!level.showsExtras || entries.isEmpty) return const SizedBox.shrink();
    final day = FiberDay.of(entries);
    final target = kcalTarget;
    final sex = this.sex;
    final guide = target == null || sex == null
        ? null
        : fiberGuideG(kcalTarget: target, sex: sex);
    final line = !day.enough
        ? 'Fiber: not enough data'
        : guide == null
        ? 'Fiber: ${Fmt.whole(day.totalG)} g'
        : 'Fiber: ${Fmt.whole(day.totalG)} g · guide ${Fmt.whole(guide)} g';
    return Padding(
      key: const ValueKey('fiber-line'),
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(
        line,
        style: Theme.of(context).textTheme.bodyMedium
            ?.copyWith(color: context.mm.text2),
      ),
    );
  }
}
