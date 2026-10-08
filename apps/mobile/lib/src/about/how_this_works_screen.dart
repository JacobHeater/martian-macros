import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_list_row.dart';
import 'evidence_question_screen.dart';

/// The questions a user might ask about how their numbers are made, each
/// answered from the evidence register (MM-143).
class HowThisWorksScreen extends ConsumerWidget {
  const HowThisWorksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final register = ref.watch(evidenceRegisterProvider);
    return Scaffold(
      appBar: const MmAppBar(title: 'How this works'),
      body: register.when(
        loading: () => const SizedBox.shrink(),
        error: (_, _) => const Center(child: Text('This could not be loaded.')),
        data: (r) => ListView(
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                'Every number here comes from a rule. Each answer says how '
                'well supported the rule is, in words, and where it comes '
                'from.',
              ),
            ),
            for (final q in r.questions)
              MmListRow(
                title: q.title,
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => EvidenceQuestionScreen(question: q),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
