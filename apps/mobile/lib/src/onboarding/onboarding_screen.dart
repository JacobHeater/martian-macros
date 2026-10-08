import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format.dart';
import '../providers.dart';
import '../widgets.dart';
import '../repository_role_providers.dart';

/// Collects everything the engine needs before it can coach. Biological
/// sex has no default and nothing proceeds without it.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingState();
}

class _OnboardingState extends ConsumerState<OnboardingScreen> {
  static const _stepCount = 5;
  var _step = 0;
  var _saving = false;

  BiologicalSex? _sex;
  CalendarDate? _birthDate;
  var _units = UnitSystem.imperial;
  double? _heightCm;
  double? _weightKg;
  var _status = TrainingStatus.novice;
  var _trainingDays = 3;
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
            goalMode: policy.allowedModes.contains(chosen)
                ? chosen
                : recommended,
            onboardedOn: _today,
            unitSystem: _units,
            bodyFatPercent: _bodyFat,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final last = _step == _stepCount - 1;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: LinearProgressIndicator(
                value: (_step + 1) / _stepCount,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: switch (_step) {
                  0 => _aboutYou(theme),
                  1 => _measurements(theme),
                  2 => _training(theme),
                  3 => _health(theme),
                  _ => _goal(theme),
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
              child: Row(
                children: [
                  if (_step > 0)
                    TextButton(
                      onPressed: _saving ? null : () => setState(() => _step--),
                      child: const Text('Back'),
                    ),
                  const Spacer(),
                  FilledButton(
                    onPressed: !_canContinue || _saving
                        ? null
                        : last
                        ? _finish
                        : () => setState(() => _step++),
                    child: Text(last ? 'Start' : 'Next'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _aboutYou(ThemeData theme) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('Martian Macros', style: theme.textTheme.headlineMedium),
      const SizedBox(height: 8),
      const Text(
        'Coaching for fat loss and muscle gain that adapts to your body, '
        'not a formula. A few questions first.',
      ),
      const SizedBox(height: 28),
      const SectionLabel('Biological sex'),
      const Text(
        'Energy needs, safe body-fat ranges, and safety limits differ '
        'between males and females.',
      ),
      const SizedBox(height: 12),
      Row(
        children: [
          for (final sex in BiologicalSex.values) ...[
            Expanded(
              child: ChoiceCard(
                label: sex == BiologicalSex.male ? 'Male' : 'Female',
                selected: _sex == sex,
                onTap: () => setState(() {
                  _sex = sex;
                  if (sex == BiologicalSex.male) _clearFemaleOnlyAnswers();
                }),
              ),
            ),
            if (sex != BiologicalSex.values.last) const SizedBox(width: 12),
          ],
        ],
      ),
      const SizedBox(height: 28),
      const SectionLabel('Date of birth'),
      OutlinedButton.icon(
        onPressed: _pickBirthDate,
        icon: const Icon(Icons.cake_outlined),
        label: Text(
          _birthDate == null ? 'Choose date' : Fmt.longDate(_birthDate!),
        ),
      ),
      if (_isMinor) ...[
        const SizedBox(height: 16),
        const Notice(
          icon: Icons.block,
          text:
              'Martian Macros is for adults 18 and over. Growing bodies '
              'need different guidance than this app provides.',
        ),
      ],
    ],
  );

  Widget _measurements(ThemeData theme) {
    final fmt = Fmt(_units);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Your measurements', style: theme.textTheme.headlineSmall),
        const SizedBox(height: 16),
        SegmentedButton<UnitSystem>(
          segments: const [
            ButtonSegment(value: UnitSystem.imperial, label: Text('lb / ft')),
            ButtonSegment(value: UnitSystem.metric, label: Text('kg / cm')),
          ],
          selected: {_units},
          onSelectionChanged: (s) => setState(() {
            _units = s.first;
            _feet.clear();
            _inches.clear();
            _cm.clear();
            _weight.clear();
            _heightCm = null;
            _weightKg = null;
          }),
        ),
        const SizedBox(height: 24),
        const SectionLabel('Height'),
        if (fmt.imperial)
          Row(
            children: [
              Expanded(child: _numberField(_feet, 'Feet', key: 'feet')),
              const SizedBox(width: 12),
              Expanded(child: _numberField(_inches, 'Inches', key: 'inches')),
            ],
          )
        else
          _numberField(_cm, 'Centimeters', key: 'cm'),
        const SizedBox(height: 24),
        const SectionLabel('Current weight'),
        _numberField(_weight, fmt.weightUnit, key: 'weight'),
        const SizedBox(height: 8),
        Text(
          'This becomes your first weigh-in.',
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _numberField(
    TextEditingController controller,
    String label, {
    required String key,
  }) => TextField(
    key: ValueKey('onboarding-$key'),
    controller: controller,
    keyboardType: const TextInputType.numberWithOptions(decimal: true),
    decoration: InputDecoration(labelText: label),
    onChanged: (_) => setState(_readMeasurements),
  );

  Widget _training(ThemeData theme) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('Training', style: theme.textTheme.headlineSmall),
      const SizedBox(height: 16),
      const SectionLabel('Resistance training experience'),
      for (final status in TrainingStatus.values)
        ChoiceCard(
          label: status.label,
          selected: _status == status,
          dense: true,
          onTap: () => setState(() => _status = status),
        ),
      const SizedBox(height: 20),
      SectionLabel('Training days per week: $_trainingDays'),
      Slider(
        value: _trainingDays.toDouble(),
        max: 7,
        divisions: 7,
        label: '$_trainingDays',
        onChanged: (v) => setState(() => _trainingDays = v.round()),
      ),
      const SizedBox(height: 12),
      const SectionLabel('Body fat (optional)'),
      const Text(
        'If you have a recent estimate (DEXA, calipers, or a consistent '
        'scale), enter it. Otherwise leave it off and the app estimates.',
      ),
      SwitchListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(
          _bodyFat == null
              ? 'I don’t know'
              : 'About ${_bodyFat!.round()}% body fat',
        ),
        value: _bodyFat != null,
        onChanged: (on) => setState(
          () => _bodyFat = on ? (_bodyFatEstimate?.percent ?? 25) : null,
        ),
      ),
      if (_bodyFat != null)
        Slider(
          value: _bodyFat!.clamp(5, 55),
          min: 5,
          max: 55,
          divisions: 50,
          label: '${_bodyFat!.round()}%',
          onChanged: (v) => setState(() => _bodyFat = v.roundToDouble()),
        ),
    ],
  );

  Widget _health(ThemeData theme) {
    final s = _screening;
    final female = _sex == BiologicalSex.female;
    ScreeningAnswers copy({
      bool? pregnant,
      bool? breastfeeding,
      bool? eatingDisorderHistory,
      bool? chronicKidneyDisease,
      bool? androgenUse,
      bool? pcos,
      bool? menopause,
      bool? thyroidCondition,
    }) => ScreeningAnswers(
      pregnant: pregnant ?? s.pregnant,
      breastfeeding: breastfeeding ?? s.breastfeeding,
      eatingDisorderHistory: eatingDisorderHistory ?? s.eatingDisorderHistory,
      chronicKidneyDisease: chronicKidneyDisease ?? s.chronicKidneyDisease,
      androgenUse: androgenUse ?? s.androgenUse,
      pcos: pcos ?? s.pcos,
      menopause: menopause ?? s.menopause,
      thyroidCondition: thyroidCondition ?? s.thyroidCondition,
    );
    Widget item(
      String title,
      bool value,
      ScreeningAnswers Function(bool) set,
    ) => CheckboxListTile(
      contentPadding: EdgeInsets.zero,
      controlAffinity: ListTileControlAffinity.leading,
      title: Text(title),
      value: value,
      onChanged: (v) => setState(() => _screening = set(v ?? false)),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Health check', style: theme.textTheme.headlineSmall),
        const SizedBox(height: 8),
        const Text(
          'Tick anything that applies. These change what the app will '
          'recommend, and some switch off calorie deficits entirely.',
        ),
        const SizedBox(height: 8),
        if (female) ...[
          item('Pregnant', s.pregnant, (v) => copy(pregnant: v)),
          item('Breastfeeding', s.breastfeeding, (v) => copy(breastfeeding: v)),
          item('PCOS', s.pcos, (v) => copy(pcos: v)),
          item(
            'Perimenopause or menopause',
            s.menopause,
            (v) => copy(menopause: v),
          ),
        ],
        item(
          'History of an eating disorder',
          s.eatingDisorderHistory,
          (v) => copy(eatingDisorderHistory: v),
        ),
        item(
          'Chronic kidney disease',
          s.chronicKidneyDisease,
          (v) => copy(chronicKidneyDisease: v),
        ),
        item(
          'Thyroid condition',
          s.thyroidCondition,
          (v) => copy(thyroidCondition: v),
        ),
        item(
          'Testosterone therapy or anabolic steroids',
          s.androgenUse,
          (v) => copy(androgenUse: v),
        ),
        const SizedBox(height: 8),
        Text(
          'This app is not medical advice. Talk to your clinician before '
          'changing your diet if you have a medical condition.',
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _goal(ThemeData theme) {
    final policy = _policy!;
    final recommendation = _recommendation!;
    final selected = _mode ?? recommendation.mode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Your plan', style: theme.textTheme.headlineSmall),
        const SizedBox(height: 12),
        Notice(
          icon: Icons.lightbulb_outline,
          text:
              'We recommend ${recommendation.mode.label.toLowerCase()}. '
              '${recommendation.reason.explanation}',
        ),
        const SizedBox(height: 16),
        for (final mode in GoalMode.values)
          if (policy.allowedModes.contains(mode))
            ChoiceCard(
              label: mode.label,
              detail: mode.blurb,
              selected: selected == mode,
              badge: mode == recommendation.mode ? 'Recommended' : null,
              onTap: () => setState(() => _mode = mode),
            ),
        const SizedBox(height: 16),
        const Notice(
          icon: Icons.calendar_month_outlined,
          text:
              'Your first two weeks are calibration: log your food and '
              'weigh in daily, and your targets hold steady. After that '
              'they adapt weekly to how your body actually responds.',
        ),
      ],
    );
  }
}

extension on ModeReason {
  String get explanation => switch (this) {
    ModeReason.deficitNotAllowed =>
      'Based on your health check, the app will not prescribe a calorie '
          'deficit.',
    ModeReason.highBodyFat =>
      'At your current body fat, steady fat loss gives the fastest visible '
          'progress while training protects your muscle.',
    ModeReason.recompEligible =>
      'With your training background and body composition, you can '
          'realistically lose fat and gain muscle at the same time.',
    ModeReason.leanAndTrained =>
      'You are already lean and trained, so building muscle needs a small '
          'surplus.',
    ModeReason.cutFirst =>
      'For trained lifters at moderate body fat, a focused cut works '
          'better than trying to do both at once.',
  };
}
