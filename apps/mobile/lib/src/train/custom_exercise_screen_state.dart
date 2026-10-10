import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/equipment_label.dart';
import '../format/muscle_group_label.dart';
import '../repository_role_providers.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_button.dart';
import '../ui/mm_choice_chip.dart';
import '../ui/mm_dropdown.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/mm_text_field.dart';
import '../ui/section_label.dart';
import 'custom_exercise_screen.dart';

class CustomExerciseScreenState extends ConsumerState<CustomExerciseScreen> {
  late final _name = TextEditingController(text: widget.name);
  Equipment _equipment = Equipment.barbell;
  MuscleGroup _primary = MuscleGroup.chest;
  final _secondary = <MuscleGroup>{};
  ExerciseLoad _load = ExerciseLoad.addedWeight;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final id = await ref
        .read(customExerciseWriterProvider)
        .saveCustomExercise(
          Exercise(
            id: '',
            name: _name.text.trim(),
            equipment: _equipment,
            primary: _primary,
            secondary: [
              for (final muscle in MuscleGroup.values)
                if (_secondary.contains(muscle) && muscle != _primary) muscle,
            ],
            load: _load,
          ),
        );
    if (mounted) Navigator.of(context).pop(id);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: const MmAppBar(title: 'Your own exercise'),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        MmTextField(
          key: const ValueKey('custom-exercise-name'),
          controller: _name,
          label: 'Name',
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 16),
        MmDropdown<Equipment>(
          key: const ValueKey('custom-exercise-equipment'),
          label: 'Equipment',
          initialValue: _equipment,
          items: [
            for (final equipment in Equipment.values)
              DropdownMenuItem(value: equipment, child: Text(equipment.label)),
          ],
          onChanged: (value) => setState(() => _equipment = value!),
        ),
        const SizedBox(height: 16),
        MmDropdown<MuscleGroup>(
          key: const ValueKey('custom-exercise-primary'),
          label: 'Main muscle group',
          initialValue: _primary,
          items: [
            for (final muscle in MuscleGroup.values)
              DropdownMenuItem(value: muscle, child: Text(muscle.label)),
          ],
          onChanged: (value) => setState(() => _primary = value!),
        ),
        const SizedBox(height: 16),
        const SectionLabel('Also trains (optional)'),
        const SizedBox(height: 4),
        Wrap(
          spacing: 8,
          children: [
            for (final muscle in MuscleGroup.values)
              if (muscle != _primary)
                MmChoiceChip(
                  key: ValueKey('custom-exercise-also-${muscle.name}'),
                  label: muscle.label,
                  selected: _secondary.contains(muscle),
                  onSelected: () => setState(
                    () => _secondary.contains(muscle)
                        ? _secondary.remove(muscle)
                        : _secondary.add(muscle),
                  ),
                ),
          ],
        ),
        const SizedBox(height: 16),
        const SectionLabel('What the load you log means'),
        const SizedBox(height: 8),
        MmSegmented<ExerciseLoad>(
          segments: const [
            MmSegment(ExerciseLoad.addedWeight, 'The weight moved'),
            MmSegment(ExerciseLoad.bodyweight, 'Added to bodyweight'),
          ],
          selected: {_load},
          onChanged: (s) => setState(() => _load = s.first),
        ),
        const SizedBox(height: 24),
        MmButton(
          key: const ValueKey('custom-exercise-save'),
          label: 'Save exercise',
          expand: true,
          onPressed: _name.text.trim().isEmpty || _saving ? null : _save,
        ),
      ],
    ),
  );
}
