import 'package:flutter/material.dart';

import '../ui/mm_action_chip.dart';
import '../ui/mm_check_row.dart';
import '../ui/mm_choice_chip.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/mm_slider.dart';
import '../ui/mm_switch_row.dart';
import '../ui/mm_text_field.dart';
import '../ui/mm_text_field_kind.dart';
import 'input_specimens.dart';

class InputSpecimensState extends State<InputSpecimens> {
  final text = TextEditingController(text: 'Chicken and rice');
  final number = TextEditingController(text: '172.4');
  final warning = TextEditingController(text: '600');
  var range = 30;
  var on = true;
  var checked = false;
  var slider = 3.0;
  var chip = 0;

  /// Runs [change] and rebuilds.
  void update(VoidCallback change) => setState(change);

  @override
  void dispose() {
    text.dispose();
    number.dispose();
    warning.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      MmTextField(controller: text, label: 'Food'),
      const SizedBox(height: 12),
      MmTextField(
        controller: number,
        label: 'Weight',
        kind: MmTextFieldKind.number,
        suffix: 'lb',
      ),
      const SizedBox(height: 12),
      MmTextField(
        controller: warning,
        label: 'Calories',
        kind: MmTextFieldKind.number,
        helper: 'Macros add up to 410 kcal. Double-check the label.',
        helperIsWarning: true,
      ),
      const SizedBox(height: 12),
      MmSegmented<int>(
        segments: const [MmSegment(30, '30d'), MmSegment(90, '90d')],
        selected: {range},
        onChanged: (v) => update(() => range = v.first),
      ),
      const SizedBox(height: 12),
      MmSwitchRow(
        title: 'Let the app estimate',
        subtitle: 'Enter one only if you have a recent measurement.',
        value: on,
        onChanged: (v) => update(() => on = v),
      ),
      MmCheckRow(
        title: 'Thyroid condition',
        value: checked,
        onChanged: (v) => update(() => checked = v),
      ),
      MmSlider(
        value: slider,
        max: 7,
        divisions: 7,
        label: '${slider.round()}',
        onChanged: (v) => update(() => slider = v),
      ),
      Wrap(
        spacing: 8,
        children: [
          MmChoiceChip(
            label: 'Lunch',
            selected: chip == 0,
            onSelected: () => update(() => chip = 0),
          ),
          MmChoiceChip(
            label: 'Dinner',
            selected: chip == 1,
            onSelected: () => update(() => chip = 1),
          ),
          MmActionChip(label: 'Greek yogurt', onPressed: () {}),
        ],
      ),
    ],
  );
}
