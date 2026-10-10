import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/equipment_label.dart';
import '../format/muscle_group_label.dart';
import '../providers.dart';
import '../ui/group_header.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_list_row.dart';
import '../ui/mm_text_field.dart';
import 'custom_exercise_screen.dart';
import 'exercise_picker_screen.dart';

class ExercisePickerScreenState extends ConsumerState<ExercisePickerScreen> {
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    final id = await Navigator.of(context).push(
      MaterialPageRoute<String>(
        builder: (_) => CustomExerciseScreen(name: _search.text.trim()),
      ),
    );
    if (id != null && mounted) Navigator.of(context).pop(id);
  }

  @override
  Widget build(BuildContext context) {
    final recent = recentExerciseIds(
      ref.watch(workoutsProvider).value ?? const [],
    );
    final found = searchExercises(
      query: _search.text,
      exercises: ref.watch(exercisesProvider),
      recentIds: recent,
    );
    // With nothing typed, the recently used lead the list under their own
    // heading.
    final recentCount = _search.text.trim().isEmpty
        ? found.where((e) => recent.contains(e.id)).length
        : 0;

    return Scaffold(
      appBar: const MmAppBar(title: 'Choose an exercise'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: MmTextField(
              key: const ValueKey('exercise-search'),
              controller: _search,
              label: 'Search exercises',
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.only(bottom: 32),
              // The exercises, a heading above each of up to two groups, and
              // the row that creates one.
              itemCount: found.length + (recentCount > 0 ? 2 : 0) + 1,
              itemBuilder: (context, i) {
                var row = i;
                if (recentCount > 0) {
                  if (row == 0) return const GroupHeader('Recent');
                  row--;
                  if (row == recentCount) {
                    return const GroupHeader('All exercises');
                  }
                  if (row > recentCount) row--;
                }
                if (row == found.length) {
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (found.isEmpty)
                          const Padding(
                            padding: EdgeInsets.only(bottom: 12),
                            child: Text('No exercise by that name.'),
                          ),
                        MmButton(
                          key: const ValueKey('exercise-create'),
                          label: 'Create your own exercise',
                          kind: MmButtonKind.secondary,
                          onPressed: _create,
                        ),
                      ],
                    ),
                  );
                }
                final exercise = found[row];
                return MmListRow(
                  key: ValueKey('exercise-${exercise.id}'),
                  dense: true,
                  title: exercise.name,
                  subtitle:
                      '${exercise.equipment.label} · '
                      '${exercise.primary.label}'
                      '${exercise.isCustom ? ' · Yours' : ''}',
                  onTap: () => Navigator.of(context).pop(exercise.id),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
