import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../format/parse_number.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_progress_bar.dart';
import 'about_you_step.dart';
import 'activity_step.dart';
import 'goal_step.dart';
import 'health_step.dart';
import 'measurements_step.dart';
import 'onboarding_screen.dart';
import 'training_step.dart';

class OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  static const _stepCount = 6;
  var _step = 0;
  var _saving = false;

  BiologicalSex? _sex;
  CalendarDate? _birthDate;
  var _units = UnitSystem.imperial;
  double? _heightCm;
  double? _weightKg;
  var _status = TrainingStatus.novice;
  var _trainingDays = 3;
  var _activity = DailyActivity.light;
  double? _bodyFat;
  var _screening = const ScreeningAnswers();
  GoalMode? _mode;

  final _feet = TextEditingController();
  final _inches = TextEditingController();
  final _cm = TextEditingController();
  final _weight = TextEditingController();

  @override
  void dispose() {
    for (final c in [_feet, _inches, _cm, _weight]) {
      c.dispose();
    }
    super.dispose();
  }

  CalendarDate get _today => ref.read(todayProvider);

  Profile? get _profile {
    final sex = _sex, birth = _birthDate, height = _heightCm;
    if (sex == null || birth == null || height == null) return null;
    if (height < 100 || height > 250) return null;
    return Profile(sex: sex, birthDate: birth, heightCm: height);
  }

  bool get _isMinor {
    final birth = _birthDate;
    if (birth == null) return false;
    // Height is irrelevant to age; use a placeholder to reuse the rule.
    return !Profile(
      sex: _sex ?? BiologicalSex.male,
      birthDate: birth,
      heightCm: 170,
    ).isAdultOn(_today);
  }

  CoachingPolicy? get _policy {
    final profile = _profile;
    if (profile == null) return null;
    return CoachingPolicy.derive(
      profile: profile,
      screening: _screening,
      today: _today,
    );
  }

  BodyFatEstimate? get _bodyFatEstimate {
    final profile = _profile, weight = _weightKg;
    if (profile == null || weight == null) return null;
    final measured = _bodyFat;
    return measured != null
        ? BodyFatEstimate(percent: measured, sigmaPercent: 3)
        : deurenbergBodyFat(
            sex: profile.sex,
            weightKg: weight,
            heightCm: profile.heightCm,
            ageYears: profile.ageOn(_today),
          );
  }

  ModeRecommendation? get _recommendation {
    final policy = _policy, bodyFat = _bodyFatEstimate;
    if (policy == null || bodyFat == null) return null;
    return recommendMode(
      sex: _sex!,
      bodyFatPercent: bodyFat.percent,
      trainingStatus: _status,
      policy: policy,
    );
  }

  bool get _canContinue => switch (_step) {
    0 => _sex != null && _birthDate != null && !_isMinor,
    1 =>
      _profile != null &&
          _weightKg != null &&
          _weightKg! >= 30 &&
          _weightKg! <= 350,
    _ => true,
  };

  void _readMeasurements() {
    final fmt = Fmt(_units);
    if (fmt.imperial) {
      final feet = parseNumber(_feet.text);
      final inches = parseNumber(_inches.text) ?? 0;
      _heightCm = feet == null ? null : Units.inchesToCm(feet * 12 + inches);
    } else {
      _heightCm = parseNumber(_cm.text);
    }
    final weight = parseNumber(_weight.text);
    _weightKg = weight == null ? null : fmt.weightToKg(weight);
  }

  void _clearFemaleOnlyAnswers() {
    final s = _screening;
    _screening = ScreeningAnswers(
      eatingDisorderHistory: s.eatingDisorderHistory,
      chronicKidneyDisease: s.chronicKidneyDisease,
      androgenUse: s.androgenUse,
      thyroidCondition: s.thyroidCondition,
    );
  }

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 30),
      firstDate: DateTime(now.year - 100),
      lastDate: now,
      initialDatePickerMode: DatePickerMode.year,
      helpText: 'Date of birth',
    );
    if (picked != null) {
      setState(() => _birthDate = CalendarDate.fromDateTime(picked));
    }
  }

  Future<void> _finish() async {
    final profile = _profile!;
    final policy = _policy!;
    final recommended = _recommendation!.mode;
    final chosen = _mode ?? recommended;
    setState(() => _saving = true);
    await ref.read(weightWriterProvider).saveWeight(_today, _weightKg!);
    await ref
        .read(setupWriterProvider)
        .saveSetup(
          UserSetup(
            profile: profile,
            screening: _screening,
            trainingStatus: _status,
            trainingDaysPerWeek: _trainingDays,
            dailyActivity: _activity,
            goalMode: policy.allowedModes.contains(chosen)
                ? chosen
                : recommended,
            onboardedOn: _today,
            unitSystem: _units,
            bodyFatPercent: _bodyFat,
          ),
        );
  }

  Widget _stepBody() => switch (_step) {
    0 => AboutYouStep(
      sex: _sex,
      birthDate: _birthDate,
      isMinor: _isMinor,
      onSex: (sex) => setState(() {
        _sex = sex;
        if (sex == BiologicalSex.male) _clearFemaleOnlyAnswers();
      }),
      onPickBirthDate: _pickBirthDate,
    ),
    1 => MeasurementsStep(
      units: _units,
      feet: _feet,
      inches: _inches,
      cm: _cm,
      weight: _weight,
      onUnits: (units) => setState(() {
        _units = units;
        _feet.clear();
        _inches.clear();
        _cm.clear();
        _weight.clear();
        _heightCm = null;
        _weightKg = null;
      }),
      onChanged: () => setState(_readMeasurements),
    ),
    2 => ActivityStep(
      activity: _activity,
      onActivity: (activity) => setState(() => _activity = activity),
    ),
    3 => TrainingStep(
      status: _status,
      trainingDays: _trainingDays,
      bodyFat: _bodyFat,
      onStatus: (status) => setState(() => _status = status),
      onTrainingDays: (days) => setState(() => _trainingDays = days),
      onBodyFatKnown: (on) => setState(
        () => _bodyFat = on ? (_bodyFatEstimate?.percent ?? 25) : null,
      ),
      onBodyFat: (value) => setState(() => _bodyFat = value),
    ),
    4 => HealthStep(
      screening: _screening,
      female: _sex == BiologicalSex.female,
      onChanged: (answers) => setState(() => _screening = answers),
    ),
    _ => GoalStep(
      policy: _policy!,
      recommendation: _recommendation!,
      selected: _mode ?? _recommendation!.mode,
      onMode: (mode) => setState(() => _mode = mode),
    ),
  };

  @override
  Widget build(BuildContext context) {
    final last = _step == _stepCount - 1;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: MmProgressBar(value: (_step + 1) / _stepCount),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: _stepBody(),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
              child: Row(
                children: [
                  if (_step > 0)
                    MmButton(
                      label: 'Back',
                      kind: MmButtonKind.text,
                      onPressed: _saving ? null : () => setState(() => _step--),
                    ),
                  const Spacer(),
                  MmButton(
                    label: last ? 'Start' : 'Next',
                    onPressed: !_canContinue || _saving
                        ? null
                        : last
                        ? _finish
                        : () => setState(() => _step++),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
