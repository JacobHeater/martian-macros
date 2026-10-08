import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../providers.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_surface.dart';
import 'evidence_row_card.dart';

/// One answer, then the rules behind it with their grade in words and, one tap
/// down, where each comes from.
class EvidenceQuestionScreen extends ConsumerWidget {
  const EvidenceQuestionScreen({required this.question, super.key});

  final EvidenceQuestion question;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final register = ref.watch(evidenceRegisterProvider).value;
    final rows = [for (final name in question.rowNames) ?register?.row(name)];
    return Scaffold(
      appBar: MmAppBar(title: question.title),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(question.answer, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 20),
          Text(
            'The rules behind this',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          for (final row in rows)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: EvidenceRowCard(row: row),
            ),
          if (rows.isNotEmpty)
            const MmSurface(
              child: Text(
                'These sources are as recorded when the rules were written. '
                'None has been reviewed by a professional yet.',
              ),
            ),
        ],
      ),
    );
  }
}
