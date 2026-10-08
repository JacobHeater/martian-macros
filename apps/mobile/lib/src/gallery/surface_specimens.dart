import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../food/calorie_hero.dart';

import '../ui/choice_card.dart';
import '../ui/group_header.dart';
import '../ui/info_card.dart';
import '../ui/mm_list_row.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';
import '../ui/section_label.dart';
import '../ui/stat_row.dart';

/// Surfaces, notices, rows and choice cards.
class SurfaceSpecimens extends StatelessWidget {
  const SurfaceSpecimens({super.key});

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const InfoCard(
        title: 'Daily targets',
        child: Column(
          children: [
            StatRow('Protein', '159 g'),
            StatRow('Carbs', '205 g'),
            StatRow('Fat', '54 g'),
          ],
        ),
      ),
      const Notice(
        icon: Icons.hourglass_bottom,
        text:
            'Waiting for early water changes to settle. Your measurement will '
            'use the days after October 18.',
      ),
      const SizedBox(height: 12),
      const Notice(
        kind: NoticeKind.caution,
        text: 'Your calories are at the lowest level the app will set.',
      ),
      const SizedBox(height: 12),
      Notice(
        kind: NoticeKind.safeguard,
        title: 'Targets are paused.',
        text: 'Please speak with a clinician before changing your intake.',
        action: MmButton(
          label: 'Review answers',
          kind: MmButtonKind.secondary,
          onPressed: () {},
        ),
      ),
      const SizedBox(height: 12),
      const SectionLabel('Hero'),
      CalorieHero(
        intake: IntakeDay(
          date: CalendarDate(2026, 10, 5),
          kcal: 1420,
          proteinG: 96,
          carbsG: 140,
          fatG: 40,
        ),
        targets: const DailyTargets(
          kcal: 2480,
          proteinG: 180,
          fatG: 70,
          carbsG: 300,
          weeklyRateFraction: -0.0075,
        ),
        status: 'Calibration, day 4 of 14.',
        onStatusTap: () {},
      ),
      const SectionLabel('Choice cards'),
      ChoiceCard(
        label: 'Fat loss',
        detail: 'Lose fat at a steady pace.',
        selected: true,
        badge: 'Recommended',
        onTap: () {},
      ),
      ChoiceCard(
        label: 'Maintenance',
        detail: 'Hold where you are.',
        selected: false,
        onTap: () {},
      ),
      const GroupHeader('A group of rows'),
      const MmListRow(title: 'Biological sex', trailing: Text('Female')),
      const MmListRow(
        leadingIcon: Icons.lock_outline,
        title: 'Stored only on this device',
        subtitle: 'Nothing is uploaded.',
      ),
      MmListRow(
        leadingIcon: Icons.delete_forever_outlined,
        danger: true,
        title: 'Erase all data and start over',
        onTap: () {},
      ),
    ],
  );
}
