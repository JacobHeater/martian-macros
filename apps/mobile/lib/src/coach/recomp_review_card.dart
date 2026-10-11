import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../ui/info_card.dart';
import 'recomp_review_body.dart';
import 'recomp_review_provider.dart';

/// The recomp review (MM-133), on the Coach screen for two weeks from 8
/// and 12 weeks on recomp and every 8 after: a verdict with what was seen,
/// or what is missing. It recommends and changes nothing; the goal is the
/// user's to change.
class RecompReviewCard extends ConsumerWidget {
  const RecompReviewCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final review = ref.watch(recompReviewProvider);
    final setup = ref.watch(setupProvider).value;
    if (review == null || setup == null) return const SizedBox.shrink();
    return InfoCard(
      key: const ValueKey('recomp-review'),
      title: 'Recomp review, week ${review.week}',
      child: RecompReviewBody(review: review, fmt: Fmt(setup.unitSystem)),
    );
  }
}
