// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $SetupsTable extends Setups with TableInfo<$SetupsTable, SetupRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SetupsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    check: () => id.equals(1),
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sexMeta = const VerificationMeta('sex');
  @override
  late final GeneratedColumn<String> sex = GeneratedColumn<String>(
    'sex',
    aliasedName,
    false,
    check: () => sex.isIn(const ['male', 'female']),
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _birthEpochDayMeta = const VerificationMeta(
    'birthEpochDay',
  );
  @override
  late final GeneratedColumn<int> birthEpochDay = GeneratedColumn<int>(
    'birth_epoch_day',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _heightCmMeta = const VerificationMeta(
    'heightCm',
  );
  @override
  late final GeneratedColumn<double> heightCm = GeneratedColumn<double>(
    'height_cm',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  @override
  late final GeneratedColumnWithTypeConverter<TrainingStatus, String>
  trainingStatus = GeneratedColumn<String>(
    'training_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  ).withConverter<TrainingStatus>($SetupsTable.$convertertrainingStatus);
  static const VerificationMeta _trainingDaysPerWeekMeta =
      const VerificationMeta('trainingDaysPerWeek');
  @override
  late final GeneratedColumn<int> trainingDaysPerWeek = GeneratedColumn<int>(
    'training_days_per_week',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _profileRevisionMeta = const VerificationMeta(
    'profileRevision',
  );
  @override
  late final GeneratedColumn<int> profileRevision = GeneratedColumn<int>(
    'profile_revision',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  @override
  late final GeneratedColumnWithTypeConverter<DailyActivity, String>
  dailyActivity = GeneratedColumn<String>(
    'daily_activity',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('light'),
  ).withConverter<DailyActivity>($SetupsTable.$converterdailyActivity);
  @override
  late final GeneratedColumnWithTypeConverter<GoalMode, String> goalMode =
      GeneratedColumn<String>(
        'goal_mode',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<GoalMode>($SetupsTable.$convertergoalMode);
  @override
  late final GeneratedColumnWithTypeConverter<UnitSystem, String> unitSystem =
      GeneratedColumn<String>(
        'unit_system',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<UnitSystem>($SetupsTable.$converterunitSystem);
  static const VerificationMeta _onboardedEpochDayMeta = const VerificationMeta(
    'onboardedEpochDay',
  );
  @override
  late final GeneratedColumn<int> onboardedEpochDay = GeneratedColumn<int>(
    'onboarded_epoch_day',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bodyFatPercentMeta = const VerificationMeta(
    'bodyFatPercent',
  );
  @override
  late final GeneratedColumn<double> bodyFatPercent = GeneratedColumn<double>(
    'body_fat_percent',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _requestedLossFractionMeta =
      const VerificationMeta('requestedLossFraction');
  @override
  late final GeneratedColumn<double> requestedLossFraction =
      GeneratedColumn<double>(
        'requested_loss_fraction',
        aliasedName,
        true,
        type: DriftSqlType.double,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _pregnantMeta = const VerificationMeta(
    'pregnant',
  );
  @override
  late final GeneratedColumn<bool> pregnant = GeneratedColumn<bool>(
    'pregnant',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("pregnant" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _breastfeedingMeta = const VerificationMeta(
    'breastfeeding',
  );
  @override
  late final GeneratedColumn<bool> breastfeeding = GeneratedColumn<bool>(
    'breastfeeding',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("breastfeeding" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _eatingDisorderHistoryMeta =
      const VerificationMeta('eatingDisorderHistory');
  @override
  late final GeneratedColumn<bool> eatingDisorderHistory =
      GeneratedColumn<bool>(
        'eating_disorder_history',
        aliasedName,
        false,
        type: DriftSqlType.bool,
        requiredDuringInsert: false,
        defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("eating_disorder_history" IN (0, 1))',
        ),
        defaultValue: const Constant(false),
      );
  static const VerificationMeta _chronicKidneyDiseaseMeta =
      const VerificationMeta('chronicKidneyDisease');
  @override
  late final GeneratedColumn<bool> chronicKidneyDisease = GeneratedColumn<bool>(
    'chronic_kidney_disease',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("chronic_kidney_disease" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _androgenUseMeta = const VerificationMeta(
    'androgenUse',
  );
  @override
  late final GeneratedColumn<bool> androgenUse = GeneratedColumn<bool>(
    'androgen_use',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("androgen_use" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _pcosMeta = const VerificationMeta('pcos');
  @override
  late final GeneratedColumn<bool> pcos = GeneratedColumn<bool>(
    'pcos',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("pcos" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _menopauseMeta = const VerificationMeta(
    'menopause',
  );
  @override
  late final GeneratedColumn<bool> menopause = GeneratedColumn<bool>(
    'menopause',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("menopause" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _thyroidConditionMeta = const VerificationMeta(
    'thyroidCondition',
  );
  @override
  late final GeneratedColumn<bool> thyroidCondition = GeneratedColumn<bool>(
    'thyroid_condition',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("thyroid_condition" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _insulinOrSulfonylureaMeta =
      const VerificationMeta('insulinOrSulfonylurea');
  @override
  late final GeneratedColumn<bool> insulinOrSulfonylurea =
      GeneratedColumn<bool>(
        'insulin_or_sulfonylurea',
        aliasedName,
        false,
        type: DriftSqlType.bool,
        requiredDuringInsert: false,
        defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("insulin_or_sulfonylurea" IN (0, 1))',
        ),
        defaultValue: const Constant(false),
      );
  static const VerificationMeta _insulinCareTeamConfirmedMeta =
      const VerificationMeta('insulinCareTeamConfirmed');
  @override
  late final GeneratedColumn<bool> insulinCareTeamConfirmed =
      GeneratedColumn<bool>(
        'insulin_care_team_confirmed',
        aliasedName,
        false,
        type: DriftSqlType.bool,
        requiredDuringInsert: false,
        defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("insulin_care_team_confirmed" IN (0, 1))',
        ),
        defaultValue: const Constant(false),
      );
  static const VerificationMeta _bariatricSurgeryMeta = const VerificationMeta(
    'bariatricSurgery',
  );
  @override
  late final GeneratedColumn<bool> bariatricSurgery = GeneratedColumn<bool>(
    'bariatric_surgery',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("bariatric_surgery" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _weightAffectingMedicationMeta =
      const VerificationMeta('weightAffectingMedication');
  @override
  late final GeneratedColumn<bool> weightAffectingMedication =
      GeneratedColumn<bool>(
        'weight_affecting_medication',
        aliasedName,
        false,
        type: DriftSqlType.bool,
        requiredDuringInsert: false,
        defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("weight_affecting_medication" IN (0, 1))',
        ),
        defaultValue: const Constant(false),
      );
  static const VerificationMeta _healthCheckConfirmedEpochDayMeta =
      const VerificationMeta('healthCheckConfirmedEpochDay');
  @override
  late final GeneratedColumn<int> healthCheckConfirmedEpochDay =
      GeneratedColumn<int>(
        'health_check_confirmed_epoch_day',
        aliasedName,
        true,
        type: DriftSqlType.int,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _healthCheckSkipCountMeta =
      const VerificationMeta('healthCheckSkipCount');
  @override
  late final GeneratedColumn<int> healthCheckSkipCount = GeneratedColumn<int>(
    'health_check_skip_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _creatineStartedEpochDayMeta =
      const VerificationMeta('creatineStartedEpochDay');
  @override
  late final GeneratedColumn<int> creatineStartedEpochDay =
      GeneratedColumn<int>(
        'creatine_started_epoch_day',
        aliasedName,
        true,
        type: DriftSqlType.int,
        requiredDuringInsert: false,
      );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    sex,
    birthEpochDay,
    heightCm,
    trainingStatus,
    trainingDaysPerWeek,
    profileRevision,
    dailyActivity,
    goalMode,
    unitSystem,
    onboardedEpochDay,
    bodyFatPercent,
    requestedLossFraction,
    pregnant,
    breastfeeding,
    eatingDisorderHistory,
    chronicKidneyDisease,
    androgenUse,
    pcos,
    menopause,
    thyroidCondition,
    insulinOrSulfonylurea,
    insulinCareTeamConfirmed,
    bariatricSurgery,
    weightAffectingMedication,
    healthCheckConfirmedEpochDay,
    healthCheckSkipCount,
    creatineStartedEpochDay,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'setups';
  @override
  VerificationContext validateIntegrity(
    Insertable<SetupRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('sex')) {
      context.handle(
        _sexMeta,
        sex.isAcceptableOrUnknown(data['sex']!, _sexMeta),
      );
    } else if (isInserting) {
      context.missing(_sexMeta);
    }
    if (data.containsKey('birth_epoch_day')) {
      context.handle(
        _birthEpochDayMeta,
        birthEpochDay.isAcceptableOrUnknown(
          data['birth_epoch_day']!,
          _birthEpochDayMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_birthEpochDayMeta);
    }
    if (data.containsKey('height_cm')) {
      context.handle(
        _heightCmMeta,
        heightCm.isAcceptableOrUnknown(data['height_cm']!, _heightCmMeta),
      );
    } else if (isInserting) {
      context.missing(_heightCmMeta);
    }
    if (data.containsKey('training_days_per_week')) {
      context.handle(
        _trainingDaysPerWeekMeta,
        trainingDaysPerWeek.isAcceptableOrUnknown(
          data['training_days_per_week']!,
          _trainingDaysPerWeekMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_trainingDaysPerWeekMeta);
    }
    if (data.containsKey('profile_revision')) {
      context.handle(
        _profileRevisionMeta,
        profileRevision.isAcceptableOrUnknown(
          data['profile_revision']!,
          _profileRevisionMeta,
        ),
      );
    }
    if (data.containsKey('onboarded_epoch_day')) {
      context.handle(
        _onboardedEpochDayMeta,
        onboardedEpochDay.isAcceptableOrUnknown(
          data['onboarded_epoch_day']!,
          _onboardedEpochDayMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_onboardedEpochDayMeta);
    }
    if (data.containsKey('body_fat_percent')) {
      context.handle(
        _bodyFatPercentMeta,
        bodyFatPercent.isAcceptableOrUnknown(
          data['body_fat_percent']!,
          _bodyFatPercentMeta,
        ),
      );
    }
    if (data.containsKey('requested_loss_fraction')) {
      context.handle(
        _requestedLossFractionMeta,
        requestedLossFraction.isAcceptableOrUnknown(
          data['requested_loss_fraction']!,
          _requestedLossFractionMeta,
        ),
      );
    }
    if (data.containsKey('pregnant')) {
      context.handle(
        _pregnantMeta,
        pregnant.isAcceptableOrUnknown(data['pregnant']!, _pregnantMeta),
      );
    }
    if (data.containsKey('breastfeeding')) {
      context.handle(
        _breastfeedingMeta,
        breastfeeding.isAcceptableOrUnknown(
          data['breastfeeding']!,
          _breastfeedingMeta,
        ),
      );
    }
    if (data.containsKey('eating_disorder_history')) {
      context.handle(
        _eatingDisorderHistoryMeta,
        eatingDisorderHistory.isAcceptableOrUnknown(
          data['eating_disorder_history']!,
          _eatingDisorderHistoryMeta,
        ),
      );
    }
    if (data.containsKey('chronic_kidney_disease')) {
      context.handle(
        _chronicKidneyDiseaseMeta,
        chronicKidneyDisease.isAcceptableOrUnknown(
          data['chronic_kidney_disease']!,
          _chronicKidneyDiseaseMeta,
        ),
      );
    }
    if (data.containsKey('androgen_use')) {
      context.handle(
        _androgenUseMeta,
        androgenUse.isAcceptableOrUnknown(
          data['androgen_use']!,
          _androgenUseMeta,
        ),
      );
    }
    if (data.containsKey('pcos')) {
      context.handle(
        _pcosMeta,
        pcos.isAcceptableOrUnknown(data['pcos']!, _pcosMeta),
      );
    }
    if (data.containsKey('menopause')) {
      context.handle(
        _menopauseMeta,
        menopause.isAcceptableOrUnknown(data['menopause']!, _menopauseMeta),
      );
    }
    if (data.containsKey('thyroid_condition')) {
      context.handle(
        _thyroidConditionMeta,
        thyroidCondition.isAcceptableOrUnknown(
          data['thyroid_condition']!,
          _thyroidConditionMeta,
        ),
      );
    }
    if (data.containsKey('insulin_or_sulfonylurea')) {
      context.handle(
        _insulinOrSulfonylureaMeta,
        insulinOrSulfonylurea.isAcceptableOrUnknown(
          data['insulin_or_sulfonylurea']!,
          _insulinOrSulfonylureaMeta,
        ),
      );
    }
    if (data.containsKey('insulin_care_team_confirmed')) {
      context.handle(
        _insulinCareTeamConfirmedMeta,
        insulinCareTeamConfirmed.isAcceptableOrUnknown(
          data['insulin_care_team_confirmed']!,
          _insulinCareTeamConfirmedMeta,
        ),
      );
    }
    if (data.containsKey('bariatric_surgery')) {
      context.handle(
        _bariatricSurgeryMeta,
        bariatricSurgery.isAcceptableOrUnknown(
          data['bariatric_surgery']!,
          _bariatricSurgeryMeta,
        ),
      );
    }
    if (data.containsKey('weight_affecting_medication')) {
      context.handle(
        _weightAffectingMedicationMeta,
        weightAffectingMedication.isAcceptableOrUnknown(
          data['weight_affecting_medication']!,
          _weightAffectingMedicationMeta,
        ),
      );
    }
    if (data.containsKey('health_check_confirmed_epoch_day')) {
      context.handle(
        _healthCheckConfirmedEpochDayMeta,
        healthCheckConfirmedEpochDay.isAcceptableOrUnknown(
          data['health_check_confirmed_epoch_day']!,
          _healthCheckConfirmedEpochDayMeta,
        ),
      );
    }
    if (data.containsKey('health_check_skip_count')) {
      context.handle(
        _healthCheckSkipCountMeta,
        healthCheckSkipCount.isAcceptableOrUnknown(
          data['health_check_skip_count']!,
          _healthCheckSkipCountMeta,
        ),
      );
    }
    if (data.containsKey('creatine_started_epoch_day')) {
      context.handle(
        _creatineStartedEpochDayMeta,
        creatineStartedEpochDay.isAcceptableOrUnknown(
          data['creatine_started_epoch_day']!,
          _creatineStartedEpochDayMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SetupRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SetupRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      sex: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sex'],
      )!,
      birthEpochDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}birth_epoch_day'],
      )!,
      heightCm: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}height_cm'],
      )!,
      trainingStatus: $SetupsTable.$convertertrainingStatus.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}training_status'],
        )!,
      ),
      trainingDaysPerWeek: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}training_days_per_week'],
      )!,
      profileRevision: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}profile_revision'],
      )!,
      dailyActivity: $SetupsTable.$converterdailyActivity.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}daily_activity'],
        )!,
      ),
      goalMode: $SetupsTable.$convertergoalMode.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}goal_mode'],
        )!,
      ),
      unitSystem: $SetupsTable.$converterunitSystem.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}unit_system'],
        )!,
      ),
      onboardedEpochDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}onboarded_epoch_day'],
      )!,
      bodyFatPercent: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}body_fat_percent'],
      ),
      requestedLossFraction: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}requested_loss_fraction'],
      ),
      pregnant: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}pregnant'],
      )!,
      breastfeeding: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}breastfeeding'],
      )!,
      eatingDisorderHistory: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}eating_disorder_history'],
      )!,
      chronicKidneyDisease: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}chronic_kidney_disease'],
      )!,
      androgenUse: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}androgen_use'],
      )!,
      pcos: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}pcos'],
      )!,
      menopause: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}menopause'],
      )!,
      thyroidCondition: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}thyroid_condition'],
      )!,
      insulinOrSulfonylurea: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}insulin_or_sulfonylurea'],
      )!,
      insulinCareTeamConfirmed: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}insulin_care_team_confirmed'],
      )!,
      bariatricSurgery: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}bariatric_surgery'],
      )!,
      weightAffectingMedication: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}weight_affecting_medication'],
      )!,
      healthCheckConfirmedEpochDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}health_check_confirmed_epoch_day'],
      ),
      healthCheckSkipCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}health_check_skip_count'],
      )!,
      creatineStartedEpochDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}creatine_started_epoch_day'],
      ),
    );
  }

  @override
  $SetupsTable createAlias(String alias) {
    return $SetupsTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<TrainingStatus, String, String>
  $convertertrainingStatus = const EnumNameConverter<TrainingStatus>(
    TrainingStatus.values,
  );
  static JsonTypeConverter2<DailyActivity, String, String>
  $converterdailyActivity = const EnumNameConverter<DailyActivity>(
    DailyActivity.values,
  );
  static JsonTypeConverter2<GoalMode, String, String> $convertergoalMode =
      const EnumNameConverter<GoalMode>(GoalMode.values);
  static JsonTypeConverter2<UnitSystem, String, String> $converterunitSystem =
      const EnumNameConverter<UnitSystem>(UnitSystem.values);
}

class SetupRow extends DataClass implements Insertable<SetupRow> {
  final int id;

  /// Biological sex. Constrained in the schema itself: no other value can
  /// ever be stored, and there is no default.
  final String sex;
  final int birthEpochDay;
  final double heightCm;
  final TrainingStatus trainingStatus;
  final int trainingDaysPerWeek;

  /// Added in schema version 4 (MM-83); existing rows read as 0.
  final int profileRevision;

  /// Added in schema version 2 (MM-164); existing rows read as `light`.
  final DailyActivity dailyActivity;
  final GoalMode goalMode;
  final UnitSystem unitSystem;
  final int onboardedEpochDay;
  final double? bodyFatPercent;
  final double? requestedLossFraction;
  final bool pregnant;
  final bool breastfeeding;
  final bool eatingDisorderHistory;
  final bool chronicKidneyDisease;
  final bool androgenUse;
  final bool pcos;
  final bool menopause;
  final bool thyroidCondition;
  final bool insulinOrSulfonylurea;
  final bool insulinCareTeamConfirmed;
  final bool bariatricSurgery;
  final bool weightAffectingMedication;
  final int? healthCheckConfirmedEpochDay;
  final int healthCheckSkipCount;
  final int? creatineStartedEpochDay;
  const SetupRow({
    required this.id,
    required this.sex,
    required this.birthEpochDay,
    required this.heightCm,
    required this.trainingStatus,
    required this.trainingDaysPerWeek,
    required this.profileRevision,
    required this.dailyActivity,
    required this.goalMode,
    required this.unitSystem,
    required this.onboardedEpochDay,
    this.bodyFatPercent,
    this.requestedLossFraction,
    required this.pregnant,
    required this.breastfeeding,
    required this.eatingDisorderHistory,
    required this.chronicKidneyDisease,
    required this.androgenUse,
    required this.pcos,
    required this.menopause,
    required this.thyroidCondition,
    required this.insulinOrSulfonylurea,
    required this.insulinCareTeamConfirmed,
    required this.bariatricSurgery,
    required this.weightAffectingMedication,
    this.healthCheckConfirmedEpochDay,
    required this.healthCheckSkipCount,
    this.creatineStartedEpochDay,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['sex'] = Variable<String>(sex);
    map['birth_epoch_day'] = Variable<int>(birthEpochDay);
    map['height_cm'] = Variable<double>(heightCm);
    {
      map['training_status'] = Variable<String>(
        $SetupsTable.$convertertrainingStatus.toSql(trainingStatus),
      );
    }
    map['training_days_per_week'] = Variable<int>(trainingDaysPerWeek);
    map['profile_revision'] = Variable<int>(profileRevision);
    {
      map['daily_activity'] = Variable<String>(
        $SetupsTable.$converterdailyActivity.toSql(dailyActivity),
      );
    }
    {
      map['goal_mode'] = Variable<String>(
        $SetupsTable.$convertergoalMode.toSql(goalMode),
      );
    }
    {
      map['unit_system'] = Variable<String>(
        $SetupsTable.$converterunitSystem.toSql(unitSystem),
      );
    }
    map['onboarded_epoch_day'] = Variable<int>(onboardedEpochDay);
    if (!nullToAbsent || bodyFatPercent != null) {
      map['body_fat_percent'] = Variable<double>(bodyFatPercent);
    }
    if (!nullToAbsent || requestedLossFraction != null) {
      map['requested_loss_fraction'] = Variable<double>(requestedLossFraction);
    }
    map['pregnant'] = Variable<bool>(pregnant);
    map['breastfeeding'] = Variable<bool>(breastfeeding);
    map['eating_disorder_history'] = Variable<bool>(eatingDisorderHistory);
    map['chronic_kidney_disease'] = Variable<bool>(chronicKidneyDisease);
    map['androgen_use'] = Variable<bool>(androgenUse);
    map['pcos'] = Variable<bool>(pcos);
    map['menopause'] = Variable<bool>(menopause);
    map['thyroid_condition'] = Variable<bool>(thyroidCondition);
    map['insulin_or_sulfonylurea'] = Variable<bool>(insulinOrSulfonylurea);
    map['insulin_care_team_confirmed'] = Variable<bool>(
      insulinCareTeamConfirmed,
    );
    map['bariatric_surgery'] = Variable<bool>(bariatricSurgery);
    map['weight_affecting_medication'] = Variable<bool>(
      weightAffectingMedication,
    );
    if (!nullToAbsent || healthCheckConfirmedEpochDay != null) {
      map['health_check_confirmed_epoch_day'] = Variable<int>(
        healthCheckConfirmedEpochDay,
      );
    }
    map['health_check_skip_count'] = Variable<int>(healthCheckSkipCount);
    if (!nullToAbsent || creatineStartedEpochDay != null) {
      map['creatine_started_epoch_day'] = Variable<int>(
        creatineStartedEpochDay,
      );
    }
    return map;
  }

  SetupsCompanion toCompanion(bool nullToAbsent) {
    return SetupsCompanion(
      id: Value(id),
      sex: Value(sex),
      birthEpochDay: Value(birthEpochDay),
      heightCm: Value(heightCm),
      trainingStatus: Value(trainingStatus),
      trainingDaysPerWeek: Value(trainingDaysPerWeek),
      profileRevision: Value(profileRevision),
      dailyActivity: Value(dailyActivity),
      goalMode: Value(goalMode),
      unitSystem: Value(unitSystem),
      onboardedEpochDay: Value(onboardedEpochDay),
      bodyFatPercent: bodyFatPercent == null && nullToAbsent
          ? const Value.absent()
          : Value(bodyFatPercent),
      requestedLossFraction: requestedLossFraction == null && nullToAbsent
          ? const Value.absent()
          : Value(requestedLossFraction),
      pregnant: Value(pregnant),
      breastfeeding: Value(breastfeeding),
      eatingDisorderHistory: Value(eatingDisorderHistory),
      chronicKidneyDisease: Value(chronicKidneyDisease),
      androgenUse: Value(androgenUse),
      pcos: Value(pcos),
      menopause: Value(menopause),
      thyroidCondition: Value(thyroidCondition),
      insulinOrSulfonylurea: Value(insulinOrSulfonylurea),
      insulinCareTeamConfirmed: Value(insulinCareTeamConfirmed),
      bariatricSurgery: Value(bariatricSurgery),
      weightAffectingMedication: Value(weightAffectingMedication),
      healthCheckConfirmedEpochDay:
          healthCheckConfirmedEpochDay == null && nullToAbsent
          ? const Value.absent()
          : Value(healthCheckConfirmedEpochDay),
      healthCheckSkipCount: Value(healthCheckSkipCount),
      creatineStartedEpochDay: creatineStartedEpochDay == null && nullToAbsent
          ? const Value.absent()
          : Value(creatineStartedEpochDay),
    );
  }

  factory SetupRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SetupRow(
      id: serializer.fromJson<int>(json['id']),
      sex: serializer.fromJson<String>(json['sex']),
      birthEpochDay: serializer.fromJson<int>(json['birthEpochDay']),
      heightCm: serializer.fromJson<double>(json['heightCm']),
      trainingStatus: $SetupsTable.$convertertrainingStatus.fromJson(
        serializer.fromJson<String>(json['trainingStatus']),
      ),
      trainingDaysPerWeek: serializer.fromJson<int>(
        json['trainingDaysPerWeek'],
      ),
      profileRevision: serializer.fromJson<int>(json['profileRevision']),
      dailyActivity: $SetupsTable.$converterdailyActivity.fromJson(
        serializer.fromJson<String>(json['dailyActivity']),
      ),
      goalMode: $SetupsTable.$convertergoalMode.fromJson(
        serializer.fromJson<String>(json['goalMode']),
      ),
      unitSystem: $SetupsTable.$converterunitSystem.fromJson(
        serializer.fromJson<String>(json['unitSystem']),
      ),
      onboardedEpochDay: serializer.fromJson<int>(json['onboardedEpochDay']),
      bodyFatPercent: serializer.fromJson<double?>(json['bodyFatPercent']),
      requestedLossFraction: serializer.fromJson<double?>(
        json['requestedLossFraction'],
      ),
      pregnant: serializer.fromJson<bool>(json['pregnant']),
      breastfeeding: serializer.fromJson<bool>(json['breastfeeding']),
      eatingDisorderHistory: serializer.fromJson<bool>(
        json['eatingDisorderHistory'],
      ),
      chronicKidneyDisease: serializer.fromJson<bool>(
        json['chronicKidneyDisease'],
      ),
      androgenUse: serializer.fromJson<bool>(json['androgenUse']),
      pcos: serializer.fromJson<bool>(json['pcos']),
      menopause: serializer.fromJson<bool>(json['menopause']),
      thyroidCondition: serializer.fromJson<bool>(json['thyroidCondition']),
      insulinOrSulfonylurea: serializer.fromJson<bool>(
        json['insulinOrSulfonylurea'],
      ),
      insulinCareTeamConfirmed: serializer.fromJson<bool>(
        json['insulinCareTeamConfirmed'],
      ),
      bariatricSurgery: serializer.fromJson<bool>(json['bariatricSurgery']),
      weightAffectingMedication: serializer.fromJson<bool>(
        json['weightAffectingMedication'],
      ),
      healthCheckConfirmedEpochDay: serializer.fromJson<int?>(
        json['healthCheckConfirmedEpochDay'],
      ),
      healthCheckSkipCount: serializer.fromJson<int>(
        json['healthCheckSkipCount'],
      ),
      creatineStartedEpochDay: serializer.fromJson<int?>(
        json['creatineStartedEpochDay'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'sex': serializer.toJson<String>(sex),
      'birthEpochDay': serializer.toJson<int>(birthEpochDay),
      'heightCm': serializer.toJson<double>(heightCm),
      'trainingStatus': serializer.toJson<String>(
        $SetupsTable.$convertertrainingStatus.toJson(trainingStatus),
      ),
      'trainingDaysPerWeek': serializer.toJson<int>(trainingDaysPerWeek),
      'profileRevision': serializer.toJson<int>(profileRevision),
      'dailyActivity': serializer.toJson<String>(
        $SetupsTable.$converterdailyActivity.toJson(dailyActivity),
      ),
      'goalMode': serializer.toJson<String>(
        $SetupsTable.$convertergoalMode.toJson(goalMode),
      ),
      'unitSystem': serializer.toJson<String>(
        $SetupsTable.$converterunitSystem.toJson(unitSystem),
      ),
      'onboardedEpochDay': serializer.toJson<int>(onboardedEpochDay),
      'bodyFatPercent': serializer.toJson<double?>(bodyFatPercent),
      'requestedLossFraction': serializer.toJson<double?>(
        requestedLossFraction,
      ),
      'pregnant': serializer.toJson<bool>(pregnant),
      'breastfeeding': serializer.toJson<bool>(breastfeeding),
      'eatingDisorderHistory': serializer.toJson<bool>(eatingDisorderHistory),
      'chronicKidneyDisease': serializer.toJson<bool>(chronicKidneyDisease),
      'androgenUse': serializer.toJson<bool>(androgenUse),
      'pcos': serializer.toJson<bool>(pcos),
      'menopause': serializer.toJson<bool>(menopause),
      'thyroidCondition': serializer.toJson<bool>(thyroidCondition),
      'insulinOrSulfonylurea': serializer.toJson<bool>(insulinOrSulfonylurea),
      'insulinCareTeamConfirmed': serializer.toJson<bool>(
        insulinCareTeamConfirmed,
      ),
      'bariatricSurgery': serializer.toJson<bool>(bariatricSurgery),
      'weightAffectingMedication': serializer.toJson<bool>(
        weightAffectingMedication,
      ),
      'healthCheckConfirmedEpochDay': serializer.toJson<int?>(
        healthCheckConfirmedEpochDay,
      ),
      'healthCheckSkipCount': serializer.toJson<int>(healthCheckSkipCount),
      'creatineStartedEpochDay': serializer.toJson<int?>(
        creatineStartedEpochDay,
      ),
    };
  }

  SetupRow copyWith({
    int? id,
    String? sex,
    int? birthEpochDay,
    double? heightCm,
    TrainingStatus? trainingStatus,
    int? trainingDaysPerWeek,
    int? profileRevision,
    DailyActivity? dailyActivity,
    GoalMode? goalMode,
    UnitSystem? unitSystem,
    int? onboardedEpochDay,
    Value<double?> bodyFatPercent = const Value.absent(),
    Value<double?> requestedLossFraction = const Value.absent(),
    bool? pregnant,
    bool? breastfeeding,
    bool? eatingDisorderHistory,
    bool? chronicKidneyDisease,
    bool? androgenUse,
    bool? pcos,
    bool? menopause,
    bool? thyroidCondition,
    bool? insulinOrSulfonylurea,
    bool? insulinCareTeamConfirmed,
    bool? bariatricSurgery,
    bool? weightAffectingMedication,
    Value<int?> healthCheckConfirmedEpochDay = const Value.absent(),
    int? healthCheckSkipCount,
    Value<int?> creatineStartedEpochDay = const Value.absent(),
  }) => SetupRow(
    id: id ?? this.id,
    sex: sex ?? this.sex,
    birthEpochDay: birthEpochDay ?? this.birthEpochDay,
    heightCm: heightCm ?? this.heightCm,
    trainingStatus: trainingStatus ?? this.trainingStatus,
    trainingDaysPerWeek: trainingDaysPerWeek ?? this.trainingDaysPerWeek,
    profileRevision: profileRevision ?? this.profileRevision,
    dailyActivity: dailyActivity ?? this.dailyActivity,
    goalMode: goalMode ?? this.goalMode,
    unitSystem: unitSystem ?? this.unitSystem,
    onboardedEpochDay: onboardedEpochDay ?? this.onboardedEpochDay,
    bodyFatPercent: bodyFatPercent.present
        ? bodyFatPercent.value
        : this.bodyFatPercent,
    requestedLossFraction: requestedLossFraction.present
        ? requestedLossFraction.value
        : this.requestedLossFraction,
    pregnant: pregnant ?? this.pregnant,
    breastfeeding: breastfeeding ?? this.breastfeeding,
    eatingDisorderHistory: eatingDisorderHistory ?? this.eatingDisorderHistory,
    chronicKidneyDisease: chronicKidneyDisease ?? this.chronicKidneyDisease,
    androgenUse: androgenUse ?? this.androgenUse,
    pcos: pcos ?? this.pcos,
    menopause: menopause ?? this.menopause,
    thyroidCondition: thyroidCondition ?? this.thyroidCondition,
    insulinOrSulfonylurea: insulinOrSulfonylurea ?? this.insulinOrSulfonylurea,
    insulinCareTeamConfirmed:
        insulinCareTeamConfirmed ?? this.insulinCareTeamConfirmed,
    bariatricSurgery: bariatricSurgery ?? this.bariatricSurgery,
    weightAffectingMedication:
        weightAffectingMedication ?? this.weightAffectingMedication,
    healthCheckConfirmedEpochDay: healthCheckConfirmedEpochDay.present
        ? healthCheckConfirmedEpochDay.value
        : this.healthCheckConfirmedEpochDay,
    healthCheckSkipCount: healthCheckSkipCount ?? this.healthCheckSkipCount,
    creatineStartedEpochDay: creatineStartedEpochDay.present
        ? creatineStartedEpochDay.value
        : this.creatineStartedEpochDay,
  );
  SetupRow copyWithCompanion(SetupsCompanion data) {
    return SetupRow(
      id: data.id.present ? data.id.value : this.id,
      sex: data.sex.present ? data.sex.value : this.sex,
      birthEpochDay: data.birthEpochDay.present
          ? data.birthEpochDay.value
          : this.birthEpochDay,
      heightCm: data.heightCm.present ? data.heightCm.value : this.heightCm,
      trainingStatus: data.trainingStatus.present
          ? data.trainingStatus.value
          : this.trainingStatus,
      trainingDaysPerWeek: data.trainingDaysPerWeek.present
          ? data.trainingDaysPerWeek.value
          : this.trainingDaysPerWeek,
      profileRevision: data.profileRevision.present
          ? data.profileRevision.value
          : this.profileRevision,
      dailyActivity: data.dailyActivity.present
          ? data.dailyActivity.value
          : this.dailyActivity,
      goalMode: data.goalMode.present ? data.goalMode.value : this.goalMode,
      unitSystem: data.unitSystem.present
          ? data.unitSystem.value
          : this.unitSystem,
      onboardedEpochDay: data.onboardedEpochDay.present
          ? data.onboardedEpochDay.value
          : this.onboardedEpochDay,
      bodyFatPercent: data.bodyFatPercent.present
          ? data.bodyFatPercent.value
          : this.bodyFatPercent,
      requestedLossFraction: data.requestedLossFraction.present
          ? data.requestedLossFraction.value
          : this.requestedLossFraction,
      pregnant: data.pregnant.present ? data.pregnant.value : this.pregnant,
      breastfeeding: data.breastfeeding.present
          ? data.breastfeeding.value
          : this.breastfeeding,
      eatingDisorderHistory: data.eatingDisorderHistory.present
          ? data.eatingDisorderHistory.value
          : this.eatingDisorderHistory,
      chronicKidneyDisease: data.chronicKidneyDisease.present
          ? data.chronicKidneyDisease.value
          : this.chronicKidneyDisease,
      androgenUse: data.androgenUse.present
          ? data.androgenUse.value
          : this.androgenUse,
      pcos: data.pcos.present ? data.pcos.value : this.pcos,
      menopause: data.menopause.present ? data.menopause.value : this.menopause,
      thyroidCondition: data.thyroidCondition.present
          ? data.thyroidCondition.value
          : this.thyroidCondition,
      insulinOrSulfonylurea: data.insulinOrSulfonylurea.present
          ? data.insulinOrSulfonylurea.value
          : this.insulinOrSulfonylurea,
      insulinCareTeamConfirmed: data.insulinCareTeamConfirmed.present
          ? data.insulinCareTeamConfirmed.value
          : this.insulinCareTeamConfirmed,
      bariatricSurgery: data.bariatricSurgery.present
          ? data.bariatricSurgery.value
          : this.bariatricSurgery,
      weightAffectingMedication: data.weightAffectingMedication.present
          ? data.weightAffectingMedication.value
          : this.weightAffectingMedication,
      healthCheckConfirmedEpochDay: data.healthCheckConfirmedEpochDay.present
          ? data.healthCheckConfirmedEpochDay.value
          : this.healthCheckConfirmedEpochDay,
      healthCheckSkipCount: data.healthCheckSkipCount.present
          ? data.healthCheckSkipCount.value
          : this.healthCheckSkipCount,
      creatineStartedEpochDay: data.creatineStartedEpochDay.present
          ? data.creatineStartedEpochDay.value
          : this.creatineStartedEpochDay,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SetupRow(')
          ..write('id: $id, ')
          ..write('sex: $sex, ')
          ..write('birthEpochDay: $birthEpochDay, ')
          ..write('heightCm: $heightCm, ')
          ..write('trainingStatus: $trainingStatus, ')
          ..write('trainingDaysPerWeek: $trainingDaysPerWeek, ')
          ..write('profileRevision: $profileRevision, ')
          ..write('dailyActivity: $dailyActivity, ')
          ..write('goalMode: $goalMode, ')
          ..write('unitSystem: $unitSystem, ')
          ..write('onboardedEpochDay: $onboardedEpochDay, ')
          ..write('bodyFatPercent: $bodyFatPercent, ')
          ..write('requestedLossFraction: $requestedLossFraction, ')
          ..write('pregnant: $pregnant, ')
          ..write('breastfeeding: $breastfeeding, ')
          ..write('eatingDisorderHistory: $eatingDisorderHistory, ')
          ..write('chronicKidneyDisease: $chronicKidneyDisease, ')
          ..write('androgenUse: $androgenUse, ')
          ..write('pcos: $pcos, ')
          ..write('menopause: $menopause, ')
          ..write('thyroidCondition: $thyroidCondition, ')
          ..write('insulinOrSulfonylurea: $insulinOrSulfonylurea, ')
          ..write('insulinCareTeamConfirmed: $insulinCareTeamConfirmed, ')
          ..write('bariatricSurgery: $bariatricSurgery, ')
          ..write('weightAffectingMedication: $weightAffectingMedication, ')
          ..write(
            'healthCheckConfirmedEpochDay: $healthCheckConfirmedEpochDay, ',
          )
          ..write('healthCheckSkipCount: $healthCheckSkipCount, ')
          ..write('creatineStartedEpochDay: $creatineStartedEpochDay')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
    id,
    sex,
    birthEpochDay,
    heightCm,
    trainingStatus,
    trainingDaysPerWeek,
    profileRevision,
    dailyActivity,
    goalMode,
    unitSystem,
    onboardedEpochDay,
    bodyFatPercent,
    requestedLossFraction,
    pregnant,
    breastfeeding,
    eatingDisorderHistory,
    chronicKidneyDisease,
    androgenUse,
    pcos,
    menopause,
    thyroidCondition,
    insulinOrSulfonylurea,
    insulinCareTeamConfirmed,
    bariatricSurgery,
    weightAffectingMedication,
    healthCheckConfirmedEpochDay,
    healthCheckSkipCount,
    creatineStartedEpochDay,
  ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SetupRow &&
          other.id == this.id &&
          other.sex == this.sex &&
          other.birthEpochDay == this.birthEpochDay &&
          other.heightCm == this.heightCm &&
          other.trainingStatus == this.trainingStatus &&
          other.trainingDaysPerWeek == this.trainingDaysPerWeek &&
          other.profileRevision == this.profileRevision &&
          other.dailyActivity == this.dailyActivity &&
          other.goalMode == this.goalMode &&
          other.unitSystem == this.unitSystem &&
          other.onboardedEpochDay == this.onboardedEpochDay &&
          other.bodyFatPercent == this.bodyFatPercent &&
          other.requestedLossFraction == this.requestedLossFraction &&
          other.pregnant == this.pregnant &&
          other.breastfeeding == this.breastfeeding &&
          other.eatingDisorderHistory == this.eatingDisorderHistory &&
          other.chronicKidneyDisease == this.chronicKidneyDisease &&
          other.androgenUse == this.androgenUse &&
          other.pcos == this.pcos &&
          other.menopause == this.menopause &&
          other.thyroidCondition == this.thyroidCondition &&
          other.insulinOrSulfonylurea == this.insulinOrSulfonylurea &&
          other.insulinCareTeamConfirmed == this.insulinCareTeamConfirmed &&
          other.bariatricSurgery == this.bariatricSurgery &&
          other.weightAffectingMedication == this.weightAffectingMedication &&
          other.healthCheckConfirmedEpochDay ==
              this.healthCheckConfirmedEpochDay &&
          other.healthCheckSkipCount == this.healthCheckSkipCount &&
          other.creatineStartedEpochDay == this.creatineStartedEpochDay);
}

class SetupsCompanion extends UpdateCompanion<SetupRow> {
  final Value<int> id;
  final Value<String> sex;
  final Value<int> birthEpochDay;
  final Value<double> heightCm;
  final Value<TrainingStatus> trainingStatus;
  final Value<int> trainingDaysPerWeek;
  final Value<int> profileRevision;
  final Value<DailyActivity> dailyActivity;
  final Value<GoalMode> goalMode;
  final Value<UnitSystem> unitSystem;
  final Value<int> onboardedEpochDay;
  final Value<double?> bodyFatPercent;
  final Value<double?> requestedLossFraction;
  final Value<bool> pregnant;
  final Value<bool> breastfeeding;
  final Value<bool> eatingDisorderHistory;
  final Value<bool> chronicKidneyDisease;
  final Value<bool> androgenUse;
  final Value<bool> pcos;
  final Value<bool> menopause;
  final Value<bool> thyroidCondition;
  final Value<bool> insulinOrSulfonylurea;
  final Value<bool> insulinCareTeamConfirmed;
  final Value<bool> bariatricSurgery;
  final Value<bool> weightAffectingMedication;
  final Value<int?> healthCheckConfirmedEpochDay;
  final Value<int> healthCheckSkipCount;
  final Value<int?> creatineStartedEpochDay;
  const SetupsCompanion({
    this.id = const Value.absent(),
    this.sex = const Value.absent(),
    this.birthEpochDay = const Value.absent(),
    this.heightCm = const Value.absent(),
    this.trainingStatus = const Value.absent(),
    this.trainingDaysPerWeek = const Value.absent(),
    this.profileRevision = const Value.absent(),
    this.dailyActivity = const Value.absent(),
    this.goalMode = const Value.absent(),
    this.unitSystem = const Value.absent(),
    this.onboardedEpochDay = const Value.absent(),
    this.bodyFatPercent = const Value.absent(),
    this.requestedLossFraction = const Value.absent(),
    this.pregnant = const Value.absent(),
    this.breastfeeding = const Value.absent(),
    this.eatingDisorderHistory = const Value.absent(),
    this.chronicKidneyDisease = const Value.absent(),
    this.androgenUse = const Value.absent(),
    this.pcos = const Value.absent(),
    this.menopause = const Value.absent(),
    this.thyroidCondition = const Value.absent(),
    this.insulinOrSulfonylurea = const Value.absent(),
    this.insulinCareTeamConfirmed = const Value.absent(),
    this.bariatricSurgery = const Value.absent(),
    this.weightAffectingMedication = const Value.absent(),
    this.healthCheckConfirmedEpochDay = const Value.absent(),
    this.healthCheckSkipCount = const Value.absent(),
    this.creatineStartedEpochDay = const Value.absent(),
  });
  SetupsCompanion.insert({
    this.id = const Value.absent(),
    required String sex,
    required int birthEpochDay,
    required double heightCm,
    required TrainingStatus trainingStatus,
    required int trainingDaysPerWeek,
    this.profileRevision = const Value.absent(),
    this.dailyActivity = const Value.absent(),
    required GoalMode goalMode,
    required UnitSystem unitSystem,
    required int onboardedEpochDay,
    this.bodyFatPercent = const Value.absent(),
    this.requestedLossFraction = const Value.absent(),
    this.pregnant = const Value.absent(),
    this.breastfeeding = const Value.absent(),
    this.eatingDisorderHistory = const Value.absent(),
    this.chronicKidneyDisease = const Value.absent(),
    this.androgenUse = const Value.absent(),
    this.pcos = const Value.absent(),
    this.menopause = const Value.absent(),
    this.thyroidCondition = const Value.absent(),
    this.insulinOrSulfonylurea = const Value.absent(),
    this.insulinCareTeamConfirmed = const Value.absent(),
    this.bariatricSurgery = const Value.absent(),
    this.weightAffectingMedication = const Value.absent(),
    this.healthCheckConfirmedEpochDay = const Value.absent(),
    this.healthCheckSkipCount = const Value.absent(),
    this.creatineStartedEpochDay = const Value.absent(),
  }) : sex = Value(sex),
       birthEpochDay = Value(birthEpochDay),
       heightCm = Value(heightCm),
       trainingStatus = Value(trainingStatus),
       trainingDaysPerWeek = Value(trainingDaysPerWeek),
       goalMode = Value(goalMode),
       unitSystem = Value(unitSystem),
       onboardedEpochDay = Value(onboardedEpochDay);
  static Insertable<SetupRow> custom({
    Expression<int>? id,
    Expression<String>? sex,
    Expression<int>? birthEpochDay,
    Expression<double>? heightCm,
    Expression<String>? trainingStatus,
    Expression<int>? trainingDaysPerWeek,
    Expression<int>? profileRevision,
    Expression<String>? dailyActivity,
    Expression<String>? goalMode,
    Expression<String>? unitSystem,
    Expression<int>? onboardedEpochDay,
    Expression<double>? bodyFatPercent,
    Expression<double>? requestedLossFraction,
    Expression<bool>? pregnant,
    Expression<bool>? breastfeeding,
    Expression<bool>? eatingDisorderHistory,
    Expression<bool>? chronicKidneyDisease,
    Expression<bool>? androgenUse,
    Expression<bool>? pcos,
    Expression<bool>? menopause,
    Expression<bool>? thyroidCondition,
    Expression<bool>? insulinOrSulfonylurea,
    Expression<bool>? insulinCareTeamConfirmed,
    Expression<bool>? bariatricSurgery,
    Expression<bool>? weightAffectingMedication,
    Expression<int>? healthCheckConfirmedEpochDay,
    Expression<int>? healthCheckSkipCount,
    Expression<int>? creatineStartedEpochDay,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (sex != null) 'sex': sex,
      if (birthEpochDay != null) 'birth_epoch_day': birthEpochDay,
      if (heightCm != null) 'height_cm': heightCm,
      if (trainingStatus != null) 'training_status': trainingStatus,
      if (trainingDaysPerWeek != null)
        'training_days_per_week': trainingDaysPerWeek,
      if (profileRevision != null) 'profile_revision': profileRevision,
      if (dailyActivity != null) 'daily_activity': dailyActivity,
      if (goalMode != null) 'goal_mode': goalMode,
      if (unitSystem != null) 'unit_system': unitSystem,
      if (onboardedEpochDay != null) 'onboarded_epoch_day': onboardedEpochDay,
      if (bodyFatPercent != null) 'body_fat_percent': bodyFatPercent,
      if (requestedLossFraction != null)
        'requested_loss_fraction': requestedLossFraction,
      if (pregnant != null) 'pregnant': pregnant,
      if (breastfeeding != null) 'breastfeeding': breastfeeding,
      if (eatingDisorderHistory != null)
        'eating_disorder_history': eatingDisorderHistory,
      if (chronicKidneyDisease != null)
        'chronic_kidney_disease': chronicKidneyDisease,
      if (androgenUse != null) 'androgen_use': androgenUse,
      if (pcos != null) 'pcos': pcos,
      if (menopause != null) 'menopause': menopause,
      if (thyroidCondition != null) 'thyroid_condition': thyroidCondition,
      if (insulinOrSulfonylurea != null)
        'insulin_or_sulfonylurea': insulinOrSulfonylurea,
      if (insulinCareTeamConfirmed != null)
        'insulin_care_team_confirmed': insulinCareTeamConfirmed,
      if (bariatricSurgery != null) 'bariatric_surgery': bariatricSurgery,
      if (weightAffectingMedication != null)
        'weight_affecting_medication': weightAffectingMedication,
      if (healthCheckConfirmedEpochDay != null)
        'health_check_confirmed_epoch_day': healthCheckConfirmedEpochDay,
      if (healthCheckSkipCount != null)
        'health_check_skip_count': healthCheckSkipCount,
      if (creatineStartedEpochDay != null)
        'creatine_started_epoch_day': creatineStartedEpochDay,
    });
  }

  SetupsCompanion copyWith({
    Value<int>? id,
    Value<String>? sex,
    Value<int>? birthEpochDay,
    Value<double>? heightCm,
    Value<TrainingStatus>? trainingStatus,
    Value<int>? trainingDaysPerWeek,
    Value<int>? profileRevision,
    Value<DailyActivity>? dailyActivity,
    Value<GoalMode>? goalMode,
    Value<UnitSystem>? unitSystem,
    Value<int>? onboardedEpochDay,
    Value<double?>? bodyFatPercent,
    Value<double?>? requestedLossFraction,
    Value<bool>? pregnant,
    Value<bool>? breastfeeding,
    Value<bool>? eatingDisorderHistory,
    Value<bool>? chronicKidneyDisease,
    Value<bool>? androgenUse,
    Value<bool>? pcos,
    Value<bool>? menopause,
    Value<bool>? thyroidCondition,
    Value<bool>? insulinOrSulfonylurea,
    Value<bool>? insulinCareTeamConfirmed,
    Value<bool>? bariatricSurgery,
    Value<bool>? weightAffectingMedication,
    Value<int?>? healthCheckConfirmedEpochDay,
    Value<int>? healthCheckSkipCount,
    Value<int?>? creatineStartedEpochDay,
  }) {
    return SetupsCompanion(
      id: id ?? this.id,
      sex: sex ?? this.sex,
      birthEpochDay: birthEpochDay ?? this.birthEpochDay,
      heightCm: heightCm ?? this.heightCm,
      trainingStatus: trainingStatus ?? this.trainingStatus,
      trainingDaysPerWeek: trainingDaysPerWeek ?? this.trainingDaysPerWeek,
      profileRevision: profileRevision ?? this.profileRevision,
      dailyActivity: dailyActivity ?? this.dailyActivity,
      goalMode: goalMode ?? this.goalMode,
      unitSystem: unitSystem ?? this.unitSystem,
      onboardedEpochDay: onboardedEpochDay ?? this.onboardedEpochDay,
      bodyFatPercent: bodyFatPercent ?? this.bodyFatPercent,
      requestedLossFraction:
          requestedLossFraction ?? this.requestedLossFraction,
      pregnant: pregnant ?? this.pregnant,
      breastfeeding: breastfeeding ?? this.breastfeeding,
      eatingDisorderHistory:
          eatingDisorderHistory ?? this.eatingDisorderHistory,
      chronicKidneyDisease: chronicKidneyDisease ?? this.chronicKidneyDisease,
      androgenUse: androgenUse ?? this.androgenUse,
      pcos: pcos ?? this.pcos,
      menopause: menopause ?? this.menopause,
      thyroidCondition: thyroidCondition ?? this.thyroidCondition,
      insulinOrSulfonylurea:
          insulinOrSulfonylurea ?? this.insulinOrSulfonylurea,
      insulinCareTeamConfirmed:
          insulinCareTeamConfirmed ?? this.insulinCareTeamConfirmed,
      bariatricSurgery: bariatricSurgery ?? this.bariatricSurgery,
      weightAffectingMedication:
          weightAffectingMedication ?? this.weightAffectingMedication,
      healthCheckConfirmedEpochDay:
          healthCheckConfirmedEpochDay ?? this.healthCheckConfirmedEpochDay,
      healthCheckSkipCount: healthCheckSkipCount ?? this.healthCheckSkipCount,
      creatineStartedEpochDay:
          creatineStartedEpochDay ?? this.creatineStartedEpochDay,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (sex.present) {
      map['sex'] = Variable<String>(sex.value);
    }
    if (birthEpochDay.present) {
      map['birth_epoch_day'] = Variable<int>(birthEpochDay.value);
    }
    if (heightCm.present) {
      map['height_cm'] = Variable<double>(heightCm.value);
    }
    if (trainingStatus.present) {
      map['training_status'] = Variable<String>(
        $SetupsTable.$convertertrainingStatus.toSql(trainingStatus.value),
      );
    }
    if (trainingDaysPerWeek.present) {
      map['training_days_per_week'] = Variable<int>(trainingDaysPerWeek.value);
    }
    if (profileRevision.present) {
      map['profile_revision'] = Variable<int>(profileRevision.value);
    }
    if (dailyActivity.present) {
      map['daily_activity'] = Variable<String>(
        $SetupsTable.$converterdailyActivity.toSql(dailyActivity.value),
      );
    }
    if (goalMode.present) {
      map['goal_mode'] = Variable<String>(
        $SetupsTable.$convertergoalMode.toSql(goalMode.value),
      );
    }
    if (unitSystem.present) {
      map['unit_system'] = Variable<String>(
        $SetupsTable.$converterunitSystem.toSql(unitSystem.value),
      );
    }
    if (onboardedEpochDay.present) {
      map['onboarded_epoch_day'] = Variable<int>(onboardedEpochDay.value);
    }
    if (bodyFatPercent.present) {
      map['body_fat_percent'] = Variable<double>(bodyFatPercent.value);
    }
    if (requestedLossFraction.present) {
      map['requested_loss_fraction'] = Variable<double>(
        requestedLossFraction.value,
      );
    }
    if (pregnant.present) {
      map['pregnant'] = Variable<bool>(pregnant.value);
    }
    if (breastfeeding.present) {
      map['breastfeeding'] = Variable<bool>(breastfeeding.value);
    }
    if (eatingDisorderHistory.present) {
      map['eating_disorder_history'] = Variable<bool>(
        eatingDisorderHistory.value,
      );
    }
    if (chronicKidneyDisease.present) {
      map['chronic_kidney_disease'] = Variable<bool>(
        chronicKidneyDisease.value,
      );
    }
    if (androgenUse.present) {
      map['androgen_use'] = Variable<bool>(androgenUse.value);
    }
    if (pcos.present) {
      map['pcos'] = Variable<bool>(pcos.value);
    }
    if (menopause.present) {
      map['menopause'] = Variable<bool>(menopause.value);
    }
    if (thyroidCondition.present) {
      map['thyroid_condition'] = Variable<bool>(thyroidCondition.value);
    }
    if (insulinOrSulfonylurea.present) {
      map['insulin_or_sulfonylurea'] = Variable<bool>(
        insulinOrSulfonylurea.value,
      );
    }
    if (insulinCareTeamConfirmed.present) {
      map['insulin_care_team_confirmed'] = Variable<bool>(
        insulinCareTeamConfirmed.value,
      );
    }
    if (bariatricSurgery.present) {
      map['bariatric_surgery'] = Variable<bool>(bariatricSurgery.value);
    }
    if (weightAffectingMedication.present) {
      map['weight_affecting_medication'] = Variable<bool>(
        weightAffectingMedication.value,
      );
    }
    if (healthCheckConfirmedEpochDay.present) {
      map['health_check_confirmed_epoch_day'] = Variable<int>(
        healthCheckConfirmedEpochDay.value,
      );
    }
    if (healthCheckSkipCount.present) {
      map['health_check_skip_count'] = Variable<int>(
        healthCheckSkipCount.value,
      );
    }
    if (creatineStartedEpochDay.present) {
      map['creatine_started_epoch_day'] = Variable<int>(
        creatineStartedEpochDay.value,
      );
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SetupsCompanion(')
          ..write('id: $id, ')
          ..write('sex: $sex, ')
          ..write('birthEpochDay: $birthEpochDay, ')
          ..write('heightCm: $heightCm, ')
          ..write('trainingStatus: $trainingStatus, ')
          ..write('trainingDaysPerWeek: $trainingDaysPerWeek, ')
          ..write('profileRevision: $profileRevision, ')
          ..write('dailyActivity: $dailyActivity, ')
          ..write('goalMode: $goalMode, ')
          ..write('unitSystem: $unitSystem, ')
          ..write('onboardedEpochDay: $onboardedEpochDay, ')
          ..write('bodyFatPercent: $bodyFatPercent, ')
          ..write('requestedLossFraction: $requestedLossFraction, ')
          ..write('pregnant: $pregnant, ')
          ..write('breastfeeding: $breastfeeding, ')
          ..write('eatingDisorderHistory: $eatingDisorderHistory, ')
          ..write('chronicKidneyDisease: $chronicKidneyDisease, ')
          ..write('androgenUse: $androgenUse, ')
          ..write('pcos: $pcos, ')
          ..write('menopause: $menopause, ')
          ..write('thyroidCondition: $thyroidCondition, ')
          ..write('insulinOrSulfonylurea: $insulinOrSulfonylurea, ')
          ..write('insulinCareTeamConfirmed: $insulinCareTeamConfirmed, ')
          ..write('bariatricSurgery: $bariatricSurgery, ')
          ..write('weightAffectingMedication: $weightAffectingMedication, ')
          ..write(
            'healthCheckConfirmedEpochDay: $healthCheckConfirmedEpochDay, ',
          )
          ..write('healthCheckSkipCount: $healthCheckSkipCount, ')
          ..write('creatineStartedEpochDay: $creatineStartedEpochDay')
          ..write(')'))
        .toString();
  }
}

class $WeightEntriesTable extends WeightEntries
    with TableInfo<$WeightEntriesTable, WeightRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $WeightEntriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _epochDayMeta = const VerificationMeta(
    'epochDay',
  );
  @override
  late final GeneratedColumn<int> epochDay = GeneratedColumn<int>(
    'epoch_day',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _weightKgMeta = const VerificationMeta(
    'weightKg',
  );
  @override
  late final GeneratedColumn<double> weightKg = GeneratedColumn<double>(
    'weight_kg',
    aliasedName,
    false,
    check: () => ComparableExpr(weightKg).isBetweenValues(20, 500),
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _deviceIdMeta = const VerificationMeta(
    'deviceId',
  );
  @override
  late final GeneratedColumn<String> deviceId = GeneratedColumn<String>(
    'device_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [epochDay, weightKg, deviceId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'weight_entries';
  @override
  VerificationContext validateIntegrity(
    Insertable<WeightRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('epoch_day')) {
      context.handle(
        _epochDayMeta,
        epochDay.isAcceptableOrUnknown(data['epoch_day']!, _epochDayMeta),
      );
    }
    if (data.containsKey('weight_kg')) {
      context.handle(
        _weightKgMeta,
        weightKg.isAcceptableOrUnknown(data['weight_kg']!, _weightKgMeta),
      );
    } else if (isInserting) {
      context.missing(_weightKgMeta);
    }
    if (data.containsKey('device_id')) {
      context.handle(
        _deviceIdMeta,
        deviceId.isAcceptableOrUnknown(data['device_id']!, _deviceIdMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {epochDay};
  @override
  WeightRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return WeightRow(
      epochDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}epoch_day'],
      )!,
      weightKg: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}weight_kg'],
      )!,
      deviceId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}device_id'],
      ),
    );
  }

  @override
  $WeightEntriesTable createAlias(String alias) {
    return $WeightEntriesTable(attachedDatabase, alias);
  }
}

class WeightRow extends DataClass implements Insertable<WeightRow> {
  final int epochDay;
  final double weightKg;
  final String? deviceId;
  const WeightRow({
    required this.epochDay,
    required this.weightKg,
    this.deviceId,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['epoch_day'] = Variable<int>(epochDay);
    map['weight_kg'] = Variable<double>(weightKg);
    if (!nullToAbsent || deviceId != null) {
      map['device_id'] = Variable<String>(deviceId);
    }
    return map;
  }

  WeightEntriesCompanion toCompanion(bool nullToAbsent) {
    return WeightEntriesCompanion(
      epochDay: Value(epochDay),
      weightKg: Value(weightKg),
      deviceId: deviceId == null && nullToAbsent
          ? const Value.absent()
          : Value(deviceId),
    );
  }

  factory WeightRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return WeightRow(
      epochDay: serializer.fromJson<int>(json['epochDay']),
      weightKg: serializer.fromJson<double>(json['weightKg']),
      deviceId: serializer.fromJson<String?>(json['deviceId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'epochDay': serializer.toJson<int>(epochDay),
      'weightKg': serializer.toJson<double>(weightKg),
      'deviceId': serializer.toJson<String?>(deviceId),
    };
  }

  WeightRow copyWith({
    int? epochDay,
    double? weightKg,
    Value<String?> deviceId = const Value.absent(),
  }) => WeightRow(
    epochDay: epochDay ?? this.epochDay,
    weightKg: weightKg ?? this.weightKg,
    deviceId: deviceId.present ? deviceId.value : this.deviceId,
  );
  WeightRow copyWithCompanion(WeightEntriesCompanion data) {
    return WeightRow(
      epochDay: data.epochDay.present ? data.epochDay.value : this.epochDay,
      weightKg: data.weightKg.present ? data.weightKg.value : this.weightKg,
      deviceId: data.deviceId.present ? data.deviceId.value : this.deviceId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('WeightRow(')
          ..write('epochDay: $epochDay, ')
          ..write('weightKg: $weightKg, ')
          ..write('deviceId: $deviceId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(epochDay, weightKg, deviceId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is WeightRow &&
          other.epochDay == this.epochDay &&
          other.weightKg == this.weightKg &&
          other.deviceId == this.deviceId);
}

class WeightEntriesCompanion extends UpdateCompanion<WeightRow> {
  final Value<int> epochDay;
  final Value<double> weightKg;
  final Value<String?> deviceId;
  const WeightEntriesCompanion({
    this.epochDay = const Value.absent(),
    this.weightKg = const Value.absent(),
    this.deviceId = const Value.absent(),
  });
  WeightEntriesCompanion.insert({
    this.epochDay = const Value.absent(),
    required double weightKg,
    this.deviceId = const Value.absent(),
  }) : weightKg = Value(weightKg);
  static Insertable<WeightRow> custom({
    Expression<int>? epochDay,
    Expression<double>? weightKg,
    Expression<String>? deviceId,
  }) {
    return RawValuesInsertable({
      if (epochDay != null) 'epoch_day': epochDay,
      if (weightKg != null) 'weight_kg': weightKg,
      if (deviceId != null) 'device_id': deviceId,
    });
  }

  WeightEntriesCompanion copyWith({
    Value<int>? epochDay,
    Value<double>? weightKg,
    Value<String?>? deviceId,
  }) {
    return WeightEntriesCompanion(
      epochDay: epochDay ?? this.epochDay,
      weightKg: weightKg ?? this.weightKg,
      deviceId: deviceId ?? this.deviceId,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (epochDay.present) {
      map['epoch_day'] = Variable<int>(epochDay.value);
    }
    if (weightKg.present) {
      map['weight_kg'] = Variable<double>(weightKg.value);
    }
    if (deviceId.present) {
      map['device_id'] = Variable<String>(deviceId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('WeightEntriesCompanion(')
          ..write('epochDay: $epochDay, ')
          ..write('weightKg: $weightKg, ')
          ..write('deviceId: $deviceId')
          ..write(')'))
        .toString();
  }
}

class $FoodEntriesTable extends FoodEntries
    with TableInfo<$FoodEntriesTable, FoodRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FoodEntriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _epochDayMeta = const VerificationMeta(
    'epochDay',
  );
  @override
  late final GeneratedColumn<int> epochDay = GeneratedColumn<int>(
    'epoch_day',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  late final GeneratedColumnWithTypeConverter<Meal, String> meal =
      GeneratedColumn<String>(
        'meal',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<Meal>($FoodEntriesTable.$convertermeal);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _kcalMeta = const VerificationMeta('kcal');
  @override
  late final GeneratedColumn<double> kcal = GeneratedColumn<double>(
    'kcal',
    aliasedName,
    false,
    check: () => ComparableExpr(kcal).isBiggerOrEqualValue(0),
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _proteinGMeta = const VerificationMeta(
    'proteinG',
  );
  @override
  late final GeneratedColumn<double> proteinG = GeneratedColumn<double>(
    'protein_g',
    aliasedName,
    false,
    check: () => ComparableExpr(proteinG).isBiggerOrEqualValue(0),
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _carbsGMeta = const VerificationMeta('carbsG');
  @override
  late final GeneratedColumn<double> carbsG = GeneratedColumn<double>(
    'carbs_g',
    aliasedName,
    false,
    check: () => ComparableExpr(carbsG).isBiggerOrEqualValue(0),
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _fatGMeta = const VerificationMeta('fatG');
  @override
  late final GeneratedColumn<double> fatG = GeneratedColumn<double>(
    'fat_g',
    aliasedName,
    false,
    check: () => ComparableExpr(fatG).isBiggerOrEqualValue(0),
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  @override
  late final GeneratedColumnWithTypeConverter<QuantitySource, String>
  quantitySource = GeneratedColumn<String>(
    'quantity_source',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  ).withConverter<QuantitySource>($FoodEntriesTable.$converterquantitySource);
  static const VerificationMeta _portionQuantityMeta = const VerificationMeta(
    'portionQuantity',
  );
  @override
  late final GeneratedColumn<double> portionQuantity = GeneratedColumn<double>(
    'portion_quantity',
    aliasedName,
    true,
    check: () => ComparableExpr(portionQuantity).isBiggerThanValue(0),
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  @override
  late final GeneratedColumnWithTypeConverter<PortionUnit?, String>
  portionUnit = GeneratedColumn<String>(
    'portion_unit',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  ).withConverter<PortionUnit?>($FoodEntriesTable.$converterportionUnitn);
  @override
  late final GeneratedColumnWithTypeConverter<NutritionBasis?, String>
  nutritionBasis = GeneratedColumn<String>(
    'nutrition_basis',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  ).withConverter<NutritionBasis?>($FoodEntriesTable.$converternutritionBasisn);
  @override
  late final GeneratedColumnWithTypeConverter<ReferenceBasis?, String>
  referenceBasis = GeneratedColumn<String>(
    'reference_basis',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  ).withConverter<ReferenceBasis?>($FoodEntriesTable.$converterreferenceBasisn);
  static const VerificationMeta _referenceKcalMeta = const VerificationMeta(
    'referenceKcal',
  );
  @override
  late final GeneratedColumn<double> referenceKcal = GeneratedColumn<double>(
    'reference_kcal',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _referenceProteinGMeta = const VerificationMeta(
    'referenceProteinG',
  );
  @override
  late final GeneratedColumn<double> referenceProteinG =
      GeneratedColumn<double>(
        'reference_protein_g',
        aliasedName,
        true,
        type: DriftSqlType.double,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _referenceCarbsGMeta = const VerificationMeta(
    'referenceCarbsG',
  );
  @override
  late final GeneratedColumn<double> referenceCarbsG = GeneratedColumn<double>(
    'reference_carbs_g',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _referenceFatGMeta = const VerificationMeta(
    'referenceFatG',
  );
  @override
  late final GeneratedColumn<double> referenceFatG = GeneratedColumn<double>(
    'reference_fat_g',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _servingDescriptionMeta =
      const VerificationMeta('servingDescription');
  @override
  late final GeneratedColumn<String> servingDescription =
      GeneratedColumn<String>(
        'serving_description',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _servingGramsMeta = const VerificationMeta(
    'servingGrams',
  );
  @override
  late final GeneratedColumn<double> servingGrams = GeneratedColumn<double>(
    'serving_grams',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _servingMillilitersMeta =
      const VerificationMeta('servingMilliliters');
  @override
  late final GeneratedColumn<double> servingMilliliters =
      GeneratedColumn<double>(
        'serving_milliliters',
        aliasedName,
        true,
        type: DriftSqlType.double,
        requiredDuringInsert: false,
      );
  @override
  late final GeneratedColumnWithTypeConverter<PortionUnit?, String>
  servingUnit = GeneratedColumn<String>(
    'serving_unit',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  ).withConverter<PortionUnit?>($FoodEntriesTable.$converterservingUnitn);
  static const VerificationMeta _densityGPerMlMeta = const VerificationMeta(
    'densityGPerMl',
  );
  @override
  late final GeneratedColumn<double> densityGPerMl = GeneratedColumn<double>(
    'density_g_per_ml',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _originPackIdMeta = const VerificationMeta(
    'originPackId',
  );
  @override
  late final GeneratedColumn<String> originPackId = GeneratedColumn<String>(
    'origin_pack_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _originFoodIdMeta = const VerificationMeta(
    'originFoodId',
  );
  @override
  late final GeneratedColumn<int> originFoodId = GeneratedColumn<int>(
    'origin_food_id',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _originSourceMeta = const VerificationMeta(
    'originSource',
  );
  @override
  late final GeneratedColumn<String> originSource = GeneratedColumn<String>(
    'origin_source',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _originSourceIdMeta = const VerificationMeta(
    'originSourceId',
  );
  @override
  late final GeneratedColumn<String> originSourceId = GeneratedColumn<String>(
    'origin_source_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    epochDay,
    meal,
    name,
    kcal,
    proteinG,
    carbsG,
    fatG,
    quantitySource,
    portionQuantity,
    portionUnit,
    nutritionBasis,
    referenceBasis,
    referenceKcal,
    referenceProteinG,
    referenceCarbsG,
    referenceFatG,
    servingDescription,
    servingGrams,
    servingMilliliters,
    servingUnit,
    densityGPerMl,
    originPackId,
    originFoodId,
    originSource,
    originSourceId,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'food_entries';
  @override
  VerificationContext validateIntegrity(
    Insertable<FoodRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('epoch_day')) {
      context.handle(
        _epochDayMeta,
        epochDay.isAcceptableOrUnknown(data['epoch_day']!, _epochDayMeta),
      );
    } else if (isInserting) {
      context.missing(_epochDayMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('kcal')) {
      context.handle(
        _kcalMeta,
        kcal.isAcceptableOrUnknown(data['kcal']!, _kcalMeta),
      );
    } else if (isInserting) {
      context.missing(_kcalMeta);
    }
    if (data.containsKey('protein_g')) {
      context.handle(
        _proteinGMeta,
        proteinG.isAcceptableOrUnknown(data['protein_g']!, _proteinGMeta),
      );
    } else if (isInserting) {
      context.missing(_proteinGMeta);
    }
    if (data.containsKey('carbs_g')) {
      context.handle(
        _carbsGMeta,
        carbsG.isAcceptableOrUnknown(data['carbs_g']!, _carbsGMeta),
      );
    } else if (isInserting) {
      context.missing(_carbsGMeta);
    }
    if (data.containsKey('fat_g')) {
      context.handle(
        _fatGMeta,
        fatG.isAcceptableOrUnknown(data['fat_g']!, _fatGMeta),
      );
    } else if (isInserting) {
      context.missing(_fatGMeta);
    }
    if (data.containsKey('portion_quantity')) {
      context.handle(
        _portionQuantityMeta,
        portionQuantity.isAcceptableOrUnknown(
          data['portion_quantity']!,
          _portionQuantityMeta,
        ),
      );
    }
    if (data.containsKey('reference_kcal')) {
      context.handle(
        _referenceKcalMeta,
        referenceKcal.isAcceptableOrUnknown(
          data['reference_kcal']!,
          _referenceKcalMeta,
        ),
      );
    }
    if (data.containsKey('reference_protein_g')) {
      context.handle(
        _referenceProteinGMeta,
        referenceProteinG.isAcceptableOrUnknown(
          data['reference_protein_g']!,
          _referenceProteinGMeta,
        ),
      );
    }
    if (data.containsKey('reference_carbs_g')) {
      context.handle(
        _referenceCarbsGMeta,
        referenceCarbsG.isAcceptableOrUnknown(
          data['reference_carbs_g']!,
          _referenceCarbsGMeta,
        ),
      );
    }
    if (data.containsKey('reference_fat_g')) {
      context.handle(
        _referenceFatGMeta,
        referenceFatG.isAcceptableOrUnknown(
          data['reference_fat_g']!,
          _referenceFatGMeta,
        ),
      );
    }
    if (data.containsKey('serving_description')) {
      context.handle(
        _servingDescriptionMeta,
        servingDescription.isAcceptableOrUnknown(
          data['serving_description']!,
          _servingDescriptionMeta,
        ),
      );
    }
    if (data.containsKey('serving_grams')) {
      context.handle(
        _servingGramsMeta,
        servingGrams.isAcceptableOrUnknown(
          data['serving_grams']!,
          _servingGramsMeta,
        ),
      );
    }
    if (data.containsKey('serving_milliliters')) {
      context.handle(
        _servingMillilitersMeta,
        servingMilliliters.isAcceptableOrUnknown(
          data['serving_milliliters']!,
          _servingMillilitersMeta,
        ),
      );
    }
    if (data.containsKey('density_g_per_ml')) {
      context.handle(
        _densityGPerMlMeta,
        densityGPerMl.isAcceptableOrUnknown(
          data['density_g_per_ml']!,
          _densityGPerMlMeta,
        ),
      );
    }
    if (data.containsKey('origin_pack_id')) {
      context.handle(
        _originPackIdMeta,
        originPackId.isAcceptableOrUnknown(
          data['origin_pack_id']!,
          _originPackIdMeta,
        ),
      );
    }
    if (data.containsKey('origin_food_id')) {
      context.handle(
        _originFoodIdMeta,
        originFoodId.isAcceptableOrUnknown(
          data['origin_food_id']!,
          _originFoodIdMeta,
        ),
      );
    }
    if (data.containsKey('origin_source')) {
      context.handle(
        _originSourceMeta,
        originSource.isAcceptableOrUnknown(
          data['origin_source']!,
          _originSourceMeta,
        ),
      );
    }
    if (data.containsKey('origin_source_id')) {
      context.handle(
        _originSourceIdMeta,
        originSourceId.isAcceptableOrUnknown(
          data['origin_source_id']!,
          _originSourceIdMeta,
        ),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  FoodRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return FoodRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      epochDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}epoch_day'],
      )!,
      meal: $FoodEntriesTable.$convertermeal.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}meal'],
        )!,
      ),
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      kcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}kcal'],
      )!,
      proteinG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}protein_g'],
      )!,
      carbsG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}carbs_g'],
      )!,
      fatG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}fat_g'],
      )!,
      quantitySource: $FoodEntriesTable.$converterquantitySource.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}quantity_source'],
        )!,
      ),
      portionQuantity: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}portion_quantity'],
      ),
      portionUnit: $FoodEntriesTable.$converterportionUnitn.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}portion_unit'],
        ),
      ),
      nutritionBasis: $FoodEntriesTable.$converternutritionBasisn.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}nutrition_basis'],
        ),
      ),
      referenceBasis: $FoodEntriesTable.$converterreferenceBasisn.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}reference_basis'],
        ),
      ),
      referenceKcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}reference_kcal'],
      ),
      referenceProteinG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}reference_protein_g'],
      ),
      referenceCarbsG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}reference_carbs_g'],
      ),
      referenceFatG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}reference_fat_g'],
      ),
      servingDescription: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}serving_description'],
      ),
      servingGrams: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}serving_grams'],
      ),
      servingMilliliters: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}serving_milliliters'],
      ),
      servingUnit: $FoodEntriesTable.$converterservingUnitn.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}serving_unit'],
        ),
      ),
      densityGPerMl: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}density_g_per_ml'],
      ),
      originPackId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}origin_pack_id'],
      ),
      originFoodId: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}origin_food_id'],
      ),
      originSource: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}origin_source'],
      ),
      originSourceId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}origin_source_id'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $FoodEntriesTable createAlias(String alias) {
    return $FoodEntriesTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<Meal, String, String> $convertermeal =
      const EnumNameConverter<Meal>(Meal.values);
  static JsonTypeConverter2<QuantitySource, String, String>
  $converterquantitySource = const EnumNameConverter<QuantitySource>(
    QuantitySource.values,
  );
  static JsonTypeConverter2<PortionUnit, String, String> $converterportionUnit =
      const EnumNameConverter<PortionUnit>(PortionUnit.values);
  static JsonTypeConverter2<PortionUnit?, String?, String?>
  $converterportionUnitn = JsonTypeConverter2.asNullable($converterportionUnit);
  static JsonTypeConverter2<NutritionBasis, String, String>
  $converternutritionBasis = const EnumNameConverter<NutritionBasis>(
    NutritionBasis.values,
  );
  static JsonTypeConverter2<NutritionBasis?, String?, String?>
  $converternutritionBasisn = JsonTypeConverter2.asNullable(
    $converternutritionBasis,
  );
  static JsonTypeConverter2<ReferenceBasis, String, String>
  $converterreferenceBasis = const EnumNameConverter<ReferenceBasis>(
    ReferenceBasis.values,
  );
  static JsonTypeConverter2<ReferenceBasis?, String?, String?>
  $converterreferenceBasisn = JsonTypeConverter2.asNullable(
    $converterreferenceBasis,
  );
  static JsonTypeConverter2<PortionUnit, String, String> $converterservingUnit =
      const EnumNameConverter<PortionUnit>(PortionUnit.values);
  static JsonTypeConverter2<PortionUnit?, String?, String?>
  $converterservingUnitn = JsonTypeConverter2.asNullable($converterservingUnit);
}

class FoodRow extends DataClass implements Insertable<FoodRow> {
  final int id;
  final int epochDay;
  final Meal meal;
  final String name;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final QuantitySource quantitySource;
  final double? portionQuantity;
  final PortionUnit? portionUnit;
  final NutritionBasis? nutritionBasis;
  final ReferenceBasis? referenceBasis;
  final double? referenceKcal;
  final double? referenceProteinG;
  final double? referenceCarbsG;
  final double? referenceFatG;
  final String? servingDescription;
  final double? servingGrams;
  final double? servingMilliliters;
  final PortionUnit? servingUnit;
  final double? densityGPerMl;
  final String? originPackId;
  final int? originFoodId;
  final String? originSource;
  final String? originSourceId;
  final DateTime createdAt;
  const FoodRow({
    required this.id,
    required this.epochDay,
    required this.meal,
    required this.name,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    required this.quantitySource,
    this.portionQuantity,
    this.portionUnit,
    this.nutritionBasis,
    this.referenceBasis,
    this.referenceKcal,
    this.referenceProteinG,
    this.referenceCarbsG,
    this.referenceFatG,
    this.servingDescription,
    this.servingGrams,
    this.servingMilliliters,
    this.servingUnit,
    this.densityGPerMl,
    this.originPackId,
    this.originFoodId,
    this.originSource,
    this.originSourceId,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['epoch_day'] = Variable<int>(epochDay);
    {
      map['meal'] = Variable<String>(
        $FoodEntriesTable.$convertermeal.toSql(meal),
      );
    }
    map['name'] = Variable<String>(name);
    map['kcal'] = Variable<double>(kcal);
    map['protein_g'] = Variable<double>(proteinG);
    map['carbs_g'] = Variable<double>(carbsG);
    map['fat_g'] = Variable<double>(fatG);
    {
      map['quantity_source'] = Variable<String>(
        $FoodEntriesTable.$converterquantitySource.toSql(quantitySource),
      );
    }
    if (!nullToAbsent || portionQuantity != null) {
      map['portion_quantity'] = Variable<double>(portionQuantity);
    }
    if (!nullToAbsent || portionUnit != null) {
      map['portion_unit'] = Variable<String>(
        $FoodEntriesTable.$converterportionUnitn.toSql(portionUnit),
      );
    }
    if (!nullToAbsent || nutritionBasis != null) {
      map['nutrition_basis'] = Variable<String>(
        $FoodEntriesTable.$converternutritionBasisn.toSql(nutritionBasis),
      );
    }
    if (!nullToAbsent || referenceBasis != null) {
      map['reference_basis'] = Variable<String>(
        $FoodEntriesTable.$converterreferenceBasisn.toSql(referenceBasis),
      );
    }
    if (!nullToAbsent || referenceKcal != null) {
      map['reference_kcal'] = Variable<double>(referenceKcal);
    }
    if (!nullToAbsent || referenceProteinG != null) {
      map['reference_protein_g'] = Variable<double>(referenceProteinG);
    }
    if (!nullToAbsent || referenceCarbsG != null) {
      map['reference_carbs_g'] = Variable<double>(referenceCarbsG);
    }
    if (!nullToAbsent || referenceFatG != null) {
      map['reference_fat_g'] = Variable<double>(referenceFatG);
    }
    if (!nullToAbsent || servingDescription != null) {
      map['serving_description'] = Variable<String>(servingDescription);
    }
    if (!nullToAbsent || servingGrams != null) {
      map['serving_grams'] = Variable<double>(servingGrams);
    }
    if (!nullToAbsent || servingMilliliters != null) {
      map['serving_milliliters'] = Variable<double>(servingMilliliters);
    }
    if (!nullToAbsent || servingUnit != null) {
      map['serving_unit'] = Variable<String>(
        $FoodEntriesTable.$converterservingUnitn.toSql(servingUnit),
      );
    }
    if (!nullToAbsent || densityGPerMl != null) {
      map['density_g_per_ml'] = Variable<double>(densityGPerMl);
    }
    if (!nullToAbsent || originPackId != null) {
      map['origin_pack_id'] = Variable<String>(originPackId);
    }
    if (!nullToAbsent || originFoodId != null) {
      map['origin_food_id'] = Variable<int>(originFoodId);
    }
    if (!nullToAbsent || originSource != null) {
      map['origin_source'] = Variable<String>(originSource);
    }
    if (!nullToAbsent || originSourceId != null) {
      map['origin_source_id'] = Variable<String>(originSourceId);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  FoodEntriesCompanion toCompanion(bool nullToAbsent) {
    return FoodEntriesCompanion(
      id: Value(id),
      epochDay: Value(epochDay),
      meal: Value(meal),
      name: Value(name),
      kcal: Value(kcal),
      proteinG: Value(proteinG),
      carbsG: Value(carbsG),
      fatG: Value(fatG),
      quantitySource: Value(quantitySource),
      portionQuantity: portionQuantity == null && nullToAbsent
          ? const Value.absent()
          : Value(portionQuantity),
      portionUnit: portionUnit == null && nullToAbsent
          ? const Value.absent()
          : Value(portionUnit),
      nutritionBasis: nutritionBasis == null && nullToAbsent
          ? const Value.absent()
          : Value(nutritionBasis),
      referenceBasis: referenceBasis == null && nullToAbsent
          ? const Value.absent()
          : Value(referenceBasis),
      referenceKcal: referenceKcal == null && nullToAbsent
          ? const Value.absent()
          : Value(referenceKcal),
      referenceProteinG: referenceProteinG == null && nullToAbsent
          ? const Value.absent()
          : Value(referenceProteinG),
      referenceCarbsG: referenceCarbsG == null && nullToAbsent
          ? const Value.absent()
          : Value(referenceCarbsG),
      referenceFatG: referenceFatG == null && nullToAbsent
          ? const Value.absent()
          : Value(referenceFatG),
      servingDescription: servingDescription == null && nullToAbsent
          ? const Value.absent()
          : Value(servingDescription),
      servingGrams: servingGrams == null && nullToAbsent
          ? const Value.absent()
          : Value(servingGrams),
      servingMilliliters: servingMilliliters == null && nullToAbsent
          ? const Value.absent()
          : Value(servingMilliliters),
      servingUnit: servingUnit == null && nullToAbsent
          ? const Value.absent()
          : Value(servingUnit),
      densityGPerMl: densityGPerMl == null && nullToAbsent
          ? const Value.absent()
          : Value(densityGPerMl),
      originPackId: originPackId == null && nullToAbsent
          ? const Value.absent()
          : Value(originPackId),
      originFoodId: originFoodId == null && nullToAbsent
          ? const Value.absent()
          : Value(originFoodId),
      originSource: originSource == null && nullToAbsent
          ? const Value.absent()
          : Value(originSource),
      originSourceId: originSourceId == null && nullToAbsent
          ? const Value.absent()
          : Value(originSourceId),
      createdAt: Value(createdAt),
    );
  }

  factory FoodRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return FoodRow(
      id: serializer.fromJson<int>(json['id']),
      epochDay: serializer.fromJson<int>(json['epochDay']),
      meal: $FoodEntriesTable.$convertermeal.fromJson(
        serializer.fromJson<String>(json['meal']),
      ),
      name: serializer.fromJson<String>(json['name']),
      kcal: serializer.fromJson<double>(json['kcal']),
      proteinG: serializer.fromJson<double>(json['proteinG']),
      carbsG: serializer.fromJson<double>(json['carbsG']),
      fatG: serializer.fromJson<double>(json['fatG']),
      quantitySource: $FoodEntriesTable.$converterquantitySource.fromJson(
        serializer.fromJson<String>(json['quantitySource']),
      ),
      portionQuantity: serializer.fromJson<double?>(json['portionQuantity']),
      portionUnit: $FoodEntriesTable.$converterportionUnitn.fromJson(
        serializer.fromJson<String?>(json['portionUnit']),
      ),
      nutritionBasis: $FoodEntriesTable.$converternutritionBasisn.fromJson(
        serializer.fromJson<String?>(json['nutritionBasis']),
      ),
      referenceBasis: $FoodEntriesTable.$converterreferenceBasisn.fromJson(
        serializer.fromJson<String?>(json['referenceBasis']),
      ),
      referenceKcal: serializer.fromJson<double?>(json['referenceKcal']),
      referenceProteinG: serializer.fromJson<double?>(
        json['referenceProteinG'],
      ),
      referenceCarbsG: serializer.fromJson<double?>(json['referenceCarbsG']),
      referenceFatG: serializer.fromJson<double?>(json['referenceFatG']),
      servingDescription: serializer.fromJson<String?>(
        json['servingDescription'],
      ),
      servingGrams: serializer.fromJson<double?>(json['servingGrams']),
      servingMilliliters: serializer.fromJson<double?>(
        json['servingMilliliters'],
      ),
      servingUnit: $FoodEntriesTable.$converterservingUnitn.fromJson(
        serializer.fromJson<String?>(json['servingUnit']),
      ),
      densityGPerMl: serializer.fromJson<double?>(json['densityGPerMl']),
      originPackId: serializer.fromJson<String?>(json['originPackId']),
      originFoodId: serializer.fromJson<int?>(json['originFoodId']),
      originSource: serializer.fromJson<String?>(json['originSource']),
      originSourceId: serializer.fromJson<String?>(json['originSourceId']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'epochDay': serializer.toJson<int>(epochDay),
      'meal': serializer.toJson<String>(
        $FoodEntriesTable.$convertermeal.toJson(meal),
      ),
      'name': serializer.toJson<String>(name),
      'kcal': serializer.toJson<double>(kcal),
      'proteinG': serializer.toJson<double>(proteinG),
      'carbsG': serializer.toJson<double>(carbsG),
      'fatG': serializer.toJson<double>(fatG),
      'quantitySource': serializer.toJson<String>(
        $FoodEntriesTable.$converterquantitySource.toJson(quantitySource),
      ),
      'portionQuantity': serializer.toJson<double?>(portionQuantity),
      'portionUnit': serializer.toJson<String?>(
        $FoodEntriesTable.$converterportionUnitn.toJson(portionUnit),
      ),
      'nutritionBasis': serializer.toJson<String?>(
        $FoodEntriesTable.$converternutritionBasisn.toJson(nutritionBasis),
      ),
      'referenceBasis': serializer.toJson<String?>(
        $FoodEntriesTable.$converterreferenceBasisn.toJson(referenceBasis),
      ),
      'referenceKcal': serializer.toJson<double?>(referenceKcal),
      'referenceProteinG': serializer.toJson<double?>(referenceProteinG),
      'referenceCarbsG': serializer.toJson<double?>(referenceCarbsG),
      'referenceFatG': serializer.toJson<double?>(referenceFatG),
      'servingDescription': serializer.toJson<String?>(servingDescription),
      'servingGrams': serializer.toJson<double?>(servingGrams),
      'servingMilliliters': serializer.toJson<double?>(servingMilliliters),
      'servingUnit': serializer.toJson<String?>(
        $FoodEntriesTable.$converterservingUnitn.toJson(servingUnit),
      ),
      'densityGPerMl': serializer.toJson<double?>(densityGPerMl),
      'originPackId': serializer.toJson<String?>(originPackId),
      'originFoodId': serializer.toJson<int?>(originFoodId),
      'originSource': serializer.toJson<String?>(originSource),
      'originSourceId': serializer.toJson<String?>(originSourceId),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  FoodRow copyWith({
    int? id,
    int? epochDay,
    Meal? meal,
    String? name,
    double? kcal,
    double? proteinG,
    double? carbsG,
    double? fatG,
    QuantitySource? quantitySource,
    Value<double?> portionQuantity = const Value.absent(),
    Value<PortionUnit?> portionUnit = const Value.absent(),
    Value<NutritionBasis?> nutritionBasis = const Value.absent(),
    Value<ReferenceBasis?> referenceBasis = const Value.absent(),
    Value<double?> referenceKcal = const Value.absent(),
    Value<double?> referenceProteinG = const Value.absent(),
    Value<double?> referenceCarbsG = const Value.absent(),
    Value<double?> referenceFatG = const Value.absent(),
    Value<String?> servingDescription = const Value.absent(),
    Value<double?> servingGrams = const Value.absent(),
    Value<double?> servingMilliliters = const Value.absent(),
    Value<PortionUnit?> servingUnit = const Value.absent(),
    Value<double?> densityGPerMl = const Value.absent(),
    Value<String?> originPackId = const Value.absent(),
    Value<int?> originFoodId = const Value.absent(),
    Value<String?> originSource = const Value.absent(),
    Value<String?> originSourceId = const Value.absent(),
    DateTime? createdAt,
  }) => FoodRow(
    id: id ?? this.id,
    epochDay: epochDay ?? this.epochDay,
    meal: meal ?? this.meal,
    name: name ?? this.name,
    kcal: kcal ?? this.kcal,
    proteinG: proteinG ?? this.proteinG,
    carbsG: carbsG ?? this.carbsG,
    fatG: fatG ?? this.fatG,
    quantitySource: quantitySource ?? this.quantitySource,
    portionQuantity: portionQuantity.present
        ? portionQuantity.value
        : this.portionQuantity,
    portionUnit: portionUnit.present ? portionUnit.value : this.portionUnit,
    nutritionBasis: nutritionBasis.present
        ? nutritionBasis.value
        : this.nutritionBasis,
    referenceBasis: referenceBasis.present
        ? referenceBasis.value
        : this.referenceBasis,
    referenceKcal: referenceKcal.present
        ? referenceKcal.value
        : this.referenceKcal,
    referenceProteinG: referenceProteinG.present
        ? referenceProteinG.value
        : this.referenceProteinG,
    referenceCarbsG: referenceCarbsG.present
        ? referenceCarbsG.value
        : this.referenceCarbsG,
    referenceFatG: referenceFatG.present
        ? referenceFatG.value
        : this.referenceFatG,
    servingDescription: servingDescription.present
        ? servingDescription.value
        : this.servingDescription,
    servingGrams: servingGrams.present ? servingGrams.value : this.servingGrams,
    servingMilliliters: servingMilliliters.present
        ? servingMilliliters.value
        : this.servingMilliliters,
    servingUnit: servingUnit.present ? servingUnit.value : this.servingUnit,
    densityGPerMl: densityGPerMl.present
        ? densityGPerMl.value
        : this.densityGPerMl,
    originPackId: originPackId.present ? originPackId.value : this.originPackId,
    originFoodId: originFoodId.present ? originFoodId.value : this.originFoodId,
    originSource: originSource.present ? originSource.value : this.originSource,
    originSourceId: originSourceId.present
        ? originSourceId.value
        : this.originSourceId,
    createdAt: createdAt ?? this.createdAt,
  );
  FoodRow copyWithCompanion(FoodEntriesCompanion data) {
    return FoodRow(
      id: data.id.present ? data.id.value : this.id,
      epochDay: data.epochDay.present ? data.epochDay.value : this.epochDay,
      meal: data.meal.present ? data.meal.value : this.meal,
      name: data.name.present ? data.name.value : this.name,
      kcal: data.kcal.present ? data.kcal.value : this.kcal,
      proteinG: data.proteinG.present ? data.proteinG.value : this.proteinG,
      carbsG: data.carbsG.present ? data.carbsG.value : this.carbsG,
      fatG: data.fatG.present ? data.fatG.value : this.fatG,
      quantitySource: data.quantitySource.present
          ? data.quantitySource.value
          : this.quantitySource,
      portionQuantity: data.portionQuantity.present
          ? data.portionQuantity.value
          : this.portionQuantity,
      portionUnit: data.portionUnit.present
          ? data.portionUnit.value
          : this.portionUnit,
      nutritionBasis: data.nutritionBasis.present
          ? data.nutritionBasis.value
          : this.nutritionBasis,
      referenceBasis: data.referenceBasis.present
          ? data.referenceBasis.value
          : this.referenceBasis,
      referenceKcal: data.referenceKcal.present
          ? data.referenceKcal.value
          : this.referenceKcal,
      referenceProteinG: data.referenceProteinG.present
          ? data.referenceProteinG.value
          : this.referenceProteinG,
      referenceCarbsG: data.referenceCarbsG.present
          ? data.referenceCarbsG.value
          : this.referenceCarbsG,
      referenceFatG: data.referenceFatG.present
          ? data.referenceFatG.value
          : this.referenceFatG,
      servingDescription: data.servingDescription.present
          ? data.servingDescription.value
          : this.servingDescription,
      servingGrams: data.servingGrams.present
          ? data.servingGrams.value
          : this.servingGrams,
      servingMilliliters: data.servingMilliliters.present
          ? data.servingMilliliters.value
          : this.servingMilliliters,
      servingUnit: data.servingUnit.present
          ? data.servingUnit.value
          : this.servingUnit,
      densityGPerMl: data.densityGPerMl.present
          ? data.densityGPerMl.value
          : this.densityGPerMl,
      originPackId: data.originPackId.present
          ? data.originPackId.value
          : this.originPackId,
      originFoodId: data.originFoodId.present
          ? data.originFoodId.value
          : this.originFoodId,
      originSource: data.originSource.present
          ? data.originSource.value
          : this.originSource,
      originSourceId: data.originSourceId.present
          ? data.originSourceId.value
          : this.originSourceId,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('FoodRow(')
          ..write('id: $id, ')
          ..write('epochDay: $epochDay, ')
          ..write('meal: $meal, ')
          ..write('name: $name, ')
          ..write('kcal: $kcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('carbsG: $carbsG, ')
          ..write('fatG: $fatG, ')
          ..write('quantitySource: $quantitySource, ')
          ..write('portionQuantity: $portionQuantity, ')
          ..write('portionUnit: $portionUnit, ')
          ..write('nutritionBasis: $nutritionBasis, ')
          ..write('referenceBasis: $referenceBasis, ')
          ..write('referenceKcal: $referenceKcal, ')
          ..write('referenceProteinG: $referenceProteinG, ')
          ..write('referenceCarbsG: $referenceCarbsG, ')
          ..write('referenceFatG: $referenceFatG, ')
          ..write('servingDescription: $servingDescription, ')
          ..write('servingGrams: $servingGrams, ')
          ..write('servingMilliliters: $servingMilliliters, ')
          ..write('servingUnit: $servingUnit, ')
          ..write('densityGPerMl: $densityGPerMl, ')
          ..write('originPackId: $originPackId, ')
          ..write('originFoodId: $originFoodId, ')
          ..write('originSource: $originSource, ')
          ..write('originSourceId: $originSourceId, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
    id,
    epochDay,
    meal,
    name,
    kcal,
    proteinG,
    carbsG,
    fatG,
    quantitySource,
    portionQuantity,
    portionUnit,
    nutritionBasis,
    referenceBasis,
    referenceKcal,
    referenceProteinG,
    referenceCarbsG,
    referenceFatG,
    servingDescription,
    servingGrams,
    servingMilliliters,
    servingUnit,
    densityGPerMl,
    originPackId,
    originFoodId,
    originSource,
    originSourceId,
    createdAt,
  ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is FoodRow &&
          other.id == this.id &&
          other.epochDay == this.epochDay &&
          other.meal == this.meal &&
          other.name == this.name &&
          other.kcal == this.kcal &&
          other.proteinG == this.proteinG &&
          other.carbsG == this.carbsG &&
          other.fatG == this.fatG &&
          other.quantitySource == this.quantitySource &&
          other.portionQuantity == this.portionQuantity &&
          other.portionUnit == this.portionUnit &&
          other.nutritionBasis == this.nutritionBasis &&
          other.referenceBasis == this.referenceBasis &&
          other.referenceKcal == this.referenceKcal &&
          other.referenceProteinG == this.referenceProteinG &&
          other.referenceCarbsG == this.referenceCarbsG &&
          other.referenceFatG == this.referenceFatG &&
          other.servingDescription == this.servingDescription &&
          other.servingGrams == this.servingGrams &&
          other.servingMilliliters == this.servingMilliliters &&
          other.servingUnit == this.servingUnit &&
          other.densityGPerMl == this.densityGPerMl &&
          other.originPackId == this.originPackId &&
          other.originFoodId == this.originFoodId &&
          other.originSource == this.originSource &&
          other.originSourceId == this.originSourceId &&
          other.createdAt == this.createdAt);
}

class FoodEntriesCompanion extends UpdateCompanion<FoodRow> {
  final Value<int> id;
  final Value<int> epochDay;
  final Value<Meal> meal;
  final Value<String> name;
  final Value<double> kcal;
  final Value<double> proteinG;
  final Value<double> carbsG;
  final Value<double> fatG;
  final Value<QuantitySource> quantitySource;
  final Value<double?> portionQuantity;
  final Value<PortionUnit?> portionUnit;
  final Value<NutritionBasis?> nutritionBasis;
  final Value<ReferenceBasis?> referenceBasis;
  final Value<double?> referenceKcal;
  final Value<double?> referenceProteinG;
  final Value<double?> referenceCarbsG;
  final Value<double?> referenceFatG;
  final Value<String?> servingDescription;
  final Value<double?> servingGrams;
  final Value<double?> servingMilliliters;
  final Value<PortionUnit?> servingUnit;
  final Value<double?> densityGPerMl;
  final Value<String?> originPackId;
  final Value<int?> originFoodId;
  final Value<String?> originSource;
  final Value<String?> originSourceId;
  final Value<DateTime> createdAt;
  const FoodEntriesCompanion({
    this.id = const Value.absent(),
    this.epochDay = const Value.absent(),
    this.meal = const Value.absent(),
    this.name = const Value.absent(),
    this.kcal = const Value.absent(),
    this.proteinG = const Value.absent(),
    this.carbsG = const Value.absent(),
    this.fatG = const Value.absent(),
    this.quantitySource = const Value.absent(),
    this.portionQuantity = const Value.absent(),
    this.portionUnit = const Value.absent(),
    this.nutritionBasis = const Value.absent(),
    this.referenceBasis = const Value.absent(),
    this.referenceKcal = const Value.absent(),
    this.referenceProteinG = const Value.absent(),
    this.referenceCarbsG = const Value.absent(),
    this.referenceFatG = const Value.absent(),
    this.servingDescription = const Value.absent(),
    this.servingGrams = const Value.absent(),
    this.servingMilliliters = const Value.absent(),
    this.servingUnit = const Value.absent(),
    this.densityGPerMl = const Value.absent(),
    this.originPackId = const Value.absent(),
    this.originFoodId = const Value.absent(),
    this.originSource = const Value.absent(),
    this.originSourceId = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  FoodEntriesCompanion.insert({
    this.id = const Value.absent(),
    required int epochDay,
    required Meal meal,
    required String name,
    required double kcal,
    required double proteinG,
    required double carbsG,
    required double fatG,
    required QuantitySource quantitySource,
    this.portionQuantity = const Value.absent(),
    this.portionUnit = const Value.absent(),
    this.nutritionBasis = const Value.absent(),
    this.referenceBasis = const Value.absent(),
    this.referenceKcal = const Value.absent(),
    this.referenceProteinG = const Value.absent(),
    this.referenceCarbsG = const Value.absent(),
    this.referenceFatG = const Value.absent(),
    this.servingDescription = const Value.absent(),
    this.servingGrams = const Value.absent(),
    this.servingMilliliters = const Value.absent(),
    this.servingUnit = const Value.absent(),
    this.densityGPerMl = const Value.absent(),
    this.originPackId = const Value.absent(),
    this.originFoodId = const Value.absent(),
    this.originSource = const Value.absent(),
    this.originSourceId = const Value.absent(),
    this.createdAt = const Value.absent(),
  }) : epochDay = Value(epochDay),
       meal = Value(meal),
       name = Value(name),
       kcal = Value(kcal),
       proteinG = Value(proteinG),
       carbsG = Value(carbsG),
       fatG = Value(fatG),
       quantitySource = Value(quantitySource);
  static Insertable<FoodRow> custom({
    Expression<int>? id,
    Expression<int>? epochDay,
    Expression<String>? meal,
    Expression<String>? name,
    Expression<double>? kcal,
    Expression<double>? proteinG,
    Expression<double>? carbsG,
    Expression<double>? fatG,
    Expression<String>? quantitySource,
    Expression<double>? portionQuantity,
    Expression<String>? portionUnit,
    Expression<String>? nutritionBasis,
    Expression<String>? referenceBasis,
    Expression<double>? referenceKcal,
    Expression<double>? referenceProteinG,
    Expression<double>? referenceCarbsG,
    Expression<double>? referenceFatG,
    Expression<String>? servingDescription,
    Expression<double>? servingGrams,
    Expression<double>? servingMilliliters,
    Expression<String>? servingUnit,
    Expression<double>? densityGPerMl,
    Expression<String>? originPackId,
    Expression<int>? originFoodId,
    Expression<String>? originSource,
    Expression<String>? originSourceId,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (epochDay != null) 'epoch_day': epochDay,
      if (meal != null) 'meal': meal,
      if (name != null) 'name': name,
      if (kcal != null) 'kcal': kcal,
      if (proteinG != null) 'protein_g': proteinG,
      if (carbsG != null) 'carbs_g': carbsG,
      if (fatG != null) 'fat_g': fatG,
      if (quantitySource != null) 'quantity_source': quantitySource,
      if (portionQuantity != null) 'portion_quantity': portionQuantity,
      if (portionUnit != null) 'portion_unit': portionUnit,
      if (nutritionBasis != null) 'nutrition_basis': nutritionBasis,
      if (referenceBasis != null) 'reference_basis': referenceBasis,
      if (referenceKcal != null) 'reference_kcal': referenceKcal,
      if (referenceProteinG != null) 'reference_protein_g': referenceProteinG,
      if (referenceCarbsG != null) 'reference_carbs_g': referenceCarbsG,
      if (referenceFatG != null) 'reference_fat_g': referenceFatG,
      if (servingDescription != null) 'serving_description': servingDescription,
      if (servingGrams != null) 'serving_grams': servingGrams,
      if (servingMilliliters != null) 'serving_milliliters': servingMilliliters,
      if (servingUnit != null) 'serving_unit': servingUnit,
      if (densityGPerMl != null) 'density_g_per_ml': densityGPerMl,
      if (originPackId != null) 'origin_pack_id': originPackId,
      if (originFoodId != null) 'origin_food_id': originFoodId,
      if (originSource != null) 'origin_source': originSource,
      if (originSourceId != null) 'origin_source_id': originSourceId,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  FoodEntriesCompanion copyWith({
    Value<int>? id,
    Value<int>? epochDay,
    Value<Meal>? meal,
    Value<String>? name,
    Value<double>? kcal,
    Value<double>? proteinG,
    Value<double>? carbsG,
    Value<double>? fatG,
    Value<QuantitySource>? quantitySource,
    Value<double?>? portionQuantity,
    Value<PortionUnit?>? portionUnit,
    Value<NutritionBasis?>? nutritionBasis,
    Value<ReferenceBasis?>? referenceBasis,
    Value<double?>? referenceKcal,
    Value<double?>? referenceProteinG,
    Value<double?>? referenceCarbsG,
    Value<double?>? referenceFatG,
    Value<String?>? servingDescription,
    Value<double?>? servingGrams,
    Value<double?>? servingMilliliters,
    Value<PortionUnit?>? servingUnit,
    Value<double?>? densityGPerMl,
    Value<String?>? originPackId,
    Value<int?>? originFoodId,
    Value<String?>? originSource,
    Value<String?>? originSourceId,
    Value<DateTime>? createdAt,
  }) {
    return FoodEntriesCompanion(
      id: id ?? this.id,
      epochDay: epochDay ?? this.epochDay,
      meal: meal ?? this.meal,
      name: name ?? this.name,
      kcal: kcal ?? this.kcal,
      proteinG: proteinG ?? this.proteinG,
      carbsG: carbsG ?? this.carbsG,
      fatG: fatG ?? this.fatG,
      quantitySource: quantitySource ?? this.quantitySource,
      portionQuantity: portionQuantity ?? this.portionQuantity,
      portionUnit: portionUnit ?? this.portionUnit,
      nutritionBasis: nutritionBasis ?? this.nutritionBasis,
      referenceBasis: referenceBasis ?? this.referenceBasis,
      referenceKcal: referenceKcal ?? this.referenceKcal,
      referenceProteinG: referenceProteinG ?? this.referenceProteinG,
      referenceCarbsG: referenceCarbsG ?? this.referenceCarbsG,
      referenceFatG: referenceFatG ?? this.referenceFatG,
      servingDescription: servingDescription ?? this.servingDescription,
      servingGrams: servingGrams ?? this.servingGrams,
      servingMilliliters: servingMilliliters ?? this.servingMilliliters,
      servingUnit: servingUnit ?? this.servingUnit,
      densityGPerMl: densityGPerMl ?? this.densityGPerMl,
      originPackId: originPackId ?? this.originPackId,
      originFoodId: originFoodId ?? this.originFoodId,
      originSource: originSource ?? this.originSource,
      originSourceId: originSourceId ?? this.originSourceId,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (epochDay.present) {
      map['epoch_day'] = Variable<int>(epochDay.value);
    }
    if (meal.present) {
      map['meal'] = Variable<String>(
        $FoodEntriesTable.$convertermeal.toSql(meal.value),
      );
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (kcal.present) {
      map['kcal'] = Variable<double>(kcal.value);
    }
    if (proteinG.present) {
      map['protein_g'] = Variable<double>(proteinG.value);
    }
    if (carbsG.present) {
      map['carbs_g'] = Variable<double>(carbsG.value);
    }
    if (fatG.present) {
      map['fat_g'] = Variable<double>(fatG.value);
    }
    if (quantitySource.present) {
      map['quantity_source'] = Variable<String>(
        $FoodEntriesTable.$converterquantitySource.toSql(quantitySource.value),
      );
    }
    if (portionQuantity.present) {
      map['portion_quantity'] = Variable<double>(portionQuantity.value);
    }
    if (portionUnit.present) {
      map['portion_unit'] = Variable<String>(
        $FoodEntriesTable.$converterportionUnitn.toSql(portionUnit.value),
      );
    }
    if (nutritionBasis.present) {
      map['nutrition_basis'] = Variable<String>(
        $FoodEntriesTable.$converternutritionBasisn.toSql(nutritionBasis.value),
      );
    }
    if (referenceBasis.present) {
      map['reference_basis'] = Variable<String>(
        $FoodEntriesTable.$converterreferenceBasisn.toSql(referenceBasis.value),
      );
    }
    if (referenceKcal.present) {
      map['reference_kcal'] = Variable<double>(referenceKcal.value);
    }
    if (referenceProteinG.present) {
      map['reference_protein_g'] = Variable<double>(referenceProteinG.value);
    }
    if (referenceCarbsG.present) {
      map['reference_carbs_g'] = Variable<double>(referenceCarbsG.value);
    }
    if (referenceFatG.present) {
      map['reference_fat_g'] = Variable<double>(referenceFatG.value);
    }
    if (servingDescription.present) {
      map['serving_description'] = Variable<String>(servingDescription.value);
    }
    if (servingGrams.present) {
      map['serving_grams'] = Variable<double>(servingGrams.value);
    }
    if (servingMilliliters.present) {
      map['serving_milliliters'] = Variable<double>(servingMilliliters.value);
    }
    if (servingUnit.present) {
      map['serving_unit'] = Variable<String>(
        $FoodEntriesTable.$converterservingUnitn.toSql(servingUnit.value),
      );
    }
    if (densityGPerMl.present) {
      map['density_g_per_ml'] = Variable<double>(densityGPerMl.value);
    }
    if (originPackId.present) {
      map['origin_pack_id'] = Variable<String>(originPackId.value);
    }
    if (originFoodId.present) {
      map['origin_food_id'] = Variable<int>(originFoodId.value);
    }
    if (originSource.present) {
      map['origin_source'] = Variable<String>(originSource.value);
    }
    if (originSourceId.present) {
      map['origin_source_id'] = Variable<String>(originSourceId.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FoodEntriesCompanion(')
          ..write('id: $id, ')
          ..write('epochDay: $epochDay, ')
          ..write('meal: $meal, ')
          ..write('name: $name, ')
          ..write('kcal: $kcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('carbsG: $carbsG, ')
          ..write('fatG: $fatG, ')
          ..write('quantitySource: $quantitySource, ')
          ..write('portionQuantity: $portionQuantity, ')
          ..write('portionUnit: $portionUnit, ')
          ..write('nutritionBasis: $nutritionBasis, ')
          ..write('referenceBasis: $referenceBasis, ')
          ..write('referenceKcal: $referenceKcal, ')
          ..write('referenceProteinG: $referenceProteinG, ')
          ..write('referenceCarbsG: $referenceCarbsG, ')
          ..write('referenceFatG: $referenceFatG, ')
          ..write('servingDescription: $servingDescription, ')
          ..write('servingGrams: $servingGrams, ')
          ..write('servingMilliliters: $servingMilliliters, ')
          ..write('servingUnit: $servingUnit, ')
          ..write('densityGPerMl: $densityGPerMl, ')
          ..write('originPackId: $originPackId, ')
          ..write('originFoodId: $originFoodId, ')
          ..write('originSource: $originSource, ')
          ..write('originSourceId: $originSourceId, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

class $DayMarksTable extends DayMarks
    with TableInfo<$DayMarksTable, DayMarkRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $DayMarksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _epochDayMeta = const VerificationMeta(
    'epochDay',
  );
  @override
  late final GeneratedColumn<int> epochDay = GeneratedColumn<int>(
    'epoch_day',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  @override
  late final GeneratedColumnWithTypeConverter<DayCompleteness, String>
  completeness = GeneratedColumn<String>(
    'completeness',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  ).withConverter<DayCompleteness>($DayMarksTable.$convertercompleteness);
  @override
  List<GeneratedColumn> get $columns => [epochDay, completeness];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'day_marks';
  @override
  VerificationContext validateIntegrity(
    Insertable<DayMarkRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('epoch_day')) {
      context.handle(
        _epochDayMeta,
        epochDay.isAcceptableOrUnknown(data['epoch_day']!, _epochDayMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {epochDay};
  @override
  DayMarkRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return DayMarkRow(
      epochDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}epoch_day'],
      )!,
      completeness: $DayMarksTable.$convertercompleteness.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}completeness'],
        )!,
      ),
    );
  }

  @override
  $DayMarksTable createAlias(String alias) {
    return $DayMarksTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<DayCompleteness, String, String>
  $convertercompleteness = const EnumNameConverter<DayCompleteness>(
    DayCompleteness.values,
  );
}

class DayMarkRow extends DataClass implements Insertable<DayMarkRow> {
  final int epochDay;
  final DayCompleteness completeness;
  const DayMarkRow({required this.epochDay, required this.completeness});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['epoch_day'] = Variable<int>(epochDay);
    {
      map['completeness'] = Variable<String>(
        $DayMarksTable.$convertercompleteness.toSql(completeness),
      );
    }
    return map;
  }

  DayMarksCompanion toCompanion(bool nullToAbsent) {
    return DayMarksCompanion(
      epochDay: Value(epochDay),
      completeness: Value(completeness),
    );
  }

  factory DayMarkRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return DayMarkRow(
      epochDay: serializer.fromJson<int>(json['epochDay']),
      completeness: $DayMarksTable.$convertercompleteness.fromJson(
        serializer.fromJson<String>(json['completeness']),
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'epochDay': serializer.toJson<int>(epochDay),
      'completeness': serializer.toJson<String>(
        $DayMarksTable.$convertercompleteness.toJson(completeness),
      ),
    };
  }

  DayMarkRow copyWith({int? epochDay, DayCompleteness? completeness}) =>
      DayMarkRow(
        epochDay: epochDay ?? this.epochDay,
        completeness: completeness ?? this.completeness,
      );
  DayMarkRow copyWithCompanion(DayMarksCompanion data) {
    return DayMarkRow(
      epochDay: data.epochDay.present ? data.epochDay.value : this.epochDay,
      completeness: data.completeness.present
          ? data.completeness.value
          : this.completeness,
    );
  }

  @override
  String toString() {
    return (StringBuffer('DayMarkRow(')
          ..write('epochDay: $epochDay, ')
          ..write('completeness: $completeness')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(epochDay, completeness);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is DayMarkRow &&
          other.epochDay == this.epochDay &&
          other.completeness == this.completeness);
}

class DayMarksCompanion extends UpdateCompanion<DayMarkRow> {
  final Value<int> epochDay;
  final Value<DayCompleteness> completeness;
  const DayMarksCompanion({
    this.epochDay = const Value.absent(),
    this.completeness = const Value.absent(),
  });
  DayMarksCompanion.insert({
    this.epochDay = const Value.absent(),
    required DayCompleteness completeness,
  }) : completeness = Value(completeness);
  static Insertable<DayMarkRow> custom({
    Expression<int>? epochDay,
    Expression<String>? completeness,
  }) {
    return RawValuesInsertable({
      if (epochDay != null) 'epoch_day': epochDay,
      if (completeness != null) 'completeness': completeness,
    });
  }

  DayMarksCompanion copyWith({
    Value<int>? epochDay,
    Value<DayCompleteness>? completeness,
  }) {
    return DayMarksCompanion(
      epochDay: epochDay ?? this.epochDay,
      completeness: completeness ?? this.completeness,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (epochDay.present) {
      map['epoch_day'] = Variable<int>(epochDay.value);
    }
    if (completeness.present) {
      map['completeness'] = Variable<String>(
        $DayMarksTable.$convertercompleteness.toSql(completeness.value),
      );
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('DayMarksCompanion(')
          ..write('epochDay: $epochDay, ')
          ..write('completeness: $completeness')
          ..write(')'))
        .toString();
  }
}

class $WaistEntriesTable extends WaistEntries
    with TableInfo<$WaistEntriesTable, WaistRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $WaistEntriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _epochDayMeta = const VerificationMeta(
    'epochDay',
  );
  @override
  late final GeneratedColumn<int> epochDay = GeneratedColumn<int>(
    'epoch_day',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _waistCmMeta = const VerificationMeta(
    'waistCm',
  );
  @override
  late final GeneratedColumn<double> waistCm = GeneratedColumn<double>(
    'waist_cm',
    aliasedName,
    false,
    check: () => ComparableExpr(waistCm).isBetweenValues(30, 300),
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [epochDay, waistCm];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'waist_entries';
  @override
  VerificationContext validateIntegrity(
    Insertable<WaistRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('epoch_day')) {
      context.handle(
        _epochDayMeta,
        epochDay.isAcceptableOrUnknown(data['epoch_day']!, _epochDayMeta),
      );
    }
    if (data.containsKey('waist_cm')) {
      context.handle(
        _waistCmMeta,
        waistCm.isAcceptableOrUnknown(data['waist_cm']!, _waistCmMeta),
      );
    } else if (isInserting) {
      context.missing(_waistCmMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {epochDay};
  @override
  WaistRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return WaistRow(
      epochDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}epoch_day'],
      )!,
      waistCm: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}waist_cm'],
      )!,
    );
  }

  @override
  $WaistEntriesTable createAlias(String alias) {
    return $WaistEntriesTable(attachedDatabase, alias);
  }
}

class WaistRow extends DataClass implements Insertable<WaistRow> {
  final int epochDay;
  final double waistCm;
  const WaistRow({required this.epochDay, required this.waistCm});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['epoch_day'] = Variable<int>(epochDay);
    map['waist_cm'] = Variable<double>(waistCm);
    return map;
  }

  WaistEntriesCompanion toCompanion(bool nullToAbsent) {
    return WaistEntriesCompanion(
      epochDay: Value(epochDay),
      waistCm: Value(waistCm),
    );
  }

  factory WaistRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return WaistRow(
      epochDay: serializer.fromJson<int>(json['epochDay']),
      waistCm: serializer.fromJson<double>(json['waistCm']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'epochDay': serializer.toJson<int>(epochDay),
      'waistCm': serializer.toJson<double>(waistCm),
    };
  }

  WaistRow copyWith({int? epochDay, double? waistCm}) => WaistRow(
    epochDay: epochDay ?? this.epochDay,
    waistCm: waistCm ?? this.waistCm,
  );
  WaistRow copyWithCompanion(WaistEntriesCompanion data) {
    return WaistRow(
      epochDay: data.epochDay.present ? data.epochDay.value : this.epochDay,
      waistCm: data.waistCm.present ? data.waistCm.value : this.waistCm,
    );
  }

  @override
  String toString() {
    return (StringBuffer('WaistRow(')
          ..write('epochDay: $epochDay, ')
          ..write('waistCm: $waistCm')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(epochDay, waistCm);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is WaistRow &&
          other.epochDay == this.epochDay &&
          other.waistCm == this.waistCm);
}

class WaistEntriesCompanion extends UpdateCompanion<WaistRow> {
  final Value<int> epochDay;
  final Value<double> waistCm;
  const WaistEntriesCompanion({
    this.epochDay = const Value.absent(),
    this.waistCm = const Value.absent(),
  });
  WaistEntriesCompanion.insert({
    this.epochDay = const Value.absent(),
    required double waistCm,
  }) : waistCm = Value(waistCm);
  static Insertable<WaistRow> custom({
    Expression<int>? epochDay,
    Expression<double>? waistCm,
  }) {
    return RawValuesInsertable({
      if (epochDay != null) 'epoch_day': epochDay,
      if (waistCm != null) 'waist_cm': waistCm,
    });
  }

  WaistEntriesCompanion copyWith({
    Value<int>? epochDay,
    Value<double>? waistCm,
  }) {
    return WaistEntriesCompanion(
      epochDay: epochDay ?? this.epochDay,
      waistCm: waistCm ?? this.waistCm,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (epochDay.present) {
      map['epoch_day'] = Variable<int>(epochDay.value);
    }
    if (waistCm.present) {
      map['waist_cm'] = Variable<double>(waistCm.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('WaistEntriesCompanion(')
          ..write('epochDay: $epochDay, ')
          ..write('waistCm: $waistCm')
          ..write(')'))
        .toString();
  }
}

class $TargetsHistoryTable extends TargetsHistory
    with TableInfo<$TargetsHistoryTable, TargetsRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TargetsHistoryTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _effectiveEpochDayMeta = const VerificationMeta(
    'effectiveEpochDay',
  );
  @override
  late final GeneratedColumn<int> effectiveEpochDay = GeneratedColumn<int>(
    'effective_epoch_day',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  @override
  late final GeneratedColumnWithTypeConverter<GoalMode, String> mode =
      GeneratedColumn<String>(
        'mode',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<GoalMode>($TargetsHistoryTable.$convertermode);
  static const VerificationMeta _kcalMeta = const VerificationMeta('kcal');
  @override
  late final GeneratedColumn<double> kcal = GeneratedColumn<double>(
    'kcal',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _proteinGMeta = const VerificationMeta(
    'proteinG',
  );
  @override
  late final GeneratedColumn<double> proteinG = GeneratedColumn<double>(
    'protein_g',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _proteinMinimumGMeta = const VerificationMeta(
    'proteinMinimumG',
  );
  @override
  late final GeneratedColumn<double> proteinMinimumG = GeneratedColumn<double>(
    'protein_minimum_g',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _fatGMeta = const VerificationMeta('fatG');
  @override
  late final GeneratedColumn<double> fatG = GeneratedColumn<double>(
    'fat_g',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _carbsGMeta = const VerificationMeta('carbsG');
  @override
  late final GeneratedColumn<double> carbsG = GeneratedColumn<double>(
    'carbs_g',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _weeklyRateFractionMeta =
      const VerificationMeta('weeklyRateFraction');
  @override
  late final GeneratedColumn<double> weeklyRateFraction =
      GeneratedColumn<double>(
        'weekly_rate_fraction',
        aliasedName,
        false,
        type: DriftSqlType.double,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _flagsMeta = const VerificationMeta('flags');
  @override
  late final GeneratedColumn<String> flags = GeneratedColumn<String>(
    'flags',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _tdeeKcalMeta = const VerificationMeta(
    'tdeeKcal',
  );
  @override
  late final GeneratedColumn<double> tdeeKcal = GeneratedColumn<double>(
    'tdee_kcal',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _tdeeSigmaKcalMeta = const VerificationMeta(
    'tdeeSigmaKcal',
  );
  @override
  late final GeneratedColumn<double> tdeeSigmaKcal = GeneratedColumn<double>(
    'tdee_sigma_kcal',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _explanationMeta = const VerificationMeta(
    'explanation',
  );
  @override
  late final GeneratedColumn<String> explanation = GeneratedColumn<String>(
    'explanation',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _summarySeenMeta = const VerificationMeta(
    'summarySeen',
  );
  @override
  late final GeneratedColumn<bool> summarySeen = GeneratedColumn<bool>(
    'summary_seen',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("summary_seen" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  static const VerificationMeta _targetRulesVersionMeta =
      const VerificationMeta('targetRulesVersion');
  @override
  late final GeneratedColumn<int> targetRulesVersion = GeneratedColumn<int>(
    'target_rules_version',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(currentTargetRulesVersion),
  );
  static const VerificationMeta _profileRevisionMeta = const VerificationMeta(
    'profileRevision',
  );
  @override
  late final GeneratedColumn<int> profileRevision = GeneratedColumn<int>(
    'profile_revision',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _safetyBodyFatPercentMeta =
      const VerificationMeta('safetyBodyFatPercent');
  @override
  late final GeneratedColumn<double> safetyBodyFatPercent =
      GeneratedColumn<double>(
        'safety_body_fat_percent',
        aliasedName,
        true,
        type: DriftSqlType.double,
        requiredDuringInsert: false,
      );
  @override
  late final GeneratedColumnWithTypeConverter<TdeeStatus, String> tdeeStatus =
      GeneratedColumn<String>(
        'tdee_status',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<TdeeStatus>($TargetsHistoryTable.$convertertdeeStatus);
  @override
  List<GeneratedColumn> get $columns => [
    effectiveEpochDay,
    mode,
    kcal,
    proteinG,
    proteinMinimumG,
    fatG,
    carbsG,
    weeklyRateFraction,
    flags,
    tdeeKcal,
    tdeeSigmaKcal,
    explanation,
    summarySeen,
    targetRulesVersion,
    profileRevision,
    safetyBodyFatPercent,
    tdeeStatus,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'targets_history';
  @override
  VerificationContext validateIntegrity(
    Insertable<TargetsRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('effective_epoch_day')) {
      context.handle(
        _effectiveEpochDayMeta,
        effectiveEpochDay.isAcceptableOrUnknown(
          data['effective_epoch_day']!,
          _effectiveEpochDayMeta,
        ),
      );
    }
    if (data.containsKey('kcal')) {
      context.handle(
        _kcalMeta,
        kcal.isAcceptableOrUnknown(data['kcal']!, _kcalMeta),
      );
    } else if (isInserting) {
      context.missing(_kcalMeta);
    }
    if (data.containsKey('protein_g')) {
      context.handle(
        _proteinGMeta,
        proteinG.isAcceptableOrUnknown(data['protein_g']!, _proteinGMeta),
      );
    } else if (isInserting) {
      context.missing(_proteinGMeta);
    }
    if (data.containsKey('protein_minimum_g')) {
      context.handle(
        _proteinMinimumGMeta,
        proteinMinimumG.isAcceptableOrUnknown(
          data['protein_minimum_g']!,
          _proteinMinimumGMeta,
        ),
      );
    }
    if (data.containsKey('fat_g')) {
      context.handle(
        _fatGMeta,
        fatG.isAcceptableOrUnknown(data['fat_g']!, _fatGMeta),
      );
    } else if (isInserting) {
      context.missing(_fatGMeta);
    }
    if (data.containsKey('carbs_g')) {
      context.handle(
        _carbsGMeta,
        carbsG.isAcceptableOrUnknown(data['carbs_g']!, _carbsGMeta),
      );
    } else if (isInserting) {
      context.missing(_carbsGMeta);
    }
    if (data.containsKey('weekly_rate_fraction')) {
      context.handle(
        _weeklyRateFractionMeta,
        weeklyRateFraction.isAcceptableOrUnknown(
          data['weekly_rate_fraction']!,
          _weeklyRateFractionMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_weeklyRateFractionMeta);
    }
    if (data.containsKey('flags')) {
      context.handle(
        _flagsMeta,
        flags.isAcceptableOrUnknown(data['flags']!, _flagsMeta),
      );
    }
    if (data.containsKey('tdee_kcal')) {
      context.handle(
        _tdeeKcalMeta,
        tdeeKcal.isAcceptableOrUnknown(data['tdee_kcal']!, _tdeeKcalMeta),
      );
    } else if (isInserting) {
      context.missing(_tdeeKcalMeta);
    }
    if (data.containsKey('tdee_sigma_kcal')) {
      context.handle(
        _tdeeSigmaKcalMeta,
        tdeeSigmaKcal.isAcceptableOrUnknown(
          data['tdee_sigma_kcal']!,
          _tdeeSigmaKcalMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_tdeeSigmaKcalMeta);
    }
    if (data.containsKey('explanation')) {
      context.handle(
        _explanationMeta,
        explanation.isAcceptableOrUnknown(
          data['explanation']!,
          _explanationMeta,
        ),
      );
    }
    if (data.containsKey('summary_seen')) {
      context.handle(
        _summarySeenMeta,
        summarySeen.isAcceptableOrUnknown(
          data['summary_seen']!,
          _summarySeenMeta,
        ),
      );
    }
    if (data.containsKey('target_rules_version')) {
      context.handle(
        _targetRulesVersionMeta,
        targetRulesVersion.isAcceptableOrUnknown(
          data['target_rules_version']!,
          _targetRulesVersionMeta,
        ),
      );
    }
    if (data.containsKey('profile_revision')) {
      context.handle(
        _profileRevisionMeta,
        profileRevision.isAcceptableOrUnknown(
          data['profile_revision']!,
          _profileRevisionMeta,
        ),
      );
    }
    if (data.containsKey('safety_body_fat_percent')) {
      context.handle(
        _safetyBodyFatPercentMeta,
        safetyBodyFatPercent.isAcceptableOrUnknown(
          data['safety_body_fat_percent']!,
          _safetyBodyFatPercentMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {effectiveEpochDay};
  @override
  TargetsRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return TargetsRow(
      effectiveEpochDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}effective_epoch_day'],
      )!,
      mode: $TargetsHistoryTable.$convertermode.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}mode'],
        )!,
      ),
      kcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}kcal'],
      )!,
      proteinG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}protein_g'],
      )!,
      proteinMinimumG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}protein_minimum_g'],
      ),
      fatG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}fat_g'],
      )!,
      carbsG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}carbs_g'],
      )!,
      weeklyRateFraction: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}weekly_rate_fraction'],
      )!,
      flags: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}flags'],
      )!,
      tdeeKcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}tdee_kcal'],
      )!,
      tdeeSigmaKcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}tdee_sigma_kcal'],
      )!,
      explanation: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}explanation'],
      ),
      summarySeen: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}summary_seen'],
      )!,
      targetRulesVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}target_rules_version'],
      )!,
      profileRevision: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}profile_revision'],
      )!,
      safetyBodyFatPercent: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}safety_body_fat_percent'],
      ),
      tdeeStatus: $TargetsHistoryTable.$convertertdeeStatus.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}tdee_status'],
        )!,
      ),
    );
  }

  @override
  $TargetsHistoryTable createAlias(String alias) {
    return $TargetsHistoryTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<GoalMode, String, String> $convertermode =
      const EnumNameConverter<GoalMode>(GoalMode.values);
  static JsonTypeConverter2<TdeeStatus, String, String> $convertertdeeStatus =
      const EnumNameConverter<TdeeStatus>(TdeeStatus.values);
}

class TargetsRow extends DataClass implements Insertable<TargetsRow> {
  final int effectiveEpochDay;
  final GoalMode mode;
  final double kcal;
  final double proteinG;
  final double? proteinMinimumG;
  final double fatG;
  final double carbsG;
  final double weeklyRateFraction;

  /// Comma-separated `TargetFlag` names.
  final String flags;
  final double tdeeKcal;
  final double tdeeSigmaKcal;

  /// Why these targets were issued, as JSON (`TargetsExplanation.encode`).
  /// Added in schema version 5 (MM-138); null on older rows.
  final String? explanation;

  /// Existing target history should not trigger new summary dialogs.
  final bool summarySeen;

  /// Rules used to issue targets; bump [currentTargetRulesVersion] when target
  /// calculation behavior changes.
  final int targetRulesVersion;

  /// Added in schema version 4 (MM-83); older rows read as 0.
  final int profileRevision;

  /// Added in schema version 3 (MM-132); null on older rows.
  final double? safetyBodyFatPercent;
  final TdeeStatus tdeeStatus;
  const TargetsRow({
    required this.effectiveEpochDay,
    required this.mode,
    required this.kcal,
    required this.proteinG,
    this.proteinMinimumG,
    required this.fatG,
    required this.carbsG,
    required this.weeklyRateFraction,
    required this.flags,
    required this.tdeeKcal,
    required this.tdeeSigmaKcal,
    this.explanation,
    required this.summarySeen,
    required this.targetRulesVersion,
    required this.profileRevision,
    this.safetyBodyFatPercent,
    required this.tdeeStatus,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['effective_epoch_day'] = Variable<int>(effectiveEpochDay);
    {
      map['mode'] = Variable<String>(
        $TargetsHistoryTable.$convertermode.toSql(mode),
      );
    }
    map['kcal'] = Variable<double>(kcal);
    map['protein_g'] = Variable<double>(proteinG);
    if (!nullToAbsent || proteinMinimumG != null) {
      map['protein_minimum_g'] = Variable<double>(proteinMinimumG);
    }
    map['fat_g'] = Variable<double>(fatG);
    map['carbs_g'] = Variable<double>(carbsG);
    map['weekly_rate_fraction'] = Variable<double>(weeklyRateFraction);
    map['flags'] = Variable<String>(flags);
    map['tdee_kcal'] = Variable<double>(tdeeKcal);
    map['tdee_sigma_kcal'] = Variable<double>(tdeeSigmaKcal);
    if (!nullToAbsent || explanation != null) {
      map['explanation'] = Variable<String>(explanation);
    }
    map['summary_seen'] = Variable<bool>(summarySeen);
    map['target_rules_version'] = Variable<int>(targetRulesVersion);
    map['profile_revision'] = Variable<int>(profileRevision);
    if (!nullToAbsent || safetyBodyFatPercent != null) {
      map['safety_body_fat_percent'] = Variable<double>(safetyBodyFatPercent);
    }
    {
      map['tdee_status'] = Variable<String>(
        $TargetsHistoryTable.$convertertdeeStatus.toSql(tdeeStatus),
      );
    }
    return map;
  }

  TargetsHistoryCompanion toCompanion(bool nullToAbsent) {
    return TargetsHistoryCompanion(
      effectiveEpochDay: Value(effectiveEpochDay),
      mode: Value(mode),
      kcal: Value(kcal),
      proteinG: Value(proteinG),
      proteinMinimumG: proteinMinimumG == null && nullToAbsent
          ? const Value.absent()
          : Value(proteinMinimumG),
      fatG: Value(fatG),
      carbsG: Value(carbsG),
      weeklyRateFraction: Value(weeklyRateFraction),
      flags: Value(flags),
      tdeeKcal: Value(tdeeKcal),
      tdeeSigmaKcal: Value(tdeeSigmaKcal),
      explanation: explanation == null && nullToAbsent
          ? const Value.absent()
          : Value(explanation),
      summarySeen: Value(summarySeen),
      targetRulesVersion: Value(targetRulesVersion),
      profileRevision: Value(profileRevision),
      safetyBodyFatPercent: safetyBodyFatPercent == null && nullToAbsent
          ? const Value.absent()
          : Value(safetyBodyFatPercent),
      tdeeStatus: Value(tdeeStatus),
    );
  }

  factory TargetsRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return TargetsRow(
      effectiveEpochDay: serializer.fromJson<int>(json['effectiveEpochDay']),
      mode: $TargetsHistoryTable.$convertermode.fromJson(
        serializer.fromJson<String>(json['mode']),
      ),
      kcal: serializer.fromJson<double>(json['kcal']),
      proteinG: serializer.fromJson<double>(json['proteinG']),
      proteinMinimumG: serializer.fromJson<double?>(json['proteinMinimumG']),
      fatG: serializer.fromJson<double>(json['fatG']),
      carbsG: serializer.fromJson<double>(json['carbsG']),
      weeklyRateFraction: serializer.fromJson<double>(
        json['weeklyRateFraction'],
      ),
      flags: serializer.fromJson<String>(json['flags']),
      tdeeKcal: serializer.fromJson<double>(json['tdeeKcal']),
      tdeeSigmaKcal: serializer.fromJson<double>(json['tdeeSigmaKcal']),
      explanation: serializer.fromJson<String?>(json['explanation']),
      summarySeen: serializer.fromJson<bool>(json['summarySeen']),
      targetRulesVersion: serializer.fromJson<int>(json['targetRulesVersion']),
      profileRevision: serializer.fromJson<int>(json['profileRevision']),
      safetyBodyFatPercent: serializer.fromJson<double?>(
        json['safetyBodyFatPercent'],
      ),
      tdeeStatus: $TargetsHistoryTable.$convertertdeeStatus.fromJson(
        serializer.fromJson<String>(json['tdeeStatus']),
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'effectiveEpochDay': serializer.toJson<int>(effectiveEpochDay),
      'mode': serializer.toJson<String>(
        $TargetsHistoryTable.$convertermode.toJson(mode),
      ),
      'kcal': serializer.toJson<double>(kcal),
      'proteinG': serializer.toJson<double>(proteinG),
      'proteinMinimumG': serializer.toJson<double?>(proteinMinimumG),
      'fatG': serializer.toJson<double>(fatG),
      'carbsG': serializer.toJson<double>(carbsG),
      'weeklyRateFraction': serializer.toJson<double>(weeklyRateFraction),
      'flags': serializer.toJson<String>(flags),
      'tdeeKcal': serializer.toJson<double>(tdeeKcal),
      'tdeeSigmaKcal': serializer.toJson<double>(tdeeSigmaKcal),
      'explanation': serializer.toJson<String?>(explanation),
      'summarySeen': serializer.toJson<bool>(summarySeen),
      'targetRulesVersion': serializer.toJson<int>(targetRulesVersion),
      'profileRevision': serializer.toJson<int>(profileRevision),
      'safetyBodyFatPercent': serializer.toJson<double?>(safetyBodyFatPercent),
      'tdeeStatus': serializer.toJson<String>(
        $TargetsHistoryTable.$convertertdeeStatus.toJson(tdeeStatus),
      ),
    };
  }

  TargetsRow copyWith({
    int? effectiveEpochDay,
    GoalMode? mode,
    double? kcal,
    double? proteinG,
    Value<double?> proteinMinimumG = const Value.absent(),
    double? fatG,
    double? carbsG,
    double? weeklyRateFraction,
    String? flags,
    double? tdeeKcal,
    double? tdeeSigmaKcal,
    Value<String?> explanation = const Value.absent(),
    bool? summarySeen,
    int? targetRulesVersion,
    int? profileRevision,
    Value<double?> safetyBodyFatPercent = const Value.absent(),
    TdeeStatus? tdeeStatus,
  }) => TargetsRow(
    effectiveEpochDay: effectiveEpochDay ?? this.effectiveEpochDay,
    mode: mode ?? this.mode,
    kcal: kcal ?? this.kcal,
    proteinG: proteinG ?? this.proteinG,
    proteinMinimumG: proteinMinimumG.present
        ? proteinMinimumG.value
        : this.proteinMinimumG,
    fatG: fatG ?? this.fatG,
    carbsG: carbsG ?? this.carbsG,
    weeklyRateFraction: weeklyRateFraction ?? this.weeklyRateFraction,
    flags: flags ?? this.flags,
    tdeeKcal: tdeeKcal ?? this.tdeeKcal,
    tdeeSigmaKcal: tdeeSigmaKcal ?? this.tdeeSigmaKcal,
    explanation: explanation.present ? explanation.value : this.explanation,
    summarySeen: summarySeen ?? this.summarySeen,
    targetRulesVersion: targetRulesVersion ?? this.targetRulesVersion,
    profileRevision: profileRevision ?? this.profileRevision,
    safetyBodyFatPercent: safetyBodyFatPercent.present
        ? safetyBodyFatPercent.value
        : this.safetyBodyFatPercent,
    tdeeStatus: tdeeStatus ?? this.tdeeStatus,
  );
  TargetsRow copyWithCompanion(TargetsHistoryCompanion data) {
    return TargetsRow(
      effectiveEpochDay: data.effectiveEpochDay.present
          ? data.effectiveEpochDay.value
          : this.effectiveEpochDay,
      mode: data.mode.present ? data.mode.value : this.mode,
      kcal: data.kcal.present ? data.kcal.value : this.kcal,
      proteinG: data.proteinG.present ? data.proteinG.value : this.proteinG,
      proteinMinimumG: data.proteinMinimumG.present
          ? data.proteinMinimumG.value
          : this.proteinMinimumG,
      fatG: data.fatG.present ? data.fatG.value : this.fatG,
      carbsG: data.carbsG.present ? data.carbsG.value : this.carbsG,
      weeklyRateFraction: data.weeklyRateFraction.present
          ? data.weeklyRateFraction.value
          : this.weeklyRateFraction,
      flags: data.flags.present ? data.flags.value : this.flags,
      tdeeKcal: data.tdeeKcal.present ? data.tdeeKcal.value : this.tdeeKcal,
      tdeeSigmaKcal: data.tdeeSigmaKcal.present
          ? data.tdeeSigmaKcal.value
          : this.tdeeSigmaKcal,
      explanation: data.explanation.present
          ? data.explanation.value
          : this.explanation,
      summarySeen: data.summarySeen.present
          ? data.summarySeen.value
          : this.summarySeen,
      targetRulesVersion: data.targetRulesVersion.present
          ? data.targetRulesVersion.value
          : this.targetRulesVersion,
      profileRevision: data.profileRevision.present
          ? data.profileRevision.value
          : this.profileRevision,
      safetyBodyFatPercent: data.safetyBodyFatPercent.present
          ? data.safetyBodyFatPercent.value
          : this.safetyBodyFatPercent,
      tdeeStatus: data.tdeeStatus.present
          ? data.tdeeStatus.value
          : this.tdeeStatus,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TargetsRow(')
          ..write('effectiveEpochDay: $effectiveEpochDay, ')
          ..write('mode: $mode, ')
          ..write('kcal: $kcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('proteinMinimumG: $proteinMinimumG, ')
          ..write('fatG: $fatG, ')
          ..write('carbsG: $carbsG, ')
          ..write('weeklyRateFraction: $weeklyRateFraction, ')
          ..write('flags: $flags, ')
          ..write('tdeeKcal: $tdeeKcal, ')
          ..write('tdeeSigmaKcal: $tdeeSigmaKcal, ')
          ..write('explanation: $explanation, ')
          ..write('summarySeen: $summarySeen, ')
          ..write('targetRulesVersion: $targetRulesVersion, ')
          ..write('profileRevision: $profileRevision, ')
          ..write('safetyBodyFatPercent: $safetyBodyFatPercent, ')
          ..write('tdeeStatus: $tdeeStatus')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    effectiveEpochDay,
    mode,
    kcal,
    proteinG,
    proteinMinimumG,
    fatG,
    carbsG,
    weeklyRateFraction,
    flags,
    tdeeKcal,
    tdeeSigmaKcal,
    explanation,
    summarySeen,
    targetRulesVersion,
    profileRevision,
    safetyBodyFatPercent,
    tdeeStatus,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is TargetsRow &&
          other.effectiveEpochDay == this.effectiveEpochDay &&
          other.mode == this.mode &&
          other.kcal == this.kcal &&
          other.proteinG == this.proteinG &&
          other.proteinMinimumG == this.proteinMinimumG &&
          other.fatG == this.fatG &&
          other.carbsG == this.carbsG &&
          other.weeklyRateFraction == this.weeklyRateFraction &&
          other.flags == this.flags &&
          other.tdeeKcal == this.tdeeKcal &&
          other.tdeeSigmaKcal == this.tdeeSigmaKcal &&
          other.explanation == this.explanation &&
          other.summarySeen == this.summarySeen &&
          other.targetRulesVersion == this.targetRulesVersion &&
          other.profileRevision == this.profileRevision &&
          other.safetyBodyFatPercent == this.safetyBodyFatPercent &&
          other.tdeeStatus == this.tdeeStatus);
}

class TargetsHistoryCompanion extends UpdateCompanion<TargetsRow> {
  final Value<int> effectiveEpochDay;
  final Value<GoalMode> mode;
  final Value<double> kcal;
  final Value<double> proteinG;
  final Value<double?> proteinMinimumG;
  final Value<double> fatG;
  final Value<double> carbsG;
  final Value<double> weeklyRateFraction;
  final Value<String> flags;
  final Value<double> tdeeKcal;
  final Value<double> tdeeSigmaKcal;
  final Value<String?> explanation;
  final Value<bool> summarySeen;
  final Value<int> targetRulesVersion;
  final Value<int> profileRevision;
  final Value<double?> safetyBodyFatPercent;
  final Value<TdeeStatus> tdeeStatus;
  const TargetsHistoryCompanion({
    this.effectiveEpochDay = const Value.absent(),
    this.mode = const Value.absent(),
    this.kcal = const Value.absent(),
    this.proteinG = const Value.absent(),
    this.proteinMinimumG = const Value.absent(),
    this.fatG = const Value.absent(),
    this.carbsG = const Value.absent(),
    this.weeklyRateFraction = const Value.absent(),
    this.flags = const Value.absent(),
    this.tdeeKcal = const Value.absent(),
    this.tdeeSigmaKcal = const Value.absent(),
    this.explanation = const Value.absent(),
    this.summarySeen = const Value.absent(),
    this.targetRulesVersion = const Value.absent(),
    this.profileRevision = const Value.absent(),
    this.safetyBodyFatPercent = const Value.absent(),
    this.tdeeStatus = const Value.absent(),
  });
  TargetsHistoryCompanion.insert({
    this.effectiveEpochDay = const Value.absent(),
    required GoalMode mode,
    required double kcal,
    required double proteinG,
    this.proteinMinimumG = const Value.absent(),
    required double fatG,
    required double carbsG,
    required double weeklyRateFraction,
    this.flags = const Value.absent(),
    required double tdeeKcal,
    required double tdeeSigmaKcal,
    this.explanation = const Value.absent(),
    this.summarySeen = const Value.absent(),
    this.targetRulesVersion = const Value.absent(),
    this.profileRevision = const Value.absent(),
    this.safetyBodyFatPercent = const Value.absent(),
    required TdeeStatus tdeeStatus,
  }) : mode = Value(mode),
       kcal = Value(kcal),
       proteinG = Value(proteinG),
       fatG = Value(fatG),
       carbsG = Value(carbsG),
       weeklyRateFraction = Value(weeklyRateFraction),
       tdeeKcal = Value(tdeeKcal),
       tdeeSigmaKcal = Value(tdeeSigmaKcal),
       tdeeStatus = Value(tdeeStatus);
  static Insertable<TargetsRow> custom({
    Expression<int>? effectiveEpochDay,
    Expression<String>? mode,
    Expression<double>? kcal,
    Expression<double>? proteinG,
    Expression<double>? proteinMinimumG,
    Expression<double>? fatG,
    Expression<double>? carbsG,
    Expression<double>? weeklyRateFraction,
    Expression<String>? flags,
    Expression<double>? tdeeKcal,
    Expression<double>? tdeeSigmaKcal,
    Expression<String>? explanation,
    Expression<bool>? summarySeen,
    Expression<int>? targetRulesVersion,
    Expression<int>? profileRevision,
    Expression<double>? safetyBodyFatPercent,
    Expression<String>? tdeeStatus,
  }) {
    return RawValuesInsertable({
      if (effectiveEpochDay != null) 'effective_epoch_day': effectiveEpochDay,
      if (mode != null) 'mode': mode,
      if (kcal != null) 'kcal': kcal,
      if (proteinG != null) 'protein_g': proteinG,
      if (proteinMinimumG != null) 'protein_minimum_g': proteinMinimumG,
      if (fatG != null) 'fat_g': fatG,
      if (carbsG != null) 'carbs_g': carbsG,
      if (weeklyRateFraction != null)
        'weekly_rate_fraction': weeklyRateFraction,
      if (flags != null) 'flags': flags,
      if (tdeeKcal != null) 'tdee_kcal': tdeeKcal,
      if (tdeeSigmaKcal != null) 'tdee_sigma_kcal': tdeeSigmaKcal,
      if (explanation != null) 'explanation': explanation,
      if (summarySeen != null) 'summary_seen': summarySeen,
      if (targetRulesVersion != null)
        'target_rules_version': targetRulesVersion,
      if (profileRevision != null) 'profile_revision': profileRevision,
      if (safetyBodyFatPercent != null)
        'safety_body_fat_percent': safetyBodyFatPercent,
      if (tdeeStatus != null) 'tdee_status': tdeeStatus,
    });
  }

  TargetsHistoryCompanion copyWith({
    Value<int>? effectiveEpochDay,
    Value<GoalMode>? mode,
    Value<double>? kcal,
    Value<double>? proteinG,
    Value<double?>? proteinMinimumG,
    Value<double>? fatG,
    Value<double>? carbsG,
    Value<double>? weeklyRateFraction,
    Value<String>? flags,
    Value<double>? tdeeKcal,
    Value<double>? tdeeSigmaKcal,
    Value<String?>? explanation,
    Value<bool>? summarySeen,
    Value<int>? targetRulesVersion,
    Value<int>? profileRevision,
    Value<double?>? safetyBodyFatPercent,
    Value<TdeeStatus>? tdeeStatus,
  }) {
    return TargetsHistoryCompanion(
      effectiveEpochDay: effectiveEpochDay ?? this.effectiveEpochDay,
      mode: mode ?? this.mode,
      kcal: kcal ?? this.kcal,
      proteinG: proteinG ?? this.proteinG,
      proteinMinimumG: proteinMinimumG ?? this.proteinMinimumG,
      fatG: fatG ?? this.fatG,
      carbsG: carbsG ?? this.carbsG,
      weeklyRateFraction: weeklyRateFraction ?? this.weeklyRateFraction,
      flags: flags ?? this.flags,
      tdeeKcal: tdeeKcal ?? this.tdeeKcal,
      tdeeSigmaKcal: tdeeSigmaKcal ?? this.tdeeSigmaKcal,
      explanation: explanation ?? this.explanation,
      summarySeen: summarySeen ?? this.summarySeen,
      targetRulesVersion: targetRulesVersion ?? this.targetRulesVersion,
      profileRevision: profileRevision ?? this.profileRevision,
      safetyBodyFatPercent: safetyBodyFatPercent ?? this.safetyBodyFatPercent,
      tdeeStatus: tdeeStatus ?? this.tdeeStatus,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (effectiveEpochDay.present) {
      map['effective_epoch_day'] = Variable<int>(effectiveEpochDay.value);
    }
    if (mode.present) {
      map['mode'] = Variable<String>(
        $TargetsHistoryTable.$convertermode.toSql(mode.value),
      );
    }
    if (kcal.present) {
      map['kcal'] = Variable<double>(kcal.value);
    }
    if (proteinG.present) {
      map['protein_g'] = Variable<double>(proteinG.value);
    }
    if (proteinMinimumG.present) {
      map['protein_minimum_g'] = Variable<double>(proteinMinimumG.value);
    }
    if (fatG.present) {
      map['fat_g'] = Variable<double>(fatG.value);
    }
    if (carbsG.present) {
      map['carbs_g'] = Variable<double>(carbsG.value);
    }
    if (weeklyRateFraction.present) {
      map['weekly_rate_fraction'] = Variable<double>(weeklyRateFraction.value);
    }
    if (flags.present) {
      map['flags'] = Variable<String>(flags.value);
    }
    if (tdeeKcal.present) {
      map['tdee_kcal'] = Variable<double>(tdeeKcal.value);
    }
    if (tdeeSigmaKcal.present) {
      map['tdee_sigma_kcal'] = Variable<double>(tdeeSigmaKcal.value);
    }
    if (explanation.present) {
      map['explanation'] = Variable<String>(explanation.value);
    }
    if (summarySeen.present) {
      map['summary_seen'] = Variable<bool>(summarySeen.value);
    }
    if (targetRulesVersion.present) {
      map['target_rules_version'] = Variable<int>(targetRulesVersion.value);
    }
    if (profileRevision.present) {
      map['profile_revision'] = Variable<int>(profileRevision.value);
    }
    if (safetyBodyFatPercent.present) {
      map['safety_body_fat_percent'] = Variable<double>(
        safetyBodyFatPercent.value,
      );
    }
    if (tdeeStatus.present) {
      map['tdee_status'] = Variable<String>(
        $TargetsHistoryTable.$convertertdeeStatus.toSql(tdeeStatus.value),
      );
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TargetsHistoryCompanion(')
          ..write('effectiveEpochDay: $effectiveEpochDay, ')
          ..write('mode: $mode, ')
          ..write('kcal: $kcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('proteinMinimumG: $proteinMinimumG, ')
          ..write('fatG: $fatG, ')
          ..write('carbsG: $carbsG, ')
          ..write('weeklyRateFraction: $weeklyRateFraction, ')
          ..write('flags: $flags, ')
          ..write('tdeeKcal: $tdeeKcal, ')
          ..write('tdeeSigmaKcal: $tdeeSigmaKcal, ')
          ..write('explanation: $explanation, ')
          ..write('summarySeen: $summarySeen, ')
          ..write('targetRulesVersion: $targetRulesVersion, ')
          ..write('profileRevision: $profileRevision, ')
          ..write('safetyBodyFatPercent: $safetyBodyFatPercent, ')
          ..write('tdeeStatus: $tdeeStatus')
          ..write(')'))
        .toString();
  }
}

class $UserPreferencesTable extends UserPreferences
    with TableInfo<$UserPreferencesTable, PreferencesRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $UserPreferencesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    check: () => id.equals(1),
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  @override
  late final GeneratedColumnWithTypeConverter<ThemePreference, String>
  themePreference =
      GeneratedColumn<String>(
        'theme_preference',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
        defaultValue: const Constant('system'),
      ).withConverter<ThemePreference>(
        $UserPreferencesTable.$converterthemePreference,
      );
  static const VerificationMeta _easyToMissEnabledMeta = const VerificationMeta(
    'easyToMissEnabled',
  );
  @override
  late final GeneratedColumn<bool> easyToMissEnabled = GeneratedColumn<bool>(
    'easy_to_miss_enabled',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("easy_to_miss_enabled" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  static const VerificationMeta _easyToMissLastShownEpochDayMeta =
      const VerificationMeta('easyToMissLastShownEpochDay');
  @override
  late final GeneratedColumn<int> easyToMissLastShownEpochDay =
      GeneratedColumn<int>(
        'easy_to_miss_last_shown_epoch_day',
        aliasedName,
        true,
        type: DriftSqlType.int,
        requiredDuringInsert: false,
      );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    themePreference,
    easyToMissEnabled,
    easyToMissLastShownEpochDay,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'user_preferences';
  @override
  VerificationContext validateIntegrity(
    Insertable<PreferencesRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('easy_to_miss_enabled')) {
      context.handle(
        _easyToMissEnabledMeta,
        easyToMissEnabled.isAcceptableOrUnknown(
          data['easy_to_miss_enabled']!,
          _easyToMissEnabledMeta,
        ),
      );
    }
    if (data.containsKey('easy_to_miss_last_shown_epoch_day')) {
      context.handle(
        _easyToMissLastShownEpochDayMeta,
        easyToMissLastShownEpochDay.isAcceptableOrUnknown(
          data['easy_to_miss_last_shown_epoch_day']!,
          _easyToMissLastShownEpochDayMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  PreferencesRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return PreferencesRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      themePreference: $UserPreferencesTable.$converterthemePreference.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}theme_preference'],
        )!,
      ),
      easyToMissEnabled: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}easy_to_miss_enabled'],
      )!,
      easyToMissLastShownEpochDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}easy_to_miss_last_shown_epoch_day'],
      ),
    );
  }

  @override
  $UserPreferencesTable createAlias(String alias) {
    return $UserPreferencesTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<ThemePreference, String, String>
  $converterthemePreference = const EnumNameConverter<ThemePreference>(
    ThemePreference.values,
  );
}

class PreferencesRow extends DataClass implements Insertable<PreferencesRow> {
  final int id;
  final ThemePreference themePreference;

  /// The easy-to-miss line (MM-152): on unless turned off, and the last day
  /// it was shown.
  final bool easyToMissEnabled;
  final int? easyToMissLastShownEpochDay;
  const PreferencesRow({
    required this.id,
    required this.themePreference,
    required this.easyToMissEnabled,
    this.easyToMissLastShownEpochDay,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    {
      map['theme_preference'] = Variable<String>(
        $UserPreferencesTable.$converterthemePreference.toSql(themePreference),
      );
    }
    map['easy_to_miss_enabled'] = Variable<bool>(easyToMissEnabled);
    if (!nullToAbsent || easyToMissLastShownEpochDay != null) {
      map['easy_to_miss_last_shown_epoch_day'] = Variable<int>(
        easyToMissLastShownEpochDay,
      );
    }
    return map;
  }

  UserPreferencesCompanion toCompanion(bool nullToAbsent) {
    return UserPreferencesCompanion(
      id: Value(id),
      themePreference: Value(themePreference),
      easyToMissEnabled: Value(easyToMissEnabled),
      easyToMissLastShownEpochDay:
          easyToMissLastShownEpochDay == null && nullToAbsent
          ? const Value.absent()
          : Value(easyToMissLastShownEpochDay),
    );
  }

  factory PreferencesRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return PreferencesRow(
      id: serializer.fromJson<int>(json['id']),
      themePreference: $UserPreferencesTable.$converterthemePreference.fromJson(
        serializer.fromJson<String>(json['themePreference']),
      ),
      easyToMissEnabled: serializer.fromJson<bool>(json['easyToMissEnabled']),
      easyToMissLastShownEpochDay: serializer.fromJson<int?>(
        json['easyToMissLastShownEpochDay'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'themePreference': serializer.toJson<String>(
        $UserPreferencesTable.$converterthemePreference.toJson(themePreference),
      ),
      'easyToMissEnabled': serializer.toJson<bool>(easyToMissEnabled),
      'easyToMissLastShownEpochDay': serializer.toJson<int?>(
        easyToMissLastShownEpochDay,
      ),
    };
  }

  PreferencesRow copyWith({
    int? id,
    ThemePreference? themePreference,
    bool? easyToMissEnabled,
    Value<int?> easyToMissLastShownEpochDay = const Value.absent(),
  }) => PreferencesRow(
    id: id ?? this.id,
    themePreference: themePreference ?? this.themePreference,
    easyToMissEnabled: easyToMissEnabled ?? this.easyToMissEnabled,
    easyToMissLastShownEpochDay: easyToMissLastShownEpochDay.present
        ? easyToMissLastShownEpochDay.value
        : this.easyToMissLastShownEpochDay,
  );
  PreferencesRow copyWithCompanion(UserPreferencesCompanion data) {
    return PreferencesRow(
      id: data.id.present ? data.id.value : this.id,
      themePreference: data.themePreference.present
          ? data.themePreference.value
          : this.themePreference,
      easyToMissEnabled: data.easyToMissEnabled.present
          ? data.easyToMissEnabled.value
          : this.easyToMissEnabled,
      easyToMissLastShownEpochDay: data.easyToMissLastShownEpochDay.present
          ? data.easyToMissLastShownEpochDay.value
          : this.easyToMissLastShownEpochDay,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PreferencesRow(')
          ..write('id: $id, ')
          ..write('themePreference: $themePreference, ')
          ..write('easyToMissEnabled: $easyToMissEnabled, ')
          ..write('easyToMissLastShownEpochDay: $easyToMissLastShownEpochDay')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    themePreference,
    easyToMissEnabled,
    easyToMissLastShownEpochDay,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is PreferencesRow &&
          other.id == this.id &&
          other.themePreference == this.themePreference &&
          other.easyToMissEnabled == this.easyToMissEnabled &&
          other.easyToMissLastShownEpochDay ==
              this.easyToMissLastShownEpochDay);
}

class UserPreferencesCompanion extends UpdateCompanion<PreferencesRow> {
  final Value<int> id;
  final Value<ThemePreference> themePreference;
  final Value<bool> easyToMissEnabled;
  final Value<int?> easyToMissLastShownEpochDay;
  const UserPreferencesCompanion({
    this.id = const Value.absent(),
    this.themePreference = const Value.absent(),
    this.easyToMissEnabled = const Value.absent(),
    this.easyToMissLastShownEpochDay = const Value.absent(),
  });
  UserPreferencesCompanion.insert({
    this.id = const Value.absent(),
    this.themePreference = const Value.absent(),
    this.easyToMissEnabled = const Value.absent(),
    this.easyToMissLastShownEpochDay = const Value.absent(),
  });
  static Insertable<PreferencesRow> custom({
    Expression<int>? id,
    Expression<String>? themePreference,
    Expression<bool>? easyToMissEnabled,
    Expression<int>? easyToMissLastShownEpochDay,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (themePreference != null) 'theme_preference': themePreference,
      if (easyToMissEnabled != null) 'easy_to_miss_enabled': easyToMissEnabled,
      if (easyToMissLastShownEpochDay != null)
        'easy_to_miss_last_shown_epoch_day': easyToMissLastShownEpochDay,
    });
  }

  UserPreferencesCompanion copyWith({
    Value<int>? id,
    Value<ThemePreference>? themePreference,
    Value<bool>? easyToMissEnabled,
    Value<int?>? easyToMissLastShownEpochDay,
  }) {
    return UserPreferencesCompanion(
      id: id ?? this.id,
      themePreference: themePreference ?? this.themePreference,
      easyToMissEnabled: easyToMissEnabled ?? this.easyToMissEnabled,
      easyToMissLastShownEpochDay:
          easyToMissLastShownEpochDay ?? this.easyToMissLastShownEpochDay,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (themePreference.present) {
      map['theme_preference'] = Variable<String>(
        $UserPreferencesTable.$converterthemePreference.toSql(
          themePreference.value,
        ),
      );
    }
    if (easyToMissEnabled.present) {
      map['easy_to_miss_enabled'] = Variable<bool>(easyToMissEnabled.value);
    }
    if (easyToMissLastShownEpochDay.present) {
      map['easy_to_miss_last_shown_epoch_day'] = Variable<int>(
        easyToMissLastShownEpochDay.value,
      );
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UserPreferencesCompanion(')
          ..write('id: $id, ')
          ..write('themePreference: $themePreference, ')
          ..write('easyToMissEnabled: $easyToMissEnabled, ')
          ..write('easyToMissLastShownEpochDay: $easyToMissLastShownEpochDay')
          ..write(')'))
        .toString();
  }
}

class $WeightEventsTable extends WeightEvents
    with TableInfo<$WeightEventsTable, WeightEventRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $WeightEventsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _dateEpochDayMeta = const VerificationMeta(
    'dateEpochDay',
  );
  @override
  late final GeneratedColumn<int> dateEpochDay = GeneratedColumn<int>(
    'date_epoch_day',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  late final GeneratedColumnWithTypeConverter<WeightEventType, String> type =
      GeneratedColumn<String>(
        'type',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<WeightEventType>($WeightEventsTable.$convertertype);
  @override
  List<GeneratedColumn> get $columns => [dateEpochDay, type];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'weight_events';
  @override
  VerificationContext validateIntegrity(
    Insertable<WeightEventRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('date_epoch_day')) {
      context.handle(
        _dateEpochDayMeta,
        dateEpochDay.isAcceptableOrUnknown(
          data['date_epoch_day']!,
          _dateEpochDayMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_dateEpochDayMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {dateEpochDay, type};
  @override
  WeightEventRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return WeightEventRow(
      dateEpochDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}date_epoch_day'],
      )!,
      type: $WeightEventsTable.$convertertype.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}type'],
        )!,
      ),
    );
  }

  @override
  $WeightEventsTable createAlias(String alias) {
    return $WeightEventsTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<WeightEventType, String, String> $convertertype =
      const EnumNameConverter<WeightEventType>(WeightEventType.values);
}

class WeightEventRow extends DataClass implements Insertable<WeightEventRow> {
  final int dateEpochDay;
  final WeightEventType type;
  const WeightEventRow({required this.dateEpochDay, required this.type});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['date_epoch_day'] = Variable<int>(dateEpochDay);
    {
      map['type'] = Variable<String>(
        $WeightEventsTable.$convertertype.toSql(type),
      );
    }
    return map;
  }

  WeightEventsCompanion toCompanion(bool nullToAbsent) {
    return WeightEventsCompanion(
      dateEpochDay: Value(dateEpochDay),
      type: Value(type),
    );
  }

  factory WeightEventRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return WeightEventRow(
      dateEpochDay: serializer.fromJson<int>(json['dateEpochDay']),
      type: $WeightEventsTable.$convertertype.fromJson(
        serializer.fromJson<String>(json['type']),
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'dateEpochDay': serializer.toJson<int>(dateEpochDay),
      'type': serializer.toJson<String>(
        $WeightEventsTable.$convertertype.toJson(type),
      ),
    };
  }

  WeightEventRow copyWith({int? dateEpochDay, WeightEventType? type}) =>
      WeightEventRow(
        dateEpochDay: dateEpochDay ?? this.dateEpochDay,
        type: type ?? this.type,
      );
  WeightEventRow copyWithCompanion(WeightEventsCompanion data) {
    return WeightEventRow(
      dateEpochDay: data.dateEpochDay.present
          ? data.dateEpochDay.value
          : this.dateEpochDay,
      type: data.type.present ? data.type.value : this.type,
    );
  }

  @override
  String toString() {
    return (StringBuffer('WeightEventRow(')
          ..write('dateEpochDay: $dateEpochDay, ')
          ..write('type: $type')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(dateEpochDay, type);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is WeightEventRow &&
          other.dateEpochDay == this.dateEpochDay &&
          other.type == this.type);
}

class WeightEventsCompanion extends UpdateCompanion<WeightEventRow> {
  final Value<int> dateEpochDay;
  final Value<WeightEventType> type;
  final Value<int> rowid;
  const WeightEventsCompanion({
    this.dateEpochDay = const Value.absent(),
    this.type = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  WeightEventsCompanion.insert({
    required int dateEpochDay,
    required WeightEventType type,
    this.rowid = const Value.absent(),
  }) : dateEpochDay = Value(dateEpochDay),
       type = Value(type);
  static Insertable<WeightEventRow> custom({
    Expression<int>? dateEpochDay,
    Expression<String>? type,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (dateEpochDay != null) 'date_epoch_day': dateEpochDay,
      if (type != null) 'type': type,
      if (rowid != null) 'rowid': rowid,
    });
  }

  WeightEventsCompanion copyWith({
    Value<int>? dateEpochDay,
    Value<WeightEventType>? type,
    Value<int>? rowid,
  }) {
    return WeightEventsCompanion(
      dateEpochDay: dateEpochDay ?? this.dateEpochDay,
      type: type ?? this.type,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (dateEpochDay.present) {
      map['date_epoch_day'] = Variable<int>(dateEpochDay.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(
        $WeightEventsTable.$convertertype.toSql(type.value),
      );
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('WeightEventsCompanion(')
          ..write('dateEpochDay: $dateEpochDay, ')
          ..write('type: $type, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CustomFoodsTable extends CustomFoods
    with TableInfo<$CustomFoodsTable, CustomFoodRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CustomFoodsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  late final GeneratedColumnWithTypeConverter<CustomFoodKind, String> kind =
      GeneratedColumn<String>(
        'kind',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<CustomFoodKind>($CustomFoodsTable.$converterkind);
  static const VerificationMeta _servingDescriptionMeta =
      const VerificationMeta('servingDescription');
  @override
  late final GeneratedColumn<String> servingDescription =
      GeneratedColumn<String>(
        'serving_description',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _servingGramsMeta = const VerificationMeta(
    'servingGrams',
  );
  @override
  late final GeneratedColumn<double> servingGrams = GeneratedColumn<double>(
    'serving_grams',
    aliasedName,
    true,
    check: () => ComparableExpr(servingGrams).isBiggerThanValue(0),
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _kcalMeta = const VerificationMeta('kcal');
  @override
  late final GeneratedColumn<double> kcal = GeneratedColumn<double>(
    'kcal',
    aliasedName,
    false,
    check: () => ComparableExpr(kcal).isBiggerOrEqualValue(0),
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _proteinGMeta = const VerificationMeta(
    'proteinG',
  );
  @override
  late final GeneratedColumn<double> proteinG = GeneratedColumn<double>(
    'protein_g',
    aliasedName,
    false,
    check: () => ComparableExpr(proteinG).isBiggerOrEqualValue(0),
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _carbsGMeta = const VerificationMeta('carbsG');
  @override
  late final GeneratedColumn<double> carbsG = GeneratedColumn<double>(
    'carbs_g',
    aliasedName,
    false,
    check: () => ComparableExpr(carbsG).isBiggerOrEqualValue(0),
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _fatGMeta = const VerificationMeta('fatG');
  @override
  late final GeneratedColumn<double> fatG = GeneratedColumn<double>(
    'fat_g',
    aliasedName,
    false,
    check: () => ComparableExpr(fatG).isBiggerOrEqualValue(0),
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _barcodeMeta = const VerificationMeta(
    'barcode',
  );
  @override
  late final GeneratedColumn<String> barcode = GeneratedColumn<String>(
    'barcode',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _servingsMeta = const VerificationMeta(
    'servings',
  );
  @override
  late final GeneratedColumn<double> servings = GeneratedColumn<double>(
    'servings',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _cookedWeightGramsMeta = const VerificationMeta(
    'cookedWeightGrams',
  );
  @override
  late final GeneratedColumn<double> cookedWeightGrams =
      GeneratedColumn<double>(
        'cooked_weight_grams',
        aliasedName,
        true,
        type: DriftSqlType.double,
        requiredDuringInsert: false,
      );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    kind,
    servingDescription,
    servingGrams,
    kcal,
    proteinG,
    carbsG,
    fatG,
    barcode,
    servings,
    cookedWeightGrams,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'custom_foods';
  @override
  VerificationContext validateIntegrity(
    Insertable<CustomFoodRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('serving_description')) {
      context.handle(
        _servingDescriptionMeta,
        servingDescription.isAcceptableOrUnknown(
          data['serving_description']!,
          _servingDescriptionMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_servingDescriptionMeta);
    }
    if (data.containsKey('serving_grams')) {
      context.handle(
        _servingGramsMeta,
        servingGrams.isAcceptableOrUnknown(
          data['serving_grams']!,
          _servingGramsMeta,
        ),
      );
    }
    if (data.containsKey('kcal')) {
      context.handle(
        _kcalMeta,
        kcal.isAcceptableOrUnknown(data['kcal']!, _kcalMeta),
      );
    } else if (isInserting) {
      context.missing(_kcalMeta);
    }
    if (data.containsKey('protein_g')) {
      context.handle(
        _proteinGMeta,
        proteinG.isAcceptableOrUnknown(data['protein_g']!, _proteinGMeta),
      );
    } else if (isInserting) {
      context.missing(_proteinGMeta);
    }
    if (data.containsKey('carbs_g')) {
      context.handle(
        _carbsGMeta,
        carbsG.isAcceptableOrUnknown(data['carbs_g']!, _carbsGMeta),
      );
    } else if (isInserting) {
      context.missing(_carbsGMeta);
    }
    if (data.containsKey('fat_g')) {
      context.handle(
        _fatGMeta,
        fatG.isAcceptableOrUnknown(data['fat_g']!, _fatGMeta),
      );
    } else if (isInserting) {
      context.missing(_fatGMeta);
    }
    if (data.containsKey('barcode')) {
      context.handle(
        _barcodeMeta,
        barcode.isAcceptableOrUnknown(data['barcode']!, _barcodeMeta),
      );
    }
    if (data.containsKey('servings')) {
      context.handle(
        _servingsMeta,
        servings.isAcceptableOrUnknown(data['servings']!, _servingsMeta),
      );
    }
    if (data.containsKey('cooked_weight_grams')) {
      context.handle(
        _cookedWeightGramsMeta,
        cookedWeightGrams.isAcceptableOrUnknown(
          data['cooked_weight_grams']!,
          _cookedWeightGramsMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CustomFoodRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CustomFoodRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      kind: $CustomFoodsTable.$converterkind.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}kind'],
        )!,
      ),
      servingDescription: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}serving_description'],
      )!,
      servingGrams: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}serving_grams'],
      ),
      kcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}kcal'],
      )!,
      proteinG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}protein_g'],
      )!,
      carbsG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}carbs_g'],
      )!,
      fatG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}fat_g'],
      )!,
      barcode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}barcode'],
      ),
      servings: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}servings'],
      ),
      cookedWeightGrams: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}cooked_weight_grams'],
      ),
    );
  }

  @override
  $CustomFoodsTable createAlias(String alias) {
    return $CustomFoodsTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<CustomFoodKind, String, String> $converterkind =
      const EnumNameConverter<CustomFoodKind>(CustomFoodKind.values);
}

class CustomFoodRow extends DataClass implements Insertable<CustomFoodRow> {
  final int id;
  final String name;
  final CustomFoodKind kind;
  final String servingDescription;
  final double? servingGrams;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final String? barcode;
  final double? servings;
  final double? cookedWeightGrams;
  const CustomFoodRow({
    required this.id,
    required this.name,
    required this.kind,
    required this.servingDescription,
    this.servingGrams,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    this.barcode,
    this.servings,
    this.cookedWeightGrams,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['name'] = Variable<String>(name);
    {
      map['kind'] = Variable<String>(
        $CustomFoodsTable.$converterkind.toSql(kind),
      );
    }
    map['serving_description'] = Variable<String>(servingDescription);
    if (!nullToAbsent || servingGrams != null) {
      map['serving_grams'] = Variable<double>(servingGrams);
    }
    map['kcal'] = Variable<double>(kcal);
    map['protein_g'] = Variable<double>(proteinG);
    map['carbs_g'] = Variable<double>(carbsG);
    map['fat_g'] = Variable<double>(fatG);
    if (!nullToAbsent || barcode != null) {
      map['barcode'] = Variable<String>(barcode);
    }
    if (!nullToAbsent || servings != null) {
      map['servings'] = Variable<double>(servings);
    }
    if (!nullToAbsent || cookedWeightGrams != null) {
      map['cooked_weight_grams'] = Variable<double>(cookedWeightGrams);
    }
    return map;
  }

  CustomFoodsCompanion toCompanion(bool nullToAbsent) {
    return CustomFoodsCompanion(
      id: Value(id),
      name: Value(name),
      kind: Value(kind),
      servingDescription: Value(servingDescription),
      servingGrams: servingGrams == null && nullToAbsent
          ? const Value.absent()
          : Value(servingGrams),
      kcal: Value(kcal),
      proteinG: Value(proteinG),
      carbsG: Value(carbsG),
      fatG: Value(fatG),
      barcode: barcode == null && nullToAbsent
          ? const Value.absent()
          : Value(barcode),
      servings: servings == null && nullToAbsent
          ? const Value.absent()
          : Value(servings),
      cookedWeightGrams: cookedWeightGrams == null && nullToAbsent
          ? const Value.absent()
          : Value(cookedWeightGrams),
    );
  }

  factory CustomFoodRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CustomFoodRow(
      id: serializer.fromJson<int>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      kind: $CustomFoodsTable.$converterkind.fromJson(
        serializer.fromJson<String>(json['kind']),
      ),
      servingDescription: serializer.fromJson<String>(
        json['servingDescription'],
      ),
      servingGrams: serializer.fromJson<double?>(json['servingGrams']),
      kcal: serializer.fromJson<double>(json['kcal']),
      proteinG: serializer.fromJson<double>(json['proteinG']),
      carbsG: serializer.fromJson<double>(json['carbsG']),
      fatG: serializer.fromJson<double>(json['fatG']),
      barcode: serializer.fromJson<String?>(json['barcode']),
      servings: serializer.fromJson<double?>(json['servings']),
      cookedWeightGrams: serializer.fromJson<double?>(
        json['cookedWeightGrams'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'name': serializer.toJson<String>(name),
      'kind': serializer.toJson<String>(
        $CustomFoodsTable.$converterkind.toJson(kind),
      ),
      'servingDescription': serializer.toJson<String>(servingDescription),
      'servingGrams': serializer.toJson<double?>(servingGrams),
      'kcal': serializer.toJson<double>(kcal),
      'proteinG': serializer.toJson<double>(proteinG),
      'carbsG': serializer.toJson<double>(carbsG),
      'fatG': serializer.toJson<double>(fatG),
      'barcode': serializer.toJson<String?>(barcode),
      'servings': serializer.toJson<double?>(servings),
      'cookedWeightGrams': serializer.toJson<double?>(cookedWeightGrams),
    };
  }

  CustomFoodRow copyWith({
    int? id,
    String? name,
    CustomFoodKind? kind,
    String? servingDescription,
    Value<double?> servingGrams = const Value.absent(),
    double? kcal,
    double? proteinG,
    double? carbsG,
    double? fatG,
    Value<String?> barcode = const Value.absent(),
    Value<double?> servings = const Value.absent(),
    Value<double?> cookedWeightGrams = const Value.absent(),
  }) => CustomFoodRow(
    id: id ?? this.id,
    name: name ?? this.name,
    kind: kind ?? this.kind,
    servingDescription: servingDescription ?? this.servingDescription,
    servingGrams: servingGrams.present ? servingGrams.value : this.servingGrams,
    kcal: kcal ?? this.kcal,
    proteinG: proteinG ?? this.proteinG,
    carbsG: carbsG ?? this.carbsG,
    fatG: fatG ?? this.fatG,
    barcode: barcode.present ? barcode.value : this.barcode,
    servings: servings.present ? servings.value : this.servings,
    cookedWeightGrams: cookedWeightGrams.present
        ? cookedWeightGrams.value
        : this.cookedWeightGrams,
  );
  CustomFoodRow copyWithCompanion(CustomFoodsCompanion data) {
    return CustomFoodRow(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      kind: data.kind.present ? data.kind.value : this.kind,
      servingDescription: data.servingDescription.present
          ? data.servingDescription.value
          : this.servingDescription,
      servingGrams: data.servingGrams.present
          ? data.servingGrams.value
          : this.servingGrams,
      kcal: data.kcal.present ? data.kcal.value : this.kcal,
      proteinG: data.proteinG.present ? data.proteinG.value : this.proteinG,
      carbsG: data.carbsG.present ? data.carbsG.value : this.carbsG,
      fatG: data.fatG.present ? data.fatG.value : this.fatG,
      barcode: data.barcode.present ? data.barcode.value : this.barcode,
      servings: data.servings.present ? data.servings.value : this.servings,
      cookedWeightGrams: data.cookedWeightGrams.present
          ? data.cookedWeightGrams.value
          : this.cookedWeightGrams,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CustomFoodRow(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('kind: $kind, ')
          ..write('servingDescription: $servingDescription, ')
          ..write('servingGrams: $servingGrams, ')
          ..write('kcal: $kcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('carbsG: $carbsG, ')
          ..write('fatG: $fatG, ')
          ..write('barcode: $barcode, ')
          ..write('servings: $servings, ')
          ..write('cookedWeightGrams: $cookedWeightGrams')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    kind,
    servingDescription,
    servingGrams,
    kcal,
    proteinG,
    carbsG,
    fatG,
    barcode,
    servings,
    cookedWeightGrams,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CustomFoodRow &&
          other.id == this.id &&
          other.name == this.name &&
          other.kind == this.kind &&
          other.servingDescription == this.servingDescription &&
          other.servingGrams == this.servingGrams &&
          other.kcal == this.kcal &&
          other.proteinG == this.proteinG &&
          other.carbsG == this.carbsG &&
          other.fatG == this.fatG &&
          other.barcode == this.barcode &&
          other.servings == this.servings &&
          other.cookedWeightGrams == this.cookedWeightGrams);
}

class CustomFoodsCompanion extends UpdateCompanion<CustomFoodRow> {
  final Value<int> id;
  final Value<String> name;
  final Value<CustomFoodKind> kind;
  final Value<String> servingDescription;
  final Value<double?> servingGrams;
  final Value<double> kcal;
  final Value<double> proteinG;
  final Value<double> carbsG;
  final Value<double> fatG;
  final Value<String?> barcode;
  final Value<double?> servings;
  final Value<double?> cookedWeightGrams;
  const CustomFoodsCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.kind = const Value.absent(),
    this.servingDescription = const Value.absent(),
    this.servingGrams = const Value.absent(),
    this.kcal = const Value.absent(),
    this.proteinG = const Value.absent(),
    this.carbsG = const Value.absent(),
    this.fatG = const Value.absent(),
    this.barcode = const Value.absent(),
    this.servings = const Value.absent(),
    this.cookedWeightGrams = const Value.absent(),
  });
  CustomFoodsCompanion.insert({
    this.id = const Value.absent(),
    required String name,
    required CustomFoodKind kind,
    required String servingDescription,
    this.servingGrams = const Value.absent(),
    required double kcal,
    required double proteinG,
    required double carbsG,
    required double fatG,
    this.barcode = const Value.absent(),
    this.servings = const Value.absent(),
    this.cookedWeightGrams = const Value.absent(),
  }) : name = Value(name),
       kind = Value(kind),
       servingDescription = Value(servingDescription),
       kcal = Value(kcal),
       proteinG = Value(proteinG),
       carbsG = Value(carbsG),
       fatG = Value(fatG);
  static Insertable<CustomFoodRow> custom({
    Expression<int>? id,
    Expression<String>? name,
    Expression<String>? kind,
    Expression<String>? servingDescription,
    Expression<double>? servingGrams,
    Expression<double>? kcal,
    Expression<double>? proteinG,
    Expression<double>? carbsG,
    Expression<double>? fatG,
    Expression<String>? barcode,
    Expression<double>? servings,
    Expression<double>? cookedWeightGrams,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (kind != null) 'kind': kind,
      if (servingDescription != null) 'serving_description': servingDescription,
      if (servingGrams != null) 'serving_grams': servingGrams,
      if (kcal != null) 'kcal': kcal,
      if (proteinG != null) 'protein_g': proteinG,
      if (carbsG != null) 'carbs_g': carbsG,
      if (fatG != null) 'fat_g': fatG,
      if (barcode != null) 'barcode': barcode,
      if (servings != null) 'servings': servings,
      if (cookedWeightGrams != null) 'cooked_weight_grams': cookedWeightGrams,
    });
  }

  CustomFoodsCompanion copyWith({
    Value<int>? id,
    Value<String>? name,
    Value<CustomFoodKind>? kind,
    Value<String>? servingDescription,
    Value<double?>? servingGrams,
    Value<double>? kcal,
    Value<double>? proteinG,
    Value<double>? carbsG,
    Value<double>? fatG,
    Value<String?>? barcode,
    Value<double?>? servings,
    Value<double?>? cookedWeightGrams,
  }) {
    return CustomFoodsCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      kind: kind ?? this.kind,
      servingDescription: servingDescription ?? this.servingDescription,
      servingGrams: servingGrams ?? this.servingGrams,
      kcal: kcal ?? this.kcal,
      proteinG: proteinG ?? this.proteinG,
      carbsG: carbsG ?? this.carbsG,
      fatG: fatG ?? this.fatG,
      barcode: barcode ?? this.barcode,
      servings: servings ?? this.servings,
      cookedWeightGrams: cookedWeightGrams ?? this.cookedWeightGrams,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (kind.present) {
      map['kind'] = Variable<String>(
        $CustomFoodsTable.$converterkind.toSql(kind.value),
      );
    }
    if (servingDescription.present) {
      map['serving_description'] = Variable<String>(servingDescription.value);
    }
    if (servingGrams.present) {
      map['serving_grams'] = Variable<double>(servingGrams.value);
    }
    if (kcal.present) {
      map['kcal'] = Variable<double>(kcal.value);
    }
    if (proteinG.present) {
      map['protein_g'] = Variable<double>(proteinG.value);
    }
    if (carbsG.present) {
      map['carbs_g'] = Variable<double>(carbsG.value);
    }
    if (fatG.present) {
      map['fat_g'] = Variable<double>(fatG.value);
    }
    if (barcode.present) {
      map['barcode'] = Variable<String>(barcode.value);
    }
    if (servings.present) {
      map['servings'] = Variable<double>(servings.value);
    }
    if (cookedWeightGrams.present) {
      map['cooked_weight_grams'] = Variable<double>(cookedWeightGrams.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CustomFoodsCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('kind: $kind, ')
          ..write('servingDescription: $servingDescription, ')
          ..write('servingGrams: $servingGrams, ')
          ..write('kcal: $kcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('carbsG: $carbsG, ')
          ..write('fatG: $fatG, ')
          ..write('barcode: $barcode, ')
          ..write('servings: $servings, ')
          ..write('cookedWeightGrams: $cookedWeightGrams')
          ..write(')'))
        .toString();
  }
}

class $RecipeIngredientsTable extends RecipeIngredients
    with TableInfo<$RecipeIngredientsTable, RecipeIngredientRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RecipeIngredientsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _recipeIdMeta = const VerificationMeta(
    'recipeId',
  );
  @override
  late final GeneratedColumn<int> recipeId = GeneratedColumn<int>(
    'recipe_id',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _positionMeta = const VerificationMeta(
    'position',
  );
  @override
  late final GeneratedColumn<int> position = GeneratedColumn<int>(
    'position',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _gramsMeta = const VerificationMeta('grams');
  @override
  late final GeneratedColumn<double> grams = GeneratedColumn<double>(
    'grams',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _kcalMeta = const VerificationMeta('kcal');
  @override
  late final GeneratedColumn<double> kcal = GeneratedColumn<double>(
    'kcal',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _proteinGMeta = const VerificationMeta(
    'proteinG',
  );
  @override
  late final GeneratedColumn<double> proteinG = GeneratedColumn<double>(
    'protein_g',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _carbsGMeta = const VerificationMeta('carbsG');
  @override
  late final GeneratedColumn<double> carbsG = GeneratedColumn<double>(
    'carbs_g',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _fatGMeta = const VerificationMeta('fatG');
  @override
  late final GeneratedColumn<double> fatG = GeneratedColumn<double>(
    'fat_g',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    recipeId,
    position,
    name,
    grams,
    kcal,
    proteinG,
    carbsG,
    fatG,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'recipe_ingredients';
  @override
  VerificationContext validateIntegrity(
    Insertable<RecipeIngredientRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('recipe_id')) {
      context.handle(
        _recipeIdMeta,
        recipeId.isAcceptableOrUnknown(data['recipe_id']!, _recipeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_recipeIdMeta);
    }
    if (data.containsKey('position')) {
      context.handle(
        _positionMeta,
        position.isAcceptableOrUnknown(data['position']!, _positionMeta),
      );
    } else if (isInserting) {
      context.missing(_positionMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('grams')) {
      context.handle(
        _gramsMeta,
        grams.isAcceptableOrUnknown(data['grams']!, _gramsMeta),
      );
    }
    if (data.containsKey('kcal')) {
      context.handle(
        _kcalMeta,
        kcal.isAcceptableOrUnknown(data['kcal']!, _kcalMeta),
      );
    } else if (isInserting) {
      context.missing(_kcalMeta);
    }
    if (data.containsKey('protein_g')) {
      context.handle(
        _proteinGMeta,
        proteinG.isAcceptableOrUnknown(data['protein_g']!, _proteinGMeta),
      );
    } else if (isInserting) {
      context.missing(_proteinGMeta);
    }
    if (data.containsKey('carbs_g')) {
      context.handle(
        _carbsGMeta,
        carbsG.isAcceptableOrUnknown(data['carbs_g']!, _carbsGMeta),
      );
    } else if (isInserting) {
      context.missing(_carbsGMeta);
    }
    if (data.containsKey('fat_g')) {
      context.handle(
        _fatGMeta,
        fatG.isAcceptableOrUnknown(data['fat_g']!, _fatGMeta),
      );
    } else if (isInserting) {
      context.missing(_fatGMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  RecipeIngredientRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return RecipeIngredientRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      recipeId: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}recipe_id'],
      )!,
      position: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}position'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      grams: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}grams'],
      ),
      kcal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}kcal'],
      )!,
      proteinG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}protein_g'],
      )!,
      carbsG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}carbs_g'],
      )!,
      fatG: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}fat_g'],
      )!,
    );
  }

  @override
  $RecipeIngredientsTable createAlias(String alias) {
    return $RecipeIngredientsTable(attachedDatabase, alias);
  }
}

class RecipeIngredientRow extends DataClass
    implements Insertable<RecipeIngredientRow> {
  final int id;
  final int recipeId;
  final int position;
  final String name;
  final double? grams;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  const RecipeIngredientRow({
    required this.id,
    required this.recipeId,
    required this.position,
    required this.name,
    this.grams,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['recipe_id'] = Variable<int>(recipeId);
    map['position'] = Variable<int>(position);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || grams != null) {
      map['grams'] = Variable<double>(grams);
    }
    map['kcal'] = Variable<double>(kcal);
    map['protein_g'] = Variable<double>(proteinG);
    map['carbs_g'] = Variable<double>(carbsG);
    map['fat_g'] = Variable<double>(fatG);
    return map;
  }

  RecipeIngredientsCompanion toCompanion(bool nullToAbsent) {
    return RecipeIngredientsCompanion(
      id: Value(id),
      recipeId: Value(recipeId),
      position: Value(position),
      name: Value(name),
      grams: grams == null && nullToAbsent
          ? const Value.absent()
          : Value(grams),
      kcal: Value(kcal),
      proteinG: Value(proteinG),
      carbsG: Value(carbsG),
      fatG: Value(fatG),
    );
  }

  factory RecipeIngredientRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return RecipeIngredientRow(
      id: serializer.fromJson<int>(json['id']),
      recipeId: serializer.fromJson<int>(json['recipeId']),
      position: serializer.fromJson<int>(json['position']),
      name: serializer.fromJson<String>(json['name']),
      grams: serializer.fromJson<double?>(json['grams']),
      kcal: serializer.fromJson<double>(json['kcal']),
      proteinG: serializer.fromJson<double>(json['proteinG']),
      carbsG: serializer.fromJson<double>(json['carbsG']),
      fatG: serializer.fromJson<double>(json['fatG']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'recipeId': serializer.toJson<int>(recipeId),
      'position': serializer.toJson<int>(position),
      'name': serializer.toJson<String>(name),
      'grams': serializer.toJson<double?>(grams),
      'kcal': serializer.toJson<double>(kcal),
      'proteinG': serializer.toJson<double>(proteinG),
      'carbsG': serializer.toJson<double>(carbsG),
      'fatG': serializer.toJson<double>(fatG),
    };
  }

  RecipeIngredientRow copyWith({
    int? id,
    int? recipeId,
    int? position,
    String? name,
    Value<double?> grams = const Value.absent(),
    double? kcal,
    double? proteinG,
    double? carbsG,
    double? fatG,
  }) => RecipeIngredientRow(
    id: id ?? this.id,
    recipeId: recipeId ?? this.recipeId,
    position: position ?? this.position,
    name: name ?? this.name,
    grams: grams.present ? grams.value : this.grams,
    kcal: kcal ?? this.kcal,
    proteinG: proteinG ?? this.proteinG,
    carbsG: carbsG ?? this.carbsG,
    fatG: fatG ?? this.fatG,
  );
  RecipeIngredientRow copyWithCompanion(RecipeIngredientsCompanion data) {
    return RecipeIngredientRow(
      id: data.id.present ? data.id.value : this.id,
      recipeId: data.recipeId.present ? data.recipeId.value : this.recipeId,
      position: data.position.present ? data.position.value : this.position,
      name: data.name.present ? data.name.value : this.name,
      grams: data.grams.present ? data.grams.value : this.grams,
      kcal: data.kcal.present ? data.kcal.value : this.kcal,
      proteinG: data.proteinG.present ? data.proteinG.value : this.proteinG,
      carbsG: data.carbsG.present ? data.carbsG.value : this.carbsG,
      fatG: data.fatG.present ? data.fatG.value : this.fatG,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RecipeIngredientRow(')
          ..write('id: $id, ')
          ..write('recipeId: $recipeId, ')
          ..write('position: $position, ')
          ..write('name: $name, ')
          ..write('grams: $grams, ')
          ..write('kcal: $kcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('carbsG: $carbsG, ')
          ..write('fatG: $fatG')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    recipeId,
    position,
    name,
    grams,
    kcal,
    proteinG,
    carbsG,
    fatG,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is RecipeIngredientRow &&
          other.id == this.id &&
          other.recipeId == this.recipeId &&
          other.position == this.position &&
          other.name == this.name &&
          other.grams == this.grams &&
          other.kcal == this.kcal &&
          other.proteinG == this.proteinG &&
          other.carbsG == this.carbsG &&
          other.fatG == this.fatG);
}

class RecipeIngredientsCompanion extends UpdateCompanion<RecipeIngredientRow> {
  final Value<int> id;
  final Value<int> recipeId;
  final Value<int> position;
  final Value<String> name;
  final Value<double?> grams;
  final Value<double> kcal;
  final Value<double> proteinG;
  final Value<double> carbsG;
  final Value<double> fatG;
  const RecipeIngredientsCompanion({
    this.id = const Value.absent(),
    this.recipeId = const Value.absent(),
    this.position = const Value.absent(),
    this.name = const Value.absent(),
    this.grams = const Value.absent(),
    this.kcal = const Value.absent(),
    this.proteinG = const Value.absent(),
    this.carbsG = const Value.absent(),
    this.fatG = const Value.absent(),
  });
  RecipeIngredientsCompanion.insert({
    this.id = const Value.absent(),
    required int recipeId,
    required int position,
    required String name,
    this.grams = const Value.absent(),
    required double kcal,
    required double proteinG,
    required double carbsG,
    required double fatG,
  }) : recipeId = Value(recipeId),
       position = Value(position),
       name = Value(name),
       kcal = Value(kcal),
       proteinG = Value(proteinG),
       carbsG = Value(carbsG),
       fatG = Value(fatG);
  static Insertable<RecipeIngredientRow> custom({
    Expression<int>? id,
    Expression<int>? recipeId,
    Expression<int>? position,
    Expression<String>? name,
    Expression<double>? grams,
    Expression<double>? kcal,
    Expression<double>? proteinG,
    Expression<double>? carbsG,
    Expression<double>? fatG,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (recipeId != null) 'recipe_id': recipeId,
      if (position != null) 'position': position,
      if (name != null) 'name': name,
      if (grams != null) 'grams': grams,
      if (kcal != null) 'kcal': kcal,
      if (proteinG != null) 'protein_g': proteinG,
      if (carbsG != null) 'carbs_g': carbsG,
      if (fatG != null) 'fat_g': fatG,
    });
  }

  RecipeIngredientsCompanion copyWith({
    Value<int>? id,
    Value<int>? recipeId,
    Value<int>? position,
    Value<String>? name,
    Value<double?>? grams,
    Value<double>? kcal,
    Value<double>? proteinG,
    Value<double>? carbsG,
    Value<double>? fatG,
  }) {
    return RecipeIngredientsCompanion(
      id: id ?? this.id,
      recipeId: recipeId ?? this.recipeId,
      position: position ?? this.position,
      name: name ?? this.name,
      grams: grams ?? this.grams,
      kcal: kcal ?? this.kcal,
      proteinG: proteinG ?? this.proteinG,
      carbsG: carbsG ?? this.carbsG,
      fatG: fatG ?? this.fatG,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (recipeId.present) {
      map['recipe_id'] = Variable<int>(recipeId.value);
    }
    if (position.present) {
      map['position'] = Variable<int>(position.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (grams.present) {
      map['grams'] = Variable<double>(grams.value);
    }
    if (kcal.present) {
      map['kcal'] = Variable<double>(kcal.value);
    }
    if (proteinG.present) {
      map['protein_g'] = Variable<double>(proteinG.value);
    }
    if (carbsG.present) {
      map['carbs_g'] = Variable<double>(carbsG.value);
    }
    if (fatG.present) {
      map['fat_g'] = Variable<double>(fatG.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RecipeIngredientsCompanion(')
          ..write('id: $id, ')
          ..write('recipeId: $recipeId, ')
          ..write('position: $position, ')
          ..write('name: $name, ')
          ..write('grams: $grams, ')
          ..write('kcal: $kcal, ')
          ..write('proteinG: $proteinG, ')
          ..write('carbsG: $carbsG, ')
          ..write('fatG: $fatG')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $SetupsTable setups = $SetupsTable(this);
  late final $WeightEntriesTable weightEntries = $WeightEntriesTable(this);
  late final $FoodEntriesTable foodEntries = $FoodEntriesTable(this);
  late final $DayMarksTable dayMarks = $DayMarksTable(this);
  late final $WaistEntriesTable waistEntries = $WaistEntriesTable(this);
  late final $TargetsHistoryTable targetsHistory = $TargetsHistoryTable(this);
  late final $UserPreferencesTable userPreferences = $UserPreferencesTable(
    this,
  );
  late final $WeightEventsTable weightEvents = $WeightEventsTable(this);
  late final $CustomFoodsTable customFoods = $CustomFoodsTable(this);
  late final $RecipeIngredientsTable recipeIngredients =
      $RecipeIngredientsTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    setups,
    weightEntries,
    foodEntries,
    dayMarks,
    waistEntries,
    targetsHistory,
    userPreferences,
    weightEvents,
    customFoods,
    recipeIngredients,
  ];
}

typedef $$SetupsTableCreateCompanionBuilder = SetupsCompanion Function({
  Value<int> id,
  required String sex,
  required int birthEpochDay,
  required double heightCm,
  required TrainingStatus trainingStatus,
  required int trainingDaysPerWeek,
  Value<int> profileRevision,
  Value<DailyActivity> dailyActivity,
  required GoalMode goalMode,
  required UnitSystem unitSystem,
  required int onboardedEpochDay,
  Value<double?> bodyFatPercent,
  Value<double?> requestedLossFraction,
  Value<bool> pregnant,
  Value<bool> breastfeeding,
  Value<bool> eatingDisorderHistory,
  Value<bool> chronicKidneyDisease,
  Value<bool> androgenUse,
  Value<bool> pcos,
  Value<bool> menopause,
  Value<bool> thyroidCondition,
  Value<bool> insulinOrSulfonylurea,
  Value<bool> insulinCareTeamConfirmed,
  Value<bool> bariatricSurgery,
  Value<bool> weightAffectingMedication,
  Value<int?> healthCheckConfirmedEpochDay,
  Value<int> healthCheckSkipCount,
  Value<int?> creatineStartedEpochDay,
});
typedef $$SetupsTableUpdateCompanionBuilder = SetupsCompanion Function({
  Value<int> id,
  Value<String> sex,
  Value<int> birthEpochDay,
  Value<double> heightCm,
  Value<TrainingStatus> trainingStatus,
  Value<int> trainingDaysPerWeek,
  Value<int> profileRevision,
  Value<DailyActivity> dailyActivity,
  Value<GoalMode> goalMode,
  Value<UnitSystem> unitSystem,
  Value<int> onboardedEpochDay,
  Value<double?> bodyFatPercent,
  Value<double?> requestedLossFraction,
  Value<bool> pregnant,
  Value<bool> breastfeeding,
  Value<bool> eatingDisorderHistory,
  Value<bool> chronicKidneyDisease,
  Value<bool> androgenUse,
  Value<bool> pcos,
  Value<bool> menopause,
  Value<bool> thyroidCondition,
  Value<bool> insulinOrSulfonylurea,
  Value<bool> insulinCareTeamConfirmed,
  Value<bool> bariatricSurgery,
  Value<bool> weightAffectingMedication,
  Value<int?> healthCheckConfirmedEpochDay,
  Value<int> healthCheckSkipCount,
  Value<int?> creatineStartedEpochDay,
});

class $$SetupsTableFilterComposer
    extends Composer<_$AppDatabase, $SetupsTable> {
  $$SetupsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sex => $composableBuilder(
    column: $table.sex,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get birthEpochDay => $composableBuilder(
    column: $table.birthEpochDay,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get heightCm => $composableBuilder(
    column: $table.heightCm,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<TrainingStatus, TrainingStatus, String>
  get trainingStatus => $composableBuilder(
    column: $table.trainingStatus,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<int> get trainingDaysPerWeek => $composableBuilder(
    column: $table.trainingDaysPerWeek,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get profileRevision => $composableBuilder(
    column: $table.profileRevision,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<DailyActivity, DailyActivity, String>
  get dailyActivity => $composableBuilder(
    column: $table.dailyActivity,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnWithTypeConverterFilters<GoalMode, GoalMode, String> get goalMode =>
      $composableBuilder(
        column: $table.goalMode,
        builder: (column) => ColumnWithTypeConverterFilters(column),
      );

  ColumnWithTypeConverterFilters<UnitSystem, UnitSystem, String>
  get unitSystem => $composableBuilder(
    column: $table.unitSystem,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<int> get onboardedEpochDay => $composableBuilder(
    column: $table.onboardedEpochDay,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get bodyFatPercent => $composableBuilder(
    column: $table.bodyFatPercent,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get requestedLossFraction => $composableBuilder(
    column: $table.requestedLossFraction,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get pregnant => $composableBuilder(
    column: $table.pregnant,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get breastfeeding => $composableBuilder(
    column: $table.breastfeeding,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get eatingDisorderHistory => $composableBuilder(
    column: $table.eatingDisorderHistory,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get chronicKidneyDisease => $composableBuilder(
    column: $table.chronicKidneyDisease,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get androgenUse => $composableBuilder(
    column: $table.androgenUse,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get pcos => $composableBuilder(
    column: $table.pcos,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get menopause => $composableBuilder(
    column: $table.menopause,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get thyroidCondition => $composableBuilder(
    column: $table.thyroidCondition,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get insulinOrSulfonylurea => $composableBuilder(
    column: $table.insulinOrSulfonylurea,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get insulinCareTeamConfirmed => $composableBuilder(
    column: $table.insulinCareTeamConfirmed,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get bariatricSurgery => $composableBuilder(
    column: $table.bariatricSurgery,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get weightAffectingMedication => $composableBuilder(
    column: $table.weightAffectingMedication,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get healthCheckConfirmedEpochDay => $composableBuilder(
    column: $table.healthCheckConfirmedEpochDay,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get healthCheckSkipCount => $composableBuilder(
    column: $table.healthCheckSkipCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get creatineStartedEpochDay => $composableBuilder(
    column: $table.creatineStartedEpochDay,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SetupsTableOrderingComposer
    extends Composer<_$AppDatabase, $SetupsTable> {
  $$SetupsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sex => $composableBuilder(
    column: $table.sex,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get birthEpochDay => $composableBuilder(
    column: $table.birthEpochDay,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get heightCm => $composableBuilder(
    column: $table.heightCm,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get trainingStatus => $composableBuilder(
    column: $table.trainingStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get trainingDaysPerWeek => $composableBuilder(
    column: $table.trainingDaysPerWeek,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get profileRevision => $composableBuilder(
    column: $table.profileRevision,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get dailyActivity => $composableBuilder(
    column: $table.dailyActivity,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get goalMode => $composableBuilder(
    column: $table.goalMode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get unitSystem => $composableBuilder(
    column: $table.unitSystem,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get onboardedEpochDay => $composableBuilder(
    column: $table.onboardedEpochDay,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get bodyFatPercent => $composableBuilder(
    column: $table.bodyFatPercent,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get requestedLossFraction => $composableBuilder(
    column: $table.requestedLossFraction,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get pregnant => $composableBuilder(
    column: $table.pregnant,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get breastfeeding => $composableBuilder(
    column: $table.breastfeeding,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get eatingDisorderHistory => $composableBuilder(
    column: $table.eatingDisorderHistory,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get chronicKidneyDisease => $composableBuilder(
    column: $table.chronicKidneyDisease,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get androgenUse => $composableBuilder(
    column: $table.androgenUse,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get pcos => $composableBuilder(
    column: $table.pcos,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get menopause => $composableBuilder(
    column: $table.menopause,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get thyroidCondition => $composableBuilder(
    column: $table.thyroidCondition,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get insulinOrSulfonylurea => $composableBuilder(
    column: $table.insulinOrSulfonylurea,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get insulinCareTeamConfirmed => $composableBuilder(
    column: $table.insulinCareTeamConfirmed,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get bariatricSurgery => $composableBuilder(
    column: $table.bariatricSurgery,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get weightAffectingMedication => $composableBuilder(
    column: $table.weightAffectingMedication,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get healthCheckConfirmedEpochDay => $composableBuilder(
    column: $table.healthCheckConfirmedEpochDay,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get healthCheckSkipCount => $composableBuilder(
    column: $table.healthCheckSkipCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get creatineStartedEpochDay => $composableBuilder(
    column: $table.creatineStartedEpochDay,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SetupsTableAnnotationComposer
    extends Composer<_$AppDatabase, $SetupsTable> {
  $$SetupsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get sex =>
      $composableBuilder(column: $table.sex, builder: (column) => column);

  GeneratedColumn<int> get birthEpochDay => $composableBuilder(
    column: $table.birthEpochDay,
    builder: (column) => column,
  );

  GeneratedColumn<double> get heightCm =>
      $composableBuilder(column: $table.heightCm, builder: (column) => column);

  GeneratedColumnWithTypeConverter<TrainingStatus, String> get trainingStatus =>
      $composableBuilder(
        column: $table.trainingStatus,
        builder: (column) => column,
      );

  GeneratedColumn<int> get trainingDaysPerWeek => $composableBuilder(
    column: $table.trainingDaysPerWeek,
    builder: (column) => column,
  );

  GeneratedColumn<int> get profileRevision => $composableBuilder(
    column: $table.profileRevision,
    builder: (column) => column,
  );

  GeneratedColumnWithTypeConverter<DailyActivity, String> get dailyActivity =>
      $composableBuilder(
        column: $table.dailyActivity,
        builder: (column) => column,
      );

  GeneratedColumnWithTypeConverter<GoalMode, String> get goalMode =>
      $composableBuilder(column: $table.goalMode, builder: (column) => column);

  GeneratedColumnWithTypeConverter<UnitSystem, String> get unitSystem =>
      $composableBuilder(
        column: $table.unitSystem,
        builder: (column) => column,
      );

  GeneratedColumn<int> get onboardedEpochDay => $composableBuilder(
    column: $table.onboardedEpochDay,
    builder: (column) => column,
  );

  GeneratedColumn<double> get bodyFatPercent => $composableBuilder(
    column: $table.bodyFatPercent,
    builder: (column) => column,
  );

  GeneratedColumn<double> get requestedLossFraction => $composableBuilder(
    column: $table.requestedLossFraction,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get pregnant =>
      $composableBuilder(column: $table.pregnant, builder: (column) => column);

  GeneratedColumn<bool> get breastfeeding => $composableBuilder(
    column: $table.breastfeeding,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get eatingDisorderHistory => $composableBuilder(
    column: $table.eatingDisorderHistory,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get chronicKidneyDisease => $composableBuilder(
    column: $table.chronicKidneyDisease,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get androgenUse => $composableBuilder(
    column: $table.androgenUse,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get pcos =>
      $composableBuilder(column: $table.pcos, builder: (column) => column);

  GeneratedColumn<bool> get menopause =>
      $composableBuilder(column: $table.menopause, builder: (column) => column);

  GeneratedColumn<bool> get thyroidCondition => $composableBuilder(
    column: $table.thyroidCondition,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get insulinOrSulfonylurea => $composableBuilder(
    column: $table.insulinOrSulfonylurea,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get insulinCareTeamConfirmed => $composableBuilder(
    column: $table.insulinCareTeamConfirmed,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get bariatricSurgery => $composableBuilder(
    column: $table.bariatricSurgery,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get weightAffectingMedication => $composableBuilder(
    column: $table.weightAffectingMedication,
    builder: (column) => column,
  );

  GeneratedColumn<int> get healthCheckConfirmedEpochDay => $composableBuilder(
    column: $table.healthCheckConfirmedEpochDay,
    builder: (column) => column,
  );

  GeneratedColumn<int> get healthCheckSkipCount => $composableBuilder(
    column: $table.healthCheckSkipCount,
    builder: (column) => column,
  );

  GeneratedColumn<int> get creatineStartedEpochDay => $composableBuilder(
    column: $table.creatineStartedEpochDay,
    builder: (column) => column,
  );
}

class $$SetupsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SetupsTable,
          SetupRow,
          $$SetupsTableFilterComposer,
          $$SetupsTableOrderingComposer,
          $$SetupsTableAnnotationComposer,
          $$SetupsTableCreateCompanionBuilder,
          $$SetupsTableUpdateCompanionBuilder,
          (SetupRow, BaseReferences<_$AppDatabase, $SetupsTable, SetupRow>),
          SetupRow,
          PrefetchHooks Function()
        > {
  $$SetupsTableTableManager(_$AppDatabase db, $SetupsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SetupsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SetupsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SetupsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> sex = const Value.absent(),
                Value<int> birthEpochDay = const Value.absent(),
                Value<double> heightCm = const Value.absent(),
                Value<TrainingStatus> trainingStatus = const Value.absent(),
                Value<int> trainingDaysPerWeek = const Value.absent(),
                Value<int> profileRevision = const Value.absent(),
                Value<DailyActivity> dailyActivity = const Value.absent(),
                Value<GoalMode> goalMode = const Value.absent(),
                Value<UnitSystem> unitSystem = const Value.absent(),
                Value<int> onboardedEpochDay = const Value.absent(),
                Value<double?> bodyFatPercent = const Value.absent(),
                Value<double?> requestedLossFraction = const Value.absent(),
                Value<bool> pregnant = const Value.absent(),
                Value<bool> breastfeeding = const Value.absent(),
                Value<bool> eatingDisorderHistory = const Value.absent(),
                Value<bool> chronicKidneyDisease = const Value.absent(),
                Value<bool> androgenUse = const Value.absent(),
                Value<bool> pcos = const Value.absent(),
                Value<bool> menopause = const Value.absent(),
                Value<bool> thyroidCondition = const Value.absent(),
                Value<bool> insulinOrSulfonylurea = const Value.absent(),
                Value<bool> insulinCareTeamConfirmed = const Value.absent(),
                Value<bool> bariatricSurgery = const Value.absent(),
                Value<bool> weightAffectingMedication = const Value.absent(),
                Value<int?> healthCheckConfirmedEpochDay = const Value.absent(),
                Value<int> healthCheckSkipCount = const Value.absent(),
                Value<int?> creatineStartedEpochDay = const Value.absent(),
              }) => SetupsCompanion(
                id: id,
                sex: sex,
                birthEpochDay: birthEpochDay,
                heightCm: heightCm,
                trainingStatus: trainingStatus,
                trainingDaysPerWeek: trainingDaysPerWeek,
                profileRevision: profileRevision,
                dailyActivity: dailyActivity,
                goalMode: goalMode,
                unitSystem: unitSystem,
                onboardedEpochDay: onboardedEpochDay,
                bodyFatPercent: bodyFatPercent,
                requestedLossFraction: requestedLossFraction,
                pregnant: pregnant,
                breastfeeding: breastfeeding,
                eatingDisorderHistory: eatingDisorderHistory,
                chronicKidneyDisease: chronicKidneyDisease,
                androgenUse: androgenUse,
                pcos: pcos,
                menopause: menopause,
                thyroidCondition: thyroidCondition,
                insulinOrSulfonylurea: insulinOrSulfonylurea,
                insulinCareTeamConfirmed: insulinCareTeamConfirmed,
                bariatricSurgery: bariatricSurgery,
                weightAffectingMedication: weightAffectingMedication,
                healthCheckConfirmedEpochDay: healthCheckConfirmedEpochDay,
                healthCheckSkipCount: healthCheckSkipCount,
                creatineStartedEpochDay: creatineStartedEpochDay,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String sex,
                required int birthEpochDay,
                required double heightCm,
                required TrainingStatus trainingStatus,
                required int trainingDaysPerWeek,
                Value<int> profileRevision = const Value.absent(),
                Value<DailyActivity> dailyActivity = const Value.absent(),
                required GoalMode goalMode,
                required UnitSystem unitSystem,
                required int onboardedEpochDay,
                Value<double?> bodyFatPercent = const Value.absent(),
                Value<double?> requestedLossFraction = const Value.absent(),
                Value<bool> pregnant = const Value.absent(),
                Value<bool> breastfeeding = const Value.absent(),
                Value<bool> eatingDisorderHistory = const Value.absent(),
                Value<bool> chronicKidneyDisease = const Value.absent(),
                Value<bool> androgenUse = const Value.absent(),
                Value<bool> pcos = const Value.absent(),
                Value<bool> menopause = const Value.absent(),
                Value<bool> thyroidCondition = const Value.absent(),
                Value<bool> insulinOrSulfonylurea = const Value.absent(),
                Value<bool> insulinCareTeamConfirmed = const Value.absent(),
                Value<bool> bariatricSurgery = const Value.absent(),
                Value<bool> weightAffectingMedication = const Value.absent(),
                Value<int?> healthCheckConfirmedEpochDay = const Value.absent(),
                Value<int> healthCheckSkipCount = const Value.absent(),
                Value<int?> creatineStartedEpochDay = const Value.absent(),
              }) => SetupsCompanion.insert(
                id: id,
                sex: sex,
                birthEpochDay: birthEpochDay,
                heightCm: heightCm,
                trainingStatus: trainingStatus,
                trainingDaysPerWeek: trainingDaysPerWeek,
                profileRevision: profileRevision,
                dailyActivity: dailyActivity,
                goalMode: goalMode,
                unitSystem: unitSystem,
                onboardedEpochDay: onboardedEpochDay,
                bodyFatPercent: bodyFatPercent,
                requestedLossFraction: requestedLossFraction,
                pregnant: pregnant,
                breastfeeding: breastfeeding,
                eatingDisorderHistory: eatingDisorderHistory,
                chronicKidneyDisease: chronicKidneyDisease,
                androgenUse: androgenUse,
                pcos: pcos,
                menopause: menopause,
                thyroidCondition: thyroidCondition,
                insulinOrSulfonylurea: insulinOrSulfonylurea,
                insulinCareTeamConfirmed: insulinCareTeamConfirmed,
                bariatricSurgery: bariatricSurgery,
                weightAffectingMedication: weightAffectingMedication,
                healthCheckConfirmedEpochDay: healthCheckConfirmedEpochDay,
                healthCheckSkipCount: healthCheckSkipCount,
                creatineStartedEpochDay: creatineStartedEpochDay,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$SetupsTable, SetupRow>(table),
                  BaseReferences<_$AppDatabase, $SetupsTable, SetupRow>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SetupsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SetupsTable,
      SetupRow,
      $$SetupsTableFilterComposer,
      $$SetupsTableOrderingComposer,
      $$SetupsTableAnnotationComposer,
      $$SetupsTableCreateCompanionBuilder,
      $$SetupsTableUpdateCompanionBuilder,
      (SetupRow, BaseReferences<_$AppDatabase, $SetupsTable, SetupRow>),
      SetupRow,
      PrefetchHooks Function()
    >;
typedef $$WeightEntriesTableCreateCompanionBuilder =
    WeightEntriesCompanion Function({
      Value<int> epochDay,
      required double weightKg,
      Value<String?> deviceId,
    });
typedef $$WeightEntriesTableUpdateCompanionBuilder =
    WeightEntriesCompanion Function({
      Value<int> epochDay,
      Value<double> weightKg,
      Value<String?> deviceId,
    });

class $$WeightEntriesTableFilterComposer
    extends Composer<_$AppDatabase, $WeightEntriesTable> {
  $$WeightEntriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get epochDay => $composableBuilder(
    column: $table.epochDay,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get weightKg => $composableBuilder(
    column: $table.weightKg,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get deviceId => $composableBuilder(
    column: $table.deviceId,
    builder: (column) => ColumnFilters(column),
  );
}

class $$WeightEntriesTableOrderingComposer
    extends Composer<_$AppDatabase, $WeightEntriesTable> {
  $$WeightEntriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get epochDay => $composableBuilder(
    column: $table.epochDay,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get weightKg => $composableBuilder(
    column: $table.weightKg,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get deviceId => $composableBuilder(
    column: $table.deviceId,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$WeightEntriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $WeightEntriesTable> {
  $$WeightEntriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get epochDay =>
      $composableBuilder(column: $table.epochDay, builder: (column) => column);

  GeneratedColumn<double> get weightKg =>
      $composableBuilder(column: $table.weightKg, builder: (column) => column);

  GeneratedColumn<String> get deviceId =>
      $composableBuilder(column: $table.deviceId, builder: (column) => column);
}

class $$WeightEntriesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $WeightEntriesTable,
          WeightRow,
          $$WeightEntriesTableFilterComposer,
          $$WeightEntriesTableOrderingComposer,
          $$WeightEntriesTableAnnotationComposer,
          $$WeightEntriesTableCreateCompanionBuilder,
          $$WeightEntriesTableUpdateCompanionBuilder,
          (
            WeightRow,
            BaseReferences<_$AppDatabase, $WeightEntriesTable, WeightRow>,
          ),
          WeightRow,
          PrefetchHooks Function()
        > {
  $$WeightEntriesTableTableManager(_$AppDatabase db, $WeightEntriesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$WeightEntriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$WeightEntriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$WeightEntriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> epochDay = const Value.absent(),
                Value<double> weightKg = const Value.absent(),
                Value<String?> deviceId = const Value.absent(),
              }) => WeightEntriesCompanion(
                epochDay: epochDay,
                weightKg: weightKg,
                deviceId: deviceId,
              ),
          createCompanionCallback:
              ({
                Value<int> epochDay = const Value.absent(),
                required double weightKg,
                Value<String?> deviceId = const Value.absent(),
              }) => WeightEntriesCompanion.insert(
                epochDay: epochDay,
                weightKg: weightKg,
                deviceId: deviceId,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$WeightEntriesTable, WeightRow>(table),
                  BaseReferences<_$AppDatabase, $WeightEntriesTable, WeightRow>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$WeightEntriesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $WeightEntriesTable,
      WeightRow,
      $$WeightEntriesTableFilterComposer,
      $$WeightEntriesTableOrderingComposer,
      $$WeightEntriesTableAnnotationComposer,
      $$WeightEntriesTableCreateCompanionBuilder,
      $$WeightEntriesTableUpdateCompanionBuilder,
      (
        WeightRow,
        BaseReferences<_$AppDatabase, $WeightEntriesTable, WeightRow>,
      ),
      WeightRow,
      PrefetchHooks Function()
    >;
typedef $$FoodEntriesTableCreateCompanionBuilder =
    FoodEntriesCompanion Function({
      Value<int> id,
      required int epochDay,
      required Meal meal,
      required String name,
      required double kcal,
      required double proteinG,
      required double carbsG,
      required double fatG,
      required QuantitySource quantitySource,
      Value<double?> portionQuantity,
      Value<PortionUnit?> portionUnit,
      Value<NutritionBasis?> nutritionBasis,
      Value<ReferenceBasis?> referenceBasis,
      Value<double?> referenceKcal,
      Value<double?> referenceProteinG,
      Value<double?> referenceCarbsG,
      Value<double?> referenceFatG,
      Value<String?> servingDescription,
      Value<double?> servingGrams,
      Value<double?> servingMilliliters,
      Value<PortionUnit?> servingUnit,
      Value<double?> densityGPerMl,
      Value<String?> originPackId,
      Value<int?> originFoodId,
      Value<String?> originSource,
      Value<String?> originSourceId,
      Value<DateTime> createdAt,
    });
typedef $$FoodEntriesTableUpdateCompanionBuilder =
    FoodEntriesCompanion Function({
      Value<int> id,
      Value<int> epochDay,
      Value<Meal> meal,
      Value<String> name,
      Value<double> kcal,
      Value<double> proteinG,
      Value<double> carbsG,
      Value<double> fatG,
      Value<QuantitySource> quantitySource,
      Value<double?> portionQuantity,
      Value<PortionUnit?> portionUnit,
      Value<NutritionBasis?> nutritionBasis,
      Value<ReferenceBasis?> referenceBasis,
      Value<double?> referenceKcal,
      Value<double?> referenceProteinG,
      Value<double?> referenceCarbsG,
      Value<double?> referenceFatG,
      Value<String?> servingDescription,
      Value<double?> servingGrams,
      Value<double?> servingMilliliters,
      Value<PortionUnit?> servingUnit,
      Value<double?> densityGPerMl,
      Value<String?> originPackId,
      Value<int?> originFoodId,
      Value<String?> originSource,
      Value<String?> originSourceId,
      Value<DateTime> createdAt,
    });

class $$FoodEntriesTableFilterComposer
    extends Composer<_$AppDatabase, $FoodEntriesTable> {
  $$FoodEntriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get epochDay => $composableBuilder(
    column: $table.epochDay,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<Meal, Meal, String> get meal =>
      $composableBuilder(
        column: $table.meal,
        builder: (column) => ColumnWithTypeConverterFilters(column),
      );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get kcal => $composableBuilder(
    column: $table.kcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<QuantitySource, QuantitySource, String>
  get quantitySource => $composableBuilder(
    column: $table.quantitySource,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<double> get portionQuantity => $composableBuilder(
    column: $table.portionQuantity,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<PortionUnit?, PortionUnit, String>
  get portionUnit => $composableBuilder(
    column: $table.portionUnit,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnWithTypeConverterFilters<NutritionBasis?, NutritionBasis, String>
  get nutritionBasis => $composableBuilder(
    column: $table.nutritionBasis,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnWithTypeConverterFilters<ReferenceBasis?, ReferenceBasis, String>
  get referenceBasis => $composableBuilder(
    column: $table.referenceBasis,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<double> get referenceKcal => $composableBuilder(
    column: $table.referenceKcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get referenceProteinG => $composableBuilder(
    column: $table.referenceProteinG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get referenceCarbsG => $composableBuilder(
    column: $table.referenceCarbsG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get referenceFatG => $composableBuilder(
    column: $table.referenceFatG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get servingDescription => $composableBuilder(
    column: $table.servingDescription,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get servingGrams => $composableBuilder(
    column: $table.servingGrams,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get servingMilliliters => $composableBuilder(
    column: $table.servingMilliliters,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<PortionUnit?, PortionUnit, String>
  get servingUnit => $composableBuilder(
    column: $table.servingUnit,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<double> get densityGPerMl => $composableBuilder(
    column: $table.densityGPerMl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get originPackId => $composableBuilder(
    column: $table.originPackId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get originFoodId => $composableBuilder(
    column: $table.originFoodId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get originSource => $composableBuilder(
    column: $table.originSource,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get originSourceId => $composableBuilder(
    column: $table.originSourceId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$FoodEntriesTableOrderingComposer
    extends Composer<_$AppDatabase, $FoodEntriesTable> {
  $$FoodEntriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get epochDay => $composableBuilder(
    column: $table.epochDay,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get meal => $composableBuilder(
    column: $table.meal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get kcal => $composableBuilder(
    column: $table.kcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get quantitySource => $composableBuilder(
    column: $table.quantitySource,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get portionQuantity => $composableBuilder(
    column: $table.portionQuantity,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get portionUnit => $composableBuilder(
    column: $table.portionUnit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get nutritionBasis => $composableBuilder(
    column: $table.nutritionBasis,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get referenceBasis => $composableBuilder(
    column: $table.referenceBasis,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get referenceKcal => $composableBuilder(
    column: $table.referenceKcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get referenceProteinG => $composableBuilder(
    column: $table.referenceProteinG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get referenceCarbsG => $composableBuilder(
    column: $table.referenceCarbsG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get referenceFatG => $composableBuilder(
    column: $table.referenceFatG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get servingDescription => $composableBuilder(
    column: $table.servingDescription,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get servingGrams => $composableBuilder(
    column: $table.servingGrams,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get servingMilliliters => $composableBuilder(
    column: $table.servingMilliliters,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get servingUnit => $composableBuilder(
    column: $table.servingUnit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get densityGPerMl => $composableBuilder(
    column: $table.densityGPerMl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get originPackId => $composableBuilder(
    column: $table.originPackId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get originFoodId => $composableBuilder(
    column: $table.originFoodId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get originSource => $composableBuilder(
    column: $table.originSource,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get originSourceId => $composableBuilder(
    column: $table.originSourceId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$FoodEntriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $FoodEntriesTable> {
  $$FoodEntriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get epochDay =>
      $composableBuilder(column: $table.epochDay, builder: (column) => column);

  GeneratedColumnWithTypeConverter<Meal, String> get meal =>
      $composableBuilder(column: $table.meal, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<double> get kcal =>
      $composableBuilder(column: $table.kcal, builder: (column) => column);

  GeneratedColumn<double> get proteinG =>
      $composableBuilder(column: $table.proteinG, builder: (column) => column);

  GeneratedColumn<double> get carbsG =>
      $composableBuilder(column: $table.carbsG, builder: (column) => column);

  GeneratedColumn<double> get fatG =>
      $composableBuilder(column: $table.fatG, builder: (column) => column);

  GeneratedColumnWithTypeConverter<QuantitySource, String> get quantitySource =>
      $composableBuilder(
        column: $table.quantitySource,
        builder: (column) => column,
      );

  GeneratedColumn<double> get portionQuantity => $composableBuilder(
    column: $table.portionQuantity,
    builder: (column) => column,
  );

  GeneratedColumnWithTypeConverter<PortionUnit?, String> get portionUnit =>
      $composableBuilder(
        column: $table.portionUnit,
        builder: (column) => column,
      );

  GeneratedColumnWithTypeConverter<NutritionBasis?, String>
  get nutritionBasis => $composableBuilder(
    column: $table.nutritionBasis,
    builder: (column) => column,
  );

  GeneratedColumnWithTypeConverter<ReferenceBasis?, String>
  get referenceBasis => $composableBuilder(
    column: $table.referenceBasis,
    builder: (column) => column,
  );

  GeneratedColumn<double> get referenceKcal => $composableBuilder(
    column: $table.referenceKcal,
    builder: (column) => column,
  );

  GeneratedColumn<double> get referenceProteinG => $composableBuilder(
    column: $table.referenceProteinG,
    builder: (column) => column,
  );

  GeneratedColumn<double> get referenceCarbsG => $composableBuilder(
    column: $table.referenceCarbsG,
    builder: (column) => column,
  );

  GeneratedColumn<double> get referenceFatG => $composableBuilder(
    column: $table.referenceFatG,
    builder: (column) => column,
  );

  GeneratedColumn<String> get servingDescription => $composableBuilder(
    column: $table.servingDescription,
    builder: (column) => column,
  );

  GeneratedColumn<double> get servingGrams => $composableBuilder(
    column: $table.servingGrams,
    builder: (column) => column,
  );

  GeneratedColumn<double> get servingMilliliters => $composableBuilder(
    column: $table.servingMilliliters,
    builder: (column) => column,
  );

  GeneratedColumnWithTypeConverter<PortionUnit?, String> get servingUnit =>
      $composableBuilder(
        column: $table.servingUnit,
        builder: (column) => column,
      );

  GeneratedColumn<double> get densityGPerMl => $composableBuilder(
    column: $table.densityGPerMl,
    builder: (column) => column,
  );

  GeneratedColumn<String> get originPackId => $composableBuilder(
    column: $table.originPackId,
    builder: (column) => column,
  );

  GeneratedColumn<int> get originFoodId => $composableBuilder(
    column: $table.originFoodId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get originSource => $composableBuilder(
    column: $table.originSource,
    builder: (column) => column,
  );

  GeneratedColumn<String> get originSourceId => $composableBuilder(
    column: $table.originSourceId,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$FoodEntriesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $FoodEntriesTable,
          FoodRow,
          $$FoodEntriesTableFilterComposer,
          $$FoodEntriesTableOrderingComposer,
          $$FoodEntriesTableAnnotationComposer,
          $$FoodEntriesTableCreateCompanionBuilder,
          $$FoodEntriesTableUpdateCompanionBuilder,
          (FoodRow, BaseReferences<_$AppDatabase, $FoodEntriesTable, FoodRow>),
          FoodRow,
          PrefetchHooks Function()
        > {
  $$FoodEntriesTableTableManager(_$AppDatabase db, $FoodEntriesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FoodEntriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FoodEntriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FoodEntriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<int> epochDay = const Value.absent(),
                Value<Meal> meal = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<double> kcal = const Value.absent(),
                Value<double> proteinG = const Value.absent(),
                Value<double> carbsG = const Value.absent(),
                Value<double> fatG = const Value.absent(),
                Value<QuantitySource> quantitySource = const Value.absent(),
                Value<double?> portionQuantity = const Value.absent(),
                Value<PortionUnit?> portionUnit = const Value.absent(),
                Value<NutritionBasis?> nutritionBasis = const Value.absent(),
                Value<ReferenceBasis?> referenceBasis = const Value.absent(),
                Value<double?> referenceKcal = const Value.absent(),
                Value<double?> referenceProteinG = const Value.absent(),
                Value<double?> referenceCarbsG = const Value.absent(),
                Value<double?> referenceFatG = const Value.absent(),
                Value<String?> servingDescription = const Value.absent(),
                Value<double?> servingGrams = const Value.absent(),
                Value<double?> servingMilliliters = const Value.absent(),
                Value<PortionUnit?> servingUnit = const Value.absent(),
                Value<double?> densityGPerMl = const Value.absent(),
                Value<String?> originPackId = const Value.absent(),
                Value<int?> originFoodId = const Value.absent(),
                Value<String?> originSource = const Value.absent(),
                Value<String?> originSourceId = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => FoodEntriesCompanion(
                id: id,
                epochDay: epochDay,
                meal: meal,
                name: name,
                kcal: kcal,
                proteinG: proteinG,
                carbsG: carbsG,
                fatG: fatG,
                quantitySource: quantitySource,
                portionQuantity: portionQuantity,
                portionUnit: portionUnit,
                nutritionBasis: nutritionBasis,
                referenceBasis: referenceBasis,
                referenceKcal: referenceKcal,
                referenceProteinG: referenceProteinG,
                referenceCarbsG: referenceCarbsG,
                referenceFatG: referenceFatG,
                servingDescription: servingDescription,
                servingGrams: servingGrams,
                servingMilliliters: servingMilliliters,
                servingUnit: servingUnit,
                densityGPerMl: densityGPerMl,
                originPackId: originPackId,
                originFoodId: originFoodId,
                originSource: originSource,
                originSourceId: originSourceId,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required int epochDay,
                required Meal meal,
                required String name,
                required double kcal,
                required double proteinG,
                required double carbsG,
                required double fatG,
                required QuantitySource quantitySource,
                Value<double?> portionQuantity = const Value.absent(),
                Value<PortionUnit?> portionUnit = const Value.absent(),
                Value<NutritionBasis?> nutritionBasis = const Value.absent(),
                Value<ReferenceBasis?> referenceBasis = const Value.absent(),
                Value<double?> referenceKcal = const Value.absent(),
                Value<double?> referenceProteinG = const Value.absent(),
                Value<double?> referenceCarbsG = const Value.absent(),
                Value<double?> referenceFatG = const Value.absent(),
                Value<String?> servingDescription = const Value.absent(),
                Value<double?> servingGrams = const Value.absent(),
                Value<double?> servingMilliliters = const Value.absent(),
                Value<PortionUnit?> servingUnit = const Value.absent(),
                Value<double?> densityGPerMl = const Value.absent(),
                Value<String?> originPackId = const Value.absent(),
                Value<int?> originFoodId = const Value.absent(),
                Value<String?> originSource = const Value.absent(),
                Value<String?> originSourceId = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => FoodEntriesCompanion.insert(
                id: id,
                epochDay: epochDay,
                meal: meal,
                name: name,
                kcal: kcal,
                proteinG: proteinG,
                carbsG: carbsG,
                fatG: fatG,
                quantitySource: quantitySource,
                portionQuantity: portionQuantity,
                portionUnit: portionUnit,
                nutritionBasis: nutritionBasis,
                referenceBasis: referenceBasis,
                referenceKcal: referenceKcal,
                referenceProteinG: referenceProteinG,
                referenceCarbsG: referenceCarbsG,
                referenceFatG: referenceFatG,
                servingDescription: servingDescription,
                servingGrams: servingGrams,
                servingMilliliters: servingMilliliters,
                servingUnit: servingUnit,
                densityGPerMl: densityGPerMl,
                originPackId: originPackId,
                originFoodId: originFoodId,
                originSource: originSource,
                originSourceId: originSourceId,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$FoodEntriesTable, FoodRow>(table),
                  BaseReferences<_$AppDatabase, $FoodEntriesTable, FoodRow>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$FoodEntriesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $FoodEntriesTable,
      FoodRow,
      $$FoodEntriesTableFilterComposer,
      $$FoodEntriesTableOrderingComposer,
      $$FoodEntriesTableAnnotationComposer,
      $$FoodEntriesTableCreateCompanionBuilder,
      $$FoodEntriesTableUpdateCompanionBuilder,
      (FoodRow, BaseReferences<_$AppDatabase, $FoodEntriesTable, FoodRow>),
      FoodRow,
      PrefetchHooks Function()
    >;
typedef $$DayMarksTableCreateCompanionBuilder = DayMarksCompanion Function({
  Value<int> epochDay,
  required DayCompleteness completeness,
});
typedef $$DayMarksTableUpdateCompanionBuilder = DayMarksCompanion Function({
  Value<int> epochDay,
  Value<DayCompleteness> completeness,
});

class $$DayMarksTableFilterComposer
    extends Composer<_$AppDatabase, $DayMarksTable> {
  $$DayMarksTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get epochDay => $composableBuilder(
    column: $table.epochDay,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<DayCompleteness, DayCompleteness, String>
  get completeness => $composableBuilder(
    column: $table.completeness,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );
}

class $$DayMarksTableOrderingComposer
    extends Composer<_$AppDatabase, $DayMarksTable> {
  $$DayMarksTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get epochDay => $composableBuilder(
    column: $table.epochDay,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get completeness => $composableBuilder(
    column: $table.completeness,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$DayMarksTableAnnotationComposer
    extends Composer<_$AppDatabase, $DayMarksTable> {
  $$DayMarksTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get epochDay =>
      $composableBuilder(column: $table.epochDay, builder: (column) => column);

  GeneratedColumnWithTypeConverter<DayCompleteness, String> get completeness =>
      $composableBuilder(
        column: $table.completeness,
        builder: (column) => column,
      );
}

class $$DayMarksTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $DayMarksTable,
          DayMarkRow,
          $$DayMarksTableFilterComposer,
          $$DayMarksTableOrderingComposer,
          $$DayMarksTableAnnotationComposer,
          $$DayMarksTableCreateCompanionBuilder,
          $$DayMarksTableUpdateCompanionBuilder,
          (
            DayMarkRow,
            BaseReferences<_$AppDatabase, $DayMarksTable, DayMarkRow>,
          ),
          DayMarkRow,
          PrefetchHooks Function()
        > {
  $$DayMarksTableTableManager(_$AppDatabase db, $DayMarksTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$DayMarksTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$DayMarksTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$DayMarksTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> epochDay = const Value.absent(),
                Value<DayCompleteness> completeness = const Value.absent(),
              }) => DayMarksCompanion(
                epochDay: epochDay,
                completeness: completeness,
              ),
          createCompanionCallback:
              ({
                Value<int> epochDay = const Value.absent(),
                required DayCompleteness completeness,
              }) => DayMarksCompanion.insert(
                epochDay: epochDay,
                completeness: completeness,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$DayMarksTable, DayMarkRow>(table),
                  BaseReferences<_$AppDatabase, $DayMarksTable, DayMarkRow>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$DayMarksTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $DayMarksTable,
      DayMarkRow,
      $$DayMarksTableFilterComposer,
      $$DayMarksTableOrderingComposer,
      $$DayMarksTableAnnotationComposer,
      $$DayMarksTableCreateCompanionBuilder,
      $$DayMarksTableUpdateCompanionBuilder,
      (DayMarkRow, BaseReferences<_$AppDatabase, $DayMarksTable, DayMarkRow>),
      DayMarkRow,
      PrefetchHooks Function()
    >;
typedef $$WaistEntriesTableCreateCompanionBuilder =
    WaistEntriesCompanion Function({
      Value<int> epochDay,
      required double waistCm,
    });
typedef $$WaistEntriesTableUpdateCompanionBuilder =
    WaistEntriesCompanion Function({
      Value<int> epochDay,
      Value<double> waistCm,
    });

class $$WaistEntriesTableFilterComposer
    extends Composer<_$AppDatabase, $WaistEntriesTable> {
  $$WaistEntriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get epochDay => $composableBuilder(
    column: $table.epochDay,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get waistCm => $composableBuilder(
    column: $table.waistCm,
    builder: (column) => ColumnFilters(column),
  );
}

class $$WaistEntriesTableOrderingComposer
    extends Composer<_$AppDatabase, $WaistEntriesTable> {
  $$WaistEntriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get epochDay => $composableBuilder(
    column: $table.epochDay,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get waistCm => $composableBuilder(
    column: $table.waistCm,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$WaistEntriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $WaistEntriesTable> {
  $$WaistEntriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get epochDay =>
      $composableBuilder(column: $table.epochDay, builder: (column) => column);

  GeneratedColumn<double> get waistCm =>
      $composableBuilder(column: $table.waistCm, builder: (column) => column);
}

class $$WaistEntriesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $WaistEntriesTable,
          WaistRow,
          $$WaistEntriesTableFilterComposer,
          $$WaistEntriesTableOrderingComposer,
          $$WaistEntriesTableAnnotationComposer,
          $$WaistEntriesTableCreateCompanionBuilder,
          $$WaistEntriesTableUpdateCompanionBuilder,
          (
            WaistRow,
            BaseReferences<_$AppDatabase, $WaistEntriesTable, WaistRow>,
          ),
          WaistRow,
          PrefetchHooks Function()
        > {
  $$WaistEntriesTableTableManager(_$AppDatabase db, $WaistEntriesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$WaistEntriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$WaistEntriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$WaistEntriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> epochDay = const Value.absent(),
            Value<double> waistCm = const Value.absent(),
          }) => WaistEntriesCompanion(epochDay: epochDay, waistCm: waistCm),
          createCompanionCallback:
              ({
                Value<int> epochDay = const Value.absent(),
                required double waistCm,
              }) => WaistEntriesCompanion.insert(
                epochDay: epochDay,
                waistCm: waistCm,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$WaistEntriesTable, WaistRow>(table),
                  BaseReferences<_$AppDatabase, $WaistEntriesTable, WaistRow>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$WaistEntriesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $WaistEntriesTable,
      WaistRow,
      $$WaistEntriesTableFilterComposer,
      $$WaistEntriesTableOrderingComposer,
      $$WaistEntriesTableAnnotationComposer,
      $$WaistEntriesTableCreateCompanionBuilder,
      $$WaistEntriesTableUpdateCompanionBuilder,
      (WaistRow, BaseReferences<_$AppDatabase, $WaistEntriesTable, WaistRow>),
      WaistRow,
      PrefetchHooks Function()
    >;
typedef $$TargetsHistoryTableCreateCompanionBuilder =
    TargetsHistoryCompanion Function({
      Value<int> effectiveEpochDay,
      required GoalMode mode,
      required double kcal,
      required double proteinG,
      Value<double?> proteinMinimumG,
      required double fatG,
      required double carbsG,
      required double weeklyRateFraction,
      Value<String> flags,
      required double tdeeKcal,
      required double tdeeSigmaKcal,
      Value<String?> explanation,
      Value<bool> summarySeen,
      Value<int> targetRulesVersion,
      Value<int> profileRevision,
      Value<double?> safetyBodyFatPercent,
      required TdeeStatus tdeeStatus,
    });
typedef $$TargetsHistoryTableUpdateCompanionBuilder =
    TargetsHistoryCompanion Function({
      Value<int> effectiveEpochDay,
      Value<GoalMode> mode,
      Value<double> kcal,
      Value<double> proteinG,
      Value<double?> proteinMinimumG,
      Value<double> fatG,
      Value<double> carbsG,
      Value<double> weeklyRateFraction,
      Value<String> flags,
      Value<double> tdeeKcal,
      Value<double> tdeeSigmaKcal,
      Value<String?> explanation,
      Value<bool> summarySeen,
      Value<int> targetRulesVersion,
      Value<int> profileRevision,
      Value<double?> safetyBodyFatPercent,
      Value<TdeeStatus> tdeeStatus,
    });

class $$TargetsHistoryTableFilterComposer
    extends Composer<_$AppDatabase, $TargetsHistoryTable> {
  $$TargetsHistoryTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get effectiveEpochDay => $composableBuilder(
    column: $table.effectiveEpochDay,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<GoalMode, GoalMode, String> get mode =>
      $composableBuilder(
        column: $table.mode,
        builder: (column) => ColumnWithTypeConverterFilters(column),
      );

  ColumnFilters<double> get kcal => $composableBuilder(
    column: $table.kcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get proteinMinimumG => $composableBuilder(
    column: $table.proteinMinimumG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get weeklyRateFraction => $composableBuilder(
    column: $table.weeklyRateFraction,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get flags => $composableBuilder(
    column: $table.flags,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get tdeeKcal => $composableBuilder(
    column: $table.tdeeKcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get tdeeSigmaKcal => $composableBuilder(
    column: $table.tdeeSigmaKcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get explanation => $composableBuilder(
    column: $table.explanation,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get summarySeen => $composableBuilder(
    column: $table.summarySeen,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get targetRulesVersion => $composableBuilder(
    column: $table.targetRulesVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get profileRevision => $composableBuilder(
    column: $table.profileRevision,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get safetyBodyFatPercent => $composableBuilder(
    column: $table.safetyBodyFatPercent,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<TdeeStatus, TdeeStatus, String>
  get tdeeStatus => $composableBuilder(
    column: $table.tdeeStatus,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );
}

class $$TargetsHistoryTableOrderingComposer
    extends Composer<_$AppDatabase, $TargetsHistoryTable> {
  $$TargetsHistoryTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get effectiveEpochDay => $composableBuilder(
    column: $table.effectiveEpochDay,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get mode => $composableBuilder(
    column: $table.mode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get kcal => $composableBuilder(
    column: $table.kcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get proteinMinimumG => $composableBuilder(
    column: $table.proteinMinimumG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get weeklyRateFraction => $composableBuilder(
    column: $table.weeklyRateFraction,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get flags => $composableBuilder(
    column: $table.flags,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get tdeeKcal => $composableBuilder(
    column: $table.tdeeKcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get tdeeSigmaKcal => $composableBuilder(
    column: $table.tdeeSigmaKcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get explanation => $composableBuilder(
    column: $table.explanation,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get summarySeen => $composableBuilder(
    column: $table.summarySeen,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get targetRulesVersion => $composableBuilder(
    column: $table.targetRulesVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get profileRevision => $composableBuilder(
    column: $table.profileRevision,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get safetyBodyFatPercent => $composableBuilder(
    column: $table.safetyBodyFatPercent,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get tdeeStatus => $composableBuilder(
    column: $table.tdeeStatus,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$TargetsHistoryTableAnnotationComposer
    extends Composer<_$AppDatabase, $TargetsHistoryTable> {
  $$TargetsHistoryTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get effectiveEpochDay => $composableBuilder(
    column: $table.effectiveEpochDay,
    builder: (column) => column,
  );

  GeneratedColumnWithTypeConverter<GoalMode, String> get mode =>
      $composableBuilder(column: $table.mode, builder: (column) => column);

  GeneratedColumn<double> get kcal =>
      $composableBuilder(column: $table.kcal, builder: (column) => column);

  GeneratedColumn<double> get proteinG =>
      $composableBuilder(column: $table.proteinG, builder: (column) => column);

  GeneratedColumn<double> get proteinMinimumG => $composableBuilder(
    column: $table.proteinMinimumG,
    builder: (column) => column,
  );

  GeneratedColumn<double> get fatG =>
      $composableBuilder(column: $table.fatG, builder: (column) => column);

  GeneratedColumn<double> get carbsG =>
      $composableBuilder(column: $table.carbsG, builder: (column) => column);

  GeneratedColumn<double> get weeklyRateFraction => $composableBuilder(
    column: $table.weeklyRateFraction,
    builder: (column) => column,
  );

  GeneratedColumn<String> get flags =>
      $composableBuilder(column: $table.flags, builder: (column) => column);

  GeneratedColumn<double> get tdeeKcal =>
      $composableBuilder(column: $table.tdeeKcal, builder: (column) => column);

  GeneratedColumn<double> get tdeeSigmaKcal => $composableBuilder(
    column: $table.tdeeSigmaKcal,
    builder: (column) => column,
  );

  GeneratedColumn<String> get explanation => $composableBuilder(
    column: $table.explanation,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get summarySeen => $composableBuilder(
    column: $table.summarySeen,
    builder: (column) => column,
  );

  GeneratedColumn<int> get targetRulesVersion => $composableBuilder(
    column: $table.targetRulesVersion,
    builder: (column) => column,
  );

  GeneratedColumn<int> get profileRevision => $composableBuilder(
    column: $table.profileRevision,
    builder: (column) => column,
  );

  GeneratedColumn<double> get safetyBodyFatPercent => $composableBuilder(
    column: $table.safetyBodyFatPercent,
    builder: (column) => column,
  );

  GeneratedColumnWithTypeConverter<TdeeStatus, String> get tdeeStatus =>
      $composableBuilder(
        column: $table.tdeeStatus,
        builder: (column) => column,
      );
}

class $$TargetsHistoryTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $TargetsHistoryTable,
          TargetsRow,
          $$TargetsHistoryTableFilterComposer,
          $$TargetsHistoryTableOrderingComposer,
          $$TargetsHistoryTableAnnotationComposer,
          $$TargetsHistoryTableCreateCompanionBuilder,
          $$TargetsHistoryTableUpdateCompanionBuilder,
          (
            TargetsRow,
            BaseReferences<_$AppDatabase, $TargetsHistoryTable, TargetsRow>,
          ),
          TargetsRow,
          PrefetchHooks Function()
        > {
  $$TargetsHistoryTableTableManager(
    _$AppDatabase db,
    $TargetsHistoryTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TargetsHistoryTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$TargetsHistoryTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$TargetsHistoryTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> effectiveEpochDay = const Value.absent(),
                Value<GoalMode> mode = const Value.absent(),
                Value<double> kcal = const Value.absent(),
                Value<double> proteinG = const Value.absent(),
                Value<double?> proteinMinimumG = const Value.absent(),
                Value<double> fatG = const Value.absent(),
                Value<double> carbsG = const Value.absent(),
                Value<double> weeklyRateFraction = const Value.absent(),
                Value<String> flags = const Value.absent(),
                Value<double> tdeeKcal = const Value.absent(),
                Value<double> tdeeSigmaKcal = const Value.absent(),
                Value<String?> explanation = const Value.absent(),
                Value<bool> summarySeen = const Value.absent(),
                Value<int> targetRulesVersion = const Value.absent(),
                Value<int> profileRevision = const Value.absent(),
                Value<double?> safetyBodyFatPercent = const Value.absent(),
                Value<TdeeStatus> tdeeStatus = const Value.absent(),
              }) => TargetsHistoryCompanion(
                effectiveEpochDay: effectiveEpochDay,
                mode: mode,
                kcal: kcal,
                proteinG: proteinG,
                proteinMinimumG: proteinMinimumG,
                fatG: fatG,
                carbsG: carbsG,
                weeklyRateFraction: weeklyRateFraction,
                flags: flags,
                tdeeKcal: tdeeKcal,
                tdeeSigmaKcal: tdeeSigmaKcal,
                explanation: explanation,
                summarySeen: summarySeen,
                targetRulesVersion: targetRulesVersion,
                profileRevision: profileRevision,
                safetyBodyFatPercent: safetyBodyFatPercent,
                tdeeStatus: tdeeStatus,
              ),
          createCompanionCallback:
              ({
                Value<int> effectiveEpochDay = const Value.absent(),
                required GoalMode mode,
                required double kcal,
                required double proteinG,
                Value<double?> proteinMinimumG = const Value.absent(),
                required double fatG,
                required double carbsG,
                required double weeklyRateFraction,
                Value<String> flags = const Value.absent(),
                required double tdeeKcal,
                required double tdeeSigmaKcal,
                Value<String?> explanation = const Value.absent(),
                Value<bool> summarySeen = const Value.absent(),
                Value<int> targetRulesVersion = const Value.absent(),
                Value<int> profileRevision = const Value.absent(),
                Value<double?> safetyBodyFatPercent = const Value.absent(),
                required TdeeStatus tdeeStatus,
              }) => TargetsHistoryCompanion.insert(
                effectiveEpochDay: effectiveEpochDay,
                mode: mode,
                kcal: kcal,
                proteinG: proteinG,
                proteinMinimumG: proteinMinimumG,
                fatG: fatG,
                carbsG: carbsG,
                weeklyRateFraction: weeklyRateFraction,
                flags: flags,
                tdeeKcal: tdeeKcal,
                tdeeSigmaKcal: tdeeSigmaKcal,
                explanation: explanation,
                summarySeen: summarySeen,
                targetRulesVersion: targetRulesVersion,
                profileRevision: profileRevision,
                safetyBodyFatPercent: safetyBodyFatPercent,
                tdeeStatus: tdeeStatus,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$TargetsHistoryTable, TargetsRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $TargetsHistoryTable,
                    TargetsRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$TargetsHistoryTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $TargetsHistoryTable,
      TargetsRow,
      $$TargetsHistoryTableFilterComposer,
      $$TargetsHistoryTableOrderingComposer,
      $$TargetsHistoryTableAnnotationComposer,
      $$TargetsHistoryTableCreateCompanionBuilder,
      $$TargetsHistoryTableUpdateCompanionBuilder,
      (
        TargetsRow,
        BaseReferences<_$AppDatabase, $TargetsHistoryTable, TargetsRow>,
      ),
      TargetsRow,
      PrefetchHooks Function()
    >;
typedef $$UserPreferencesTableCreateCompanionBuilder =
    UserPreferencesCompanion Function({
      Value<int> id,
      Value<ThemePreference> themePreference,
      Value<bool> easyToMissEnabled,
      Value<int?> easyToMissLastShownEpochDay,
    });
typedef $$UserPreferencesTableUpdateCompanionBuilder =
    UserPreferencesCompanion Function({
      Value<int> id,
      Value<ThemePreference> themePreference,
      Value<bool> easyToMissEnabled,
      Value<int?> easyToMissLastShownEpochDay,
    });

class $$UserPreferencesTableFilterComposer
    extends Composer<_$AppDatabase, $UserPreferencesTable> {
  $$UserPreferencesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<ThemePreference, ThemePreference, String>
  get themePreference => $composableBuilder(
    column: $table.themePreference,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<bool> get easyToMissEnabled => $composableBuilder(
    column: $table.easyToMissEnabled,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get easyToMissLastShownEpochDay => $composableBuilder(
    column: $table.easyToMissLastShownEpochDay,
    builder: (column) => ColumnFilters(column),
  );
}

class $$UserPreferencesTableOrderingComposer
    extends Composer<_$AppDatabase, $UserPreferencesTable> {
  $$UserPreferencesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get themePreference => $composableBuilder(
    column: $table.themePreference,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get easyToMissEnabled => $composableBuilder(
    column: $table.easyToMissEnabled,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get easyToMissLastShownEpochDay => $composableBuilder(
    column: $table.easyToMissLastShownEpochDay,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$UserPreferencesTableAnnotationComposer
    extends Composer<_$AppDatabase, $UserPreferencesTable> {
  $$UserPreferencesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumnWithTypeConverter<ThemePreference, String>
  get themePreference => $composableBuilder(
    column: $table.themePreference,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get easyToMissEnabled => $composableBuilder(
    column: $table.easyToMissEnabled,
    builder: (column) => column,
  );

  GeneratedColumn<int> get easyToMissLastShownEpochDay => $composableBuilder(
    column: $table.easyToMissLastShownEpochDay,
    builder: (column) => column,
  );
}

class $$UserPreferencesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $UserPreferencesTable,
          PreferencesRow,
          $$UserPreferencesTableFilterComposer,
          $$UserPreferencesTableOrderingComposer,
          $$UserPreferencesTableAnnotationComposer,
          $$UserPreferencesTableCreateCompanionBuilder,
          $$UserPreferencesTableUpdateCompanionBuilder,
          (
            PreferencesRow,
            BaseReferences<
              _$AppDatabase,
              $UserPreferencesTable,
              PreferencesRow
            >,
          ),
          PreferencesRow,
          PrefetchHooks Function()
        > {
  $$UserPreferencesTableTableManager(
    _$AppDatabase db,
    $UserPreferencesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$UserPreferencesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$UserPreferencesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$UserPreferencesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<ThemePreference> themePreference = const Value.absent(),
                Value<bool> easyToMissEnabled = const Value.absent(),
                Value<int?> easyToMissLastShownEpochDay = const Value.absent(),
              }) => UserPreferencesCompanion(
                id: id,
                themePreference: themePreference,
                easyToMissEnabled: easyToMissEnabled,
                easyToMissLastShownEpochDay: easyToMissLastShownEpochDay,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<ThemePreference> themePreference = const Value.absent(),
                Value<bool> easyToMissEnabled = const Value.absent(),
                Value<int?> easyToMissLastShownEpochDay = const Value.absent(),
              }) => UserPreferencesCompanion.insert(
                id: id,
                themePreference: themePreference,
                easyToMissEnabled: easyToMissEnabled,
                easyToMissLastShownEpochDay: easyToMissLastShownEpochDay,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$UserPreferencesTable, PreferencesRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $UserPreferencesTable,
                    PreferencesRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$UserPreferencesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $UserPreferencesTable,
      PreferencesRow,
      $$UserPreferencesTableFilterComposer,
      $$UserPreferencesTableOrderingComposer,
      $$UserPreferencesTableAnnotationComposer,
      $$UserPreferencesTableCreateCompanionBuilder,
      $$UserPreferencesTableUpdateCompanionBuilder,
      (
        PreferencesRow,
        BaseReferences<_$AppDatabase, $UserPreferencesTable, PreferencesRow>,
      ),
      PreferencesRow,
      PrefetchHooks Function()
    >;
typedef $$WeightEventsTableCreateCompanionBuilder =
    WeightEventsCompanion Function({
      required int dateEpochDay,
      required WeightEventType type,
      Value<int> rowid,
    });
typedef $$WeightEventsTableUpdateCompanionBuilder =
    WeightEventsCompanion Function({
      Value<int> dateEpochDay,
      Value<WeightEventType> type,
      Value<int> rowid,
    });

class $$WeightEventsTableFilterComposer
    extends Composer<_$AppDatabase, $WeightEventsTable> {
  $$WeightEventsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get dateEpochDay => $composableBuilder(
    column: $table.dateEpochDay,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<WeightEventType, WeightEventType, String>
  get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );
}

class $$WeightEventsTableOrderingComposer
    extends Composer<_$AppDatabase, $WeightEventsTable> {
  $$WeightEventsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get dateEpochDay => $composableBuilder(
    column: $table.dateEpochDay,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$WeightEventsTableAnnotationComposer
    extends Composer<_$AppDatabase, $WeightEventsTable> {
  $$WeightEventsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get dateEpochDay => $composableBuilder(
    column: $table.dateEpochDay,
    builder: (column) => column,
  );

  GeneratedColumnWithTypeConverter<WeightEventType, String> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);
}

class $$WeightEventsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $WeightEventsTable,
          WeightEventRow,
          $$WeightEventsTableFilterComposer,
          $$WeightEventsTableOrderingComposer,
          $$WeightEventsTableAnnotationComposer,
          $$WeightEventsTableCreateCompanionBuilder,
          $$WeightEventsTableUpdateCompanionBuilder,
          (
            WeightEventRow,
            BaseReferences<_$AppDatabase, $WeightEventsTable, WeightEventRow>,
          ),
          WeightEventRow,
          PrefetchHooks Function()
        > {
  $$WeightEventsTableTableManager(_$AppDatabase db, $WeightEventsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$WeightEventsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$WeightEventsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$WeightEventsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> dateEpochDay = const Value.absent(),
                Value<WeightEventType> type = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => WeightEventsCompanion(
                dateEpochDay: dateEpochDay,
                type: type,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required int dateEpochDay,
                required WeightEventType type,
                Value<int> rowid = const Value.absent(),
              }) => WeightEventsCompanion.insert(
                dateEpochDay: dateEpochDay,
                type: type,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$WeightEventsTable, WeightEventRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $WeightEventsTable,
                    WeightEventRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$WeightEventsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $WeightEventsTable,
      WeightEventRow,
      $$WeightEventsTableFilterComposer,
      $$WeightEventsTableOrderingComposer,
      $$WeightEventsTableAnnotationComposer,
      $$WeightEventsTableCreateCompanionBuilder,
      $$WeightEventsTableUpdateCompanionBuilder,
      (
        WeightEventRow,
        BaseReferences<_$AppDatabase, $WeightEventsTable, WeightEventRow>,
      ),
      WeightEventRow,
      PrefetchHooks Function()
    >;
typedef $$CustomFoodsTableCreateCompanionBuilder =
    CustomFoodsCompanion Function({
      Value<int> id,
      required String name,
      required CustomFoodKind kind,
      required String servingDescription,
      Value<double?> servingGrams,
      required double kcal,
      required double proteinG,
      required double carbsG,
      required double fatG,
      Value<String?> barcode,
      Value<double?> servings,
      Value<double?> cookedWeightGrams,
    });
typedef $$CustomFoodsTableUpdateCompanionBuilder =
    CustomFoodsCompanion Function({
      Value<int> id,
      Value<String> name,
      Value<CustomFoodKind> kind,
      Value<String> servingDescription,
      Value<double?> servingGrams,
      Value<double> kcal,
      Value<double> proteinG,
      Value<double> carbsG,
      Value<double> fatG,
      Value<String?> barcode,
      Value<double?> servings,
      Value<double?> cookedWeightGrams,
    });

class $$CustomFoodsTableFilterComposer
    extends Composer<_$AppDatabase, $CustomFoodsTable> {
  $$CustomFoodsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<CustomFoodKind, CustomFoodKind, String>
  get kind => $composableBuilder(
    column: $table.kind,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<String> get servingDescription => $composableBuilder(
    column: $table.servingDescription,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get servingGrams => $composableBuilder(
    column: $table.servingGrams,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get kcal => $composableBuilder(
    column: $table.kcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get barcode => $composableBuilder(
    column: $table.barcode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get servings => $composableBuilder(
    column: $table.servings,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get cookedWeightGrams => $composableBuilder(
    column: $table.cookedWeightGrams,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CustomFoodsTableOrderingComposer
    extends Composer<_$AppDatabase, $CustomFoodsTable> {
  $$CustomFoodsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get kind => $composableBuilder(
    column: $table.kind,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get servingDescription => $composableBuilder(
    column: $table.servingDescription,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get servingGrams => $composableBuilder(
    column: $table.servingGrams,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get kcal => $composableBuilder(
    column: $table.kcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get barcode => $composableBuilder(
    column: $table.barcode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get servings => $composableBuilder(
    column: $table.servings,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get cookedWeightGrams => $composableBuilder(
    column: $table.cookedWeightGrams,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CustomFoodsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CustomFoodsTable> {
  $$CustomFoodsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumnWithTypeConverter<CustomFoodKind, String> get kind =>
      $composableBuilder(column: $table.kind, builder: (column) => column);

  GeneratedColumn<String> get servingDescription => $composableBuilder(
    column: $table.servingDescription,
    builder: (column) => column,
  );

  GeneratedColumn<double> get servingGrams => $composableBuilder(
    column: $table.servingGrams,
    builder: (column) => column,
  );

  GeneratedColumn<double> get kcal =>
      $composableBuilder(column: $table.kcal, builder: (column) => column);

  GeneratedColumn<double> get proteinG =>
      $composableBuilder(column: $table.proteinG, builder: (column) => column);

  GeneratedColumn<double> get carbsG =>
      $composableBuilder(column: $table.carbsG, builder: (column) => column);

  GeneratedColumn<double> get fatG =>
      $composableBuilder(column: $table.fatG, builder: (column) => column);

  GeneratedColumn<String> get barcode =>
      $composableBuilder(column: $table.barcode, builder: (column) => column);

  GeneratedColumn<double> get servings =>
      $composableBuilder(column: $table.servings, builder: (column) => column);

  GeneratedColumn<double> get cookedWeightGrams => $composableBuilder(
    column: $table.cookedWeightGrams,
    builder: (column) => column,
  );
}

class $$CustomFoodsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CustomFoodsTable,
          CustomFoodRow,
          $$CustomFoodsTableFilterComposer,
          $$CustomFoodsTableOrderingComposer,
          $$CustomFoodsTableAnnotationComposer,
          $$CustomFoodsTableCreateCompanionBuilder,
          $$CustomFoodsTableUpdateCompanionBuilder,
          (
            CustomFoodRow,
            BaseReferences<_$AppDatabase, $CustomFoodsTable, CustomFoodRow>,
          ),
          CustomFoodRow,
          PrefetchHooks Function()
        > {
  $$CustomFoodsTableTableManager(_$AppDatabase db, $CustomFoodsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CustomFoodsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CustomFoodsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CustomFoodsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<CustomFoodKind> kind = const Value.absent(),
                Value<String> servingDescription = const Value.absent(),
                Value<double?> servingGrams = const Value.absent(),
                Value<double> kcal = const Value.absent(),
                Value<double> proteinG = const Value.absent(),
                Value<double> carbsG = const Value.absent(),
                Value<double> fatG = const Value.absent(),
                Value<String?> barcode = const Value.absent(),
                Value<double?> servings = const Value.absent(),
                Value<double?> cookedWeightGrams = const Value.absent(),
              }) => CustomFoodsCompanion(
                id: id,
                name: name,
                kind: kind,
                servingDescription: servingDescription,
                servingGrams: servingGrams,
                kcal: kcal,
                proteinG: proteinG,
                carbsG: carbsG,
                fatG: fatG,
                barcode: barcode,
                servings: servings,
                cookedWeightGrams: cookedWeightGrams,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String name,
                required CustomFoodKind kind,
                required String servingDescription,
                Value<double?> servingGrams = const Value.absent(),
                required double kcal,
                required double proteinG,
                required double carbsG,
                required double fatG,
                Value<String?> barcode = const Value.absent(),
                Value<double?> servings = const Value.absent(),
                Value<double?> cookedWeightGrams = const Value.absent(),
              }) => CustomFoodsCompanion.insert(
                id: id,
                name: name,
                kind: kind,
                servingDescription: servingDescription,
                servingGrams: servingGrams,
                kcal: kcal,
                proteinG: proteinG,
                carbsG: carbsG,
                fatG: fatG,
                barcode: barcode,
                servings: servings,
                cookedWeightGrams: cookedWeightGrams,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$CustomFoodsTable, CustomFoodRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $CustomFoodsTable,
                    CustomFoodRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CustomFoodsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CustomFoodsTable,
      CustomFoodRow,
      $$CustomFoodsTableFilterComposer,
      $$CustomFoodsTableOrderingComposer,
      $$CustomFoodsTableAnnotationComposer,
      $$CustomFoodsTableCreateCompanionBuilder,
      $$CustomFoodsTableUpdateCompanionBuilder,
      (
        CustomFoodRow,
        BaseReferences<_$AppDatabase, $CustomFoodsTable, CustomFoodRow>,
      ),
      CustomFoodRow,
      PrefetchHooks Function()
    >;
typedef $$RecipeIngredientsTableCreateCompanionBuilder =
    RecipeIngredientsCompanion Function({
      Value<int> id,
      required int recipeId,
      required int position,
      required String name,
      Value<double?> grams,
      required double kcal,
      required double proteinG,
      required double carbsG,
      required double fatG,
    });
typedef $$RecipeIngredientsTableUpdateCompanionBuilder =
    RecipeIngredientsCompanion Function({
      Value<int> id,
      Value<int> recipeId,
      Value<int> position,
      Value<String> name,
      Value<double?> grams,
      Value<double> kcal,
      Value<double> proteinG,
      Value<double> carbsG,
      Value<double> fatG,
    });

class $$RecipeIngredientsTableFilterComposer
    extends Composer<_$AppDatabase, $RecipeIngredientsTable> {
  $$RecipeIngredientsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get recipeId => $composableBuilder(
    column: $table.recipeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get position => $composableBuilder(
    column: $table.position,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get grams => $composableBuilder(
    column: $table.grams,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get kcal => $composableBuilder(
    column: $table.kcal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnFilters(column),
  );
}

class $$RecipeIngredientsTableOrderingComposer
    extends Composer<_$AppDatabase, $RecipeIngredientsTable> {
  $$RecipeIngredientsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get recipeId => $composableBuilder(
    column: $table.recipeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get position => $composableBuilder(
    column: $table.position,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get grams => $composableBuilder(
    column: $table.grams,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get kcal => $composableBuilder(
    column: $table.kcal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get proteinG => $composableBuilder(
    column: $table.proteinG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get carbsG => $composableBuilder(
    column: $table.carbsG,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get fatG => $composableBuilder(
    column: $table.fatG,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$RecipeIngredientsTableAnnotationComposer
    extends Composer<_$AppDatabase, $RecipeIngredientsTable> {
  $$RecipeIngredientsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get recipeId =>
      $composableBuilder(column: $table.recipeId, builder: (column) => column);

  GeneratedColumn<int> get position =>
      $composableBuilder(column: $table.position, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<double> get grams =>
      $composableBuilder(column: $table.grams, builder: (column) => column);

  GeneratedColumn<double> get kcal =>
      $composableBuilder(column: $table.kcal, builder: (column) => column);

  GeneratedColumn<double> get proteinG =>
      $composableBuilder(column: $table.proteinG, builder: (column) => column);

  GeneratedColumn<double> get carbsG =>
      $composableBuilder(column: $table.carbsG, builder: (column) => column);

  GeneratedColumn<double> get fatG =>
      $composableBuilder(column: $table.fatG, builder: (column) => column);
}

class $$RecipeIngredientsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $RecipeIngredientsTable,
          RecipeIngredientRow,
          $$RecipeIngredientsTableFilterComposer,
          $$RecipeIngredientsTableOrderingComposer,
          $$RecipeIngredientsTableAnnotationComposer,
          $$RecipeIngredientsTableCreateCompanionBuilder,
          $$RecipeIngredientsTableUpdateCompanionBuilder,
          (
            RecipeIngredientRow,
            BaseReferences<
              _$AppDatabase,
              $RecipeIngredientsTable,
              RecipeIngredientRow
            >,
          ),
          RecipeIngredientRow,
          PrefetchHooks Function()
        > {
  $$RecipeIngredientsTableTableManager(
    _$AppDatabase db,
    $RecipeIngredientsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$RecipeIngredientsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$RecipeIngredientsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$RecipeIngredientsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<int> recipeId = const Value.absent(),
                Value<int> position = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<double?> grams = const Value.absent(),
                Value<double> kcal = const Value.absent(),
                Value<double> proteinG = const Value.absent(),
                Value<double> carbsG = const Value.absent(),
                Value<double> fatG = const Value.absent(),
              }) => RecipeIngredientsCompanion(
                id: id,
                recipeId: recipeId,
                position: position,
                name: name,
                grams: grams,
                kcal: kcal,
                proteinG: proteinG,
                carbsG: carbsG,
                fatG: fatG,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required int recipeId,
                required int position,
                required String name,
                Value<double?> grams = const Value.absent(),
                required double kcal,
                required double proteinG,
                required double carbsG,
                required double fatG,
              }) => RecipeIngredientsCompanion.insert(
                id: id,
                recipeId: recipeId,
                position: position,
                name: name,
                grams: grams,
                kcal: kcal,
                proteinG: proteinG,
                carbsG: carbsG,
                fatG: fatG,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$RecipeIngredientsTable, RecipeIngredientRow>(
                    table,
                  ),
                  BaseReferences<
                    _$AppDatabase,
                    $RecipeIngredientsTable,
                    RecipeIngredientRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$RecipeIngredientsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $RecipeIngredientsTable,
      RecipeIngredientRow,
      $$RecipeIngredientsTableFilterComposer,
      $$RecipeIngredientsTableOrderingComposer,
      $$RecipeIngredientsTableAnnotationComposer,
      $$RecipeIngredientsTableCreateCompanionBuilder,
      $$RecipeIngredientsTableUpdateCompanionBuilder,
      (
        RecipeIngredientRow,
        BaseReferences<
          _$AppDatabase,
          $RecipeIngredientsTable,
          RecipeIngredientRow
        >,
      ),
      RecipeIngredientRow,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$SetupsTableTableManager get setups =>
      $$SetupsTableTableManager(_db, _db.setups);
  $$WeightEntriesTableTableManager get weightEntries =>
      $$WeightEntriesTableTableManager(_db, _db.weightEntries);
  $$FoodEntriesTableTableManager get foodEntries =>
      $$FoodEntriesTableTableManager(_db, _db.foodEntries);
  $$DayMarksTableTableManager get dayMarks =>
      $$DayMarksTableTableManager(_db, _db.dayMarks);
  $$WaistEntriesTableTableManager get waistEntries =>
      $$WaistEntriesTableTableManager(_db, _db.waistEntries);
  $$TargetsHistoryTableTableManager get targetsHistory =>
      $$TargetsHistoryTableTableManager(_db, _db.targetsHistory);
  $$UserPreferencesTableTableManager get userPreferences =>
      $$UserPreferencesTableTableManager(_db, _db.userPreferences);
  $$WeightEventsTableTableManager get weightEvents =>
      $$WeightEventsTableTableManager(_db, _db.weightEvents);
  $$CustomFoodsTableTableManager get customFoods =>
      $$CustomFoodsTableTableManager(_db, _db.customFoods);
  $$RecipeIngredientsTableTableManager get recipeIngredients =>
      $$RecipeIngredientsTableTableManager(_db, _db.recipeIngredients);
}
