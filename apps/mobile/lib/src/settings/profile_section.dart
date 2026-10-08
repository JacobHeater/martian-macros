import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/group_header.dart';
import '../ui/mm_list_row.dart';
import '../ui/show_mm_confirm.dart';
import 'edit_height_sheet.dart';
import 'health_check_screen.dart';

/// The Profile group of Settings: sex, date of birth, height and the health
/// check, each correctable (MM-83). Every change issues new targets at once.
class ProfileSection extends ConsumerWidget {
  const ProfileSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final setup = ref.watch(setupProvider).value;
    if (setup == null) return const SizedBox.shrink();
    final profile = setup.profile;
    final fmt = Fmt(setup.unitSystem);
    final height = fmt.imperial
        ? '${Units.cmToInches(profile.heightCm) ~/ 12}′ '
              '${(Units.cmToInches(profile.heightCm) % 12).round()}″'
        : '${profile.heightCm.round()} cm';
    final ticked = _tickedCount(setup.screening);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const GroupHeader('Profile'),
        MmListRow(
          title: 'Biological sex',
          trailing: Text(profile.sex == BiologicalSex.male ? 'Male' : 'Female'),
          onTap: () => _changeSex(context, ref, setup),
        ),
        MmListRow(
          title: 'Date of birth',
          subtitle: 'Age ${profile.ageOn(ref.watch(todayProvider))}',
          trailing: Text(Fmt.longDate(profile.birthDate)),
          onTap: () => _changeBirthDate(context, ref, setup),
        ),
        MmListRow(
          title: 'Height',
          trailing: Text(height),
          onTap: () => _changeHeight(context, ref, setup),
        ),
        MmListRow(
          title: 'Health check',
          subtitle: ticked == 0
              ? 'Nothing ticked'
              : '$ticked ${ticked == 1 ? 'answer' : 'answers'} ticked',
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => const HealthCheckScreen()),
          ),
        ),
      ],
    );
  }

  int _tickedCount(ScreeningAnswers s) => [
    s.pregnant,
    s.breastfeeding,
    s.eatingDisorderHistory,
    s.chronicKidneyDisease,
    s.androgenUse,
    s.pcos,
    s.menopause,
    s.thyroidCondition,
  ].where((v) => v).length;

  /// Saves a corrected profile or health check and marks it, so the engine
  /// issues new targets now, not at the next weekly check-in.
  Future<void> _save(
    WidgetRef ref,
    UserSetup setup, {
    Profile? profile,
    ScreeningAnswers? screening,
  }) => ref
      .read(setupWriterProvider)
      .saveSetup(
        setup.copyWith(
          profile: profile,
          screening: screening,
          profileRevision: setup.profileRevision + 1,
        ),
      );

  Future<void> _changeSex(
    BuildContext context,
    WidgetRef ref,
    UserSetup setup,
  ) async {
    final profile = setup.profile;
    final toMale = profile.sex == BiologicalSex.female;
    final confirmed = await showMmConfirm(
      context,
      title: 'Change biological sex?',
      message:
          'Your energy needs, body-fat estimate and safety limits are '
          'recalculated for a ${toMale ? 'male' : 'female'} profile, and new '
          'targets start now. Your food log and weigh-ins are kept.'
          '${toMale ? ' Female-only health answers are cleared.' : ''}',
      confirmLabel: 'Change',
    );
    if (!confirmed) return;
    final s = setup.screening;
    await _save(
      ref,
      setup,
      profile: Profile(
        sex: toMale ? BiologicalSex.male : BiologicalSex.female,
        birthDate: profile.birthDate,
        heightCm: profile.heightCm,
      ),
      screening: toMale
          ? ScreeningAnswers(
              eatingDisorderHistory: s.eatingDisorderHistory,
              chronicKidneyDisease: s.chronicKidneyDisease,
              androgenUse: s.androgenUse,
              thyroidCondition: s.thyroidCondition,
            )
          : null,
    );
  }

  Future<void> _changeBirthDate(
    BuildContext context,
    WidgetRef ref,
    UserSetup setup,
  ) async {
    final profile = setup.profile;
    final now = ref.read(todayProvider);
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(
        profile.birthDate.year,
        profile.birthDate.month,
        profile.birthDate.day,
      ),
      firstDate: DateTime(now.year - 100),
      lastDate: DateTime(now.year, now.month, now.day),
      initialDatePickerMode: DatePickerMode.year,
      helpText: 'Date of birth',
    );
    if (picked == null) return;
    await _save(
      ref,
      setup,
      profile: Profile(
        sex: profile.sex,
        birthDate: CalendarDate.fromDateTime(picked),
        heightCm: profile.heightCm,
      ),
    );
  }

  Future<void> _changeHeight(
    BuildContext context,
    WidgetRef ref,
    UserSetup setup,
  ) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (_) => EditHeightSheet(
      initialCm: setup.profile.heightCm,
      imperial: setup.unitSystem == UnitSystem.imperial,
      onSave: (cm) => _save(
        ref,
        setup,
        profile: Profile(
          sex: setup.profile.sex,
          birthDate: setup.profile.birthDate,
          heightCm: cm,
        ),
      ),
    ),
  );
}
