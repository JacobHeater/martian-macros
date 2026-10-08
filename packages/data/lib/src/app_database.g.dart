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
          ..write('thyroidCondition: $thyroidCondition')
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
          other.thyroidCondition == this.thyroidCondition);
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
          ..write('thyroidCondition: $thyroidCondition')
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
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    epochDay,
    meal,
    name,
    kcal,
    proteinG,
    carbsG,
    fatG,
    quantitySource,
    createdAt,
  );
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
    fatG,
    carbsG,
    weeklyRateFraction,
    flags,
    tdeeKcal,
    tdeeSigmaKcal,
    explanation,
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
    required this.fatG,
    required this.carbsG,
    required this.weeklyRateFraction,
    required this.flags,
    required this.tdeeKcal,
    required this.tdeeSigmaKcal,
    this.explanation,
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
    map['fat_g'] = Variable<double>(fatG);
    map['carbs_g'] = Variable<double>(carbsG);
    map['weekly_rate_fraction'] = Variable<double>(weeklyRateFraction);
    map['flags'] = Variable<String>(flags);
    map['tdee_kcal'] = Variable<double>(tdeeKcal);
    map['tdee_sigma_kcal'] = Variable<double>(tdeeSigmaKcal);
    if (!nullToAbsent || explanation != null) {
      map['explanation'] = Variable<String>(explanation);
    }
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
      fatG: Value(fatG),
      carbsG: Value(carbsG),
      weeklyRateFraction: Value(weeklyRateFraction),
      flags: Value(flags),
      tdeeKcal: Value(tdeeKcal),
      tdeeSigmaKcal: Value(tdeeSigmaKcal),
      explanation: explanation == null && nullToAbsent
          ? const Value.absent()
          : Value(explanation),
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
      fatG: serializer.fromJson<double>(json['fatG']),
      carbsG: serializer.fromJson<double>(json['carbsG']),
      weeklyRateFraction: serializer.fromJson<double>(
        json['weeklyRateFraction'],
      ),
      flags: serializer.fromJson<String>(json['flags']),
      tdeeKcal: serializer.fromJson<double>(json['tdeeKcal']),
      tdeeSigmaKcal: serializer.fromJson<double>(json['tdeeSigmaKcal']),
      explanation: serializer.fromJson<String?>(json['explanation']),
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
      'fatG': serializer.toJson<double>(fatG),
      'carbsG': serializer.toJson<double>(carbsG),
      'weeklyRateFraction': serializer.toJson<double>(weeklyRateFraction),
      'flags': serializer.toJson<String>(flags),
      'tdeeKcal': serializer.toJson<double>(tdeeKcal),
      'tdeeSigmaKcal': serializer.toJson<double>(tdeeSigmaKcal),
      'explanation': serializer.toJson<String?>(explanation),
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
    double? fatG,
    double? carbsG,
    double? weeklyRateFraction,
    String? flags,
    double? tdeeKcal,
    double? tdeeSigmaKcal,
    Value<String?> explanation = const Value.absent(),
    int? profileRevision,
    Value<double?> safetyBodyFatPercent = const Value.absent(),
    TdeeStatus? tdeeStatus,
  }) => TargetsRow(
    effectiveEpochDay: effectiveEpochDay ?? this.effectiveEpochDay,
    mode: mode ?? this.mode,
    kcal: kcal ?? this.kcal,
    proteinG: proteinG ?? this.proteinG,
    fatG: fatG ?? this.fatG,
    carbsG: carbsG ?? this.carbsG,
    weeklyRateFraction: weeklyRateFraction ?? this.weeklyRateFraction,
    flags: flags ?? this.flags,
    tdeeKcal: tdeeKcal ?? this.tdeeKcal,
    tdeeSigmaKcal: tdeeSigmaKcal ?? this.tdeeSigmaKcal,
    explanation: explanation.present ? explanation.value : this.explanation,
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
          ..write('fatG: $fatG, ')
          ..write('carbsG: $carbsG, ')
          ..write('weeklyRateFraction: $weeklyRateFraction, ')
          ..write('flags: $flags, ')
          ..write('tdeeKcal: $tdeeKcal, ')
          ..write('tdeeSigmaKcal: $tdeeSigmaKcal, ')
          ..write('explanation: $explanation, ')
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
    fatG,
    carbsG,
    weeklyRateFraction,
    flags,
    tdeeKcal,
    tdeeSigmaKcal,
    explanation,
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
          other.fatG == this.fatG &&
          other.carbsG == this.carbsG &&
          other.weeklyRateFraction == this.weeklyRateFraction &&
          other.flags == this.flags &&
          other.tdeeKcal == this.tdeeKcal &&
          other.tdeeSigmaKcal == this.tdeeSigmaKcal &&
          other.explanation == this.explanation &&
          other.profileRevision == this.profileRevision &&
          other.safetyBodyFatPercent == this.safetyBodyFatPercent &&
          other.tdeeStatus == this.tdeeStatus);
}

class TargetsHistoryCompanion extends UpdateCompanion<TargetsRow> {
  final Value<int> effectiveEpochDay;
  final Value<GoalMode> mode;
  final Value<double> kcal;
  final Value<double> proteinG;
  final Value<double> fatG;
  final Value<double> carbsG;
  final Value<double> weeklyRateFraction;
  final Value<String> flags;
  final Value<double> tdeeKcal;
  final Value<double> tdeeSigmaKcal;
  final Value<String?> explanation;
  final Value<int> profileRevision;
  final Value<double?> safetyBodyFatPercent;
  final Value<TdeeStatus> tdeeStatus;
  const TargetsHistoryCompanion({
    this.effectiveEpochDay = const Value.absent(),
    this.mode = const Value.absent(),
    this.kcal = const Value.absent(),
    this.proteinG = const Value.absent(),
    this.fatG = const Value.absent(),
    this.carbsG = const Value.absent(),
    this.weeklyRateFraction = const Value.absent(),
    this.flags = const Value.absent(),
    this.tdeeKcal = const Value.absent(),
    this.tdeeSigmaKcal = const Value.absent(),
    this.explanation = const Value.absent(),
    this.profileRevision = const Value.absent(),
    this.safetyBodyFatPercent = const Value.absent(),
    this.tdeeStatus = const Value.absent(),
  });
  TargetsHistoryCompanion.insert({
    this.effectiveEpochDay = const Value.absent(),
    required GoalMode mode,
    required double kcal,
    required double proteinG,
    required double fatG,
    required double carbsG,
    required double weeklyRateFraction,
    this.flags = const Value.absent(),
    required double tdeeKcal,
    required double tdeeSigmaKcal,
    this.explanation = const Value.absent(),
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
    Expression<double>? fatG,
    Expression<double>? carbsG,
    Expression<double>? weeklyRateFraction,
    Expression<String>? flags,
    Expression<double>? tdeeKcal,
    Expression<double>? tdeeSigmaKcal,
    Expression<String>? explanation,
    Expression<int>? profileRevision,
    Expression<double>? safetyBodyFatPercent,
    Expression<String>? tdeeStatus,
  }) {
    return RawValuesInsertable({
      if (effectiveEpochDay != null) 'effective_epoch_day': effectiveEpochDay,
      if (mode != null) 'mode': mode,
      if (kcal != null) 'kcal': kcal,
      if (proteinG != null) 'protein_g': proteinG,
      if (fatG != null) 'fat_g': fatG,
      if (carbsG != null) 'carbs_g': carbsG,
      if (weeklyRateFraction != null)
        'weekly_rate_fraction': weeklyRateFraction,
      if (flags != null) 'flags': flags,
      if (tdeeKcal != null) 'tdee_kcal': tdeeKcal,
      if (tdeeSigmaKcal != null) 'tdee_sigma_kcal': tdeeSigmaKcal,
      if (explanation != null) 'explanation': explanation,
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
    Value<double>? fatG,
    Value<double>? carbsG,
    Value<double>? weeklyRateFraction,
    Value<String>? flags,
    Value<double>? tdeeKcal,
    Value<double>? tdeeSigmaKcal,
    Value<String?>? explanation,
    Value<int>? profileRevision,
    Value<double?>? safetyBodyFatPercent,
    Value<TdeeStatus>? tdeeStatus,
  }) {
    return TargetsHistoryCompanion(
      effectiveEpochDay: effectiveEpochDay ?? this.effectiveEpochDay,
      mode: mode ?? this.mode,
      kcal: kcal ?? this.kcal,
      proteinG: proteinG ?? this.proteinG,
      fatG: fatG ?? this.fatG,
      carbsG: carbsG ?? this.carbsG,
      weeklyRateFraction: weeklyRateFraction ?? this.weeklyRateFraction,
      flags: flags ?? this.flags,
      tdeeKcal: tdeeKcal ?? this.tdeeKcal,
      tdeeSigmaKcal: tdeeSigmaKcal ?? this.tdeeSigmaKcal,
      explanation: explanation ?? this.explanation,
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
          ..write('fatG: $fatG, ')
          ..write('carbsG: $carbsG, ')
          ..write('weeklyRateFraction: $weeklyRateFraction, ')
          ..write('flags: $flags, ')
          ..write('tdeeKcal: $tdeeKcal, ')
          ..write('tdeeSigmaKcal: $tdeeSigmaKcal, ')
          ..write('explanation: $explanation, ')
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
  @override
  List<GeneratedColumn> get $columns => [id, themePreference];
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
  const PreferencesRow({required this.id, required this.themePreference});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    {
      map['theme_preference'] = Variable<String>(
        $UserPreferencesTable.$converterthemePreference.toSql(themePreference),
      );
    }
    return map;
  }

  UserPreferencesCompanion toCompanion(bool nullToAbsent) {
    return UserPreferencesCompanion(
      id: Value(id),
      themePreference: Value(themePreference),
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
    };
  }

  PreferencesRow copyWith({int? id, ThemePreference? themePreference}) =>
      PreferencesRow(
        id: id ?? this.id,
        themePreference: themePreference ?? this.themePreference,
      );
  PreferencesRow copyWithCompanion(UserPreferencesCompanion data) {
    return PreferencesRow(
      id: data.id.present ? data.id.value : this.id,
      themePreference: data.themePreference.present
          ? data.themePreference.value
          : this.themePreference,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PreferencesRow(')
          ..write('id: $id, ')
          ..write('themePreference: $themePreference')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, themePreference);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is PreferencesRow &&
          other.id == this.id &&
          other.themePreference == this.themePreference);
}

class UserPreferencesCompanion extends UpdateCompanion<PreferencesRow> {
  final Value<int> id;
  final Value<ThemePreference> themePreference;
  const UserPreferencesCompanion({
    this.id = const Value.absent(),
    this.themePreference = const Value.absent(),
  });
  UserPreferencesCompanion.insert({
    this.id = const Value.absent(),
    this.themePreference = const Value.absent(),
  });
  static Insertable<PreferencesRow> custom({
    Expression<int>? id,
    Expression<String>? themePreference,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (themePreference != null) 'theme_preference': themePreference,
    });
  }

  UserPreferencesCompanion copyWith({
    Value<int>? id,
    Value<ThemePreference>? themePreference,
  }) {
    return UserPreferencesCompanion(
      id: id ?? this.id,
      themePreference: themePreference ?? this.themePreference,
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
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UserPreferencesCompanion(')
          ..write('id: $id, ')
          ..write('themePreference: $themePreference')
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
      required double fatG,
      required double carbsG,
      required double weeklyRateFraction,
      Value<String> flags,
      required double tdeeKcal,
      required double tdeeSigmaKcal,
      Value<String?> explanation,
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
      Value<double> fatG,
      Value<double> carbsG,
      Value<double> weeklyRateFraction,
      Value<String> flags,
      Value<double> tdeeKcal,
      Value<double> tdeeSigmaKcal,
      Value<String?> explanation,
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
                Value<double> fatG = const Value.absent(),
                Value<double> carbsG = const Value.absent(),
                Value<double> weeklyRateFraction = const Value.absent(),
                Value<String> flags = const Value.absent(),
                Value<double> tdeeKcal = const Value.absent(),
                Value<double> tdeeSigmaKcal = const Value.absent(),
                Value<String?> explanation = const Value.absent(),
                Value<int> profileRevision = const Value.absent(),
                Value<double?> safetyBodyFatPercent = const Value.absent(),
                Value<TdeeStatus> tdeeStatus = const Value.absent(),
              }) => TargetsHistoryCompanion(
                effectiveEpochDay: effectiveEpochDay,
                mode: mode,
                kcal: kcal,
                proteinG: proteinG,
                fatG: fatG,
                carbsG: carbsG,
                weeklyRateFraction: weeklyRateFraction,
                flags: flags,
                tdeeKcal: tdeeKcal,
                tdeeSigmaKcal: tdeeSigmaKcal,
                explanation: explanation,
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
                required double fatG,
                required double carbsG,
                required double weeklyRateFraction,
                Value<String> flags = const Value.absent(),
                required double tdeeKcal,
                required double tdeeSigmaKcal,
                Value<String?> explanation = const Value.absent(),
                Value<int> profileRevision = const Value.absent(),
                Value<double?> safetyBodyFatPercent = const Value.absent(),
                required TdeeStatus tdeeStatus,
              }) => TargetsHistoryCompanion.insert(
                effectiveEpochDay: effectiveEpochDay,
                mode: mode,
                kcal: kcal,
                proteinG: proteinG,
                fatG: fatG,
                carbsG: carbsG,
                weeklyRateFraction: weeklyRateFraction,
                flags: flags,
                tdeeKcal: tdeeKcal,
                tdeeSigmaKcal: tdeeSigmaKcal,
                explanation: explanation,
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
    });
typedef $$UserPreferencesTableUpdateCompanionBuilder =
    UserPreferencesCompanion Function({
      Value<int> id,
      Value<ThemePreference> themePreference,
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
              }) => UserPreferencesCompanion(
                id: id,
                themePreference: themePreference,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<ThemePreference> themePreference = const Value.absent(),
              }) => UserPreferencesCompanion.insert(
                id: id,
                themePreference: themePreference,
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
}
