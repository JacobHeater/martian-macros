/**
 * The seam to a phone's health platform (MM-67): Health Connect, HealthKit,
 * or a fake. Everything above it depends on `HealthSource` and never on a
 * platform, so it can be built and tested on any machine.
 *
 * `testing/` holds stand-ins for a platform and its store, for tests and
 * demos; never the user's real data.
 */
export * from './byStartThenId';
export * from './dailyWeighIns';
export * from './DaySteps';
export * from './DayWeighIn';
export * from './HealthBackfill';
export * from './HealthBackfillMarks';
export * from './HealthBackfillResult';
export * from './HealthBackfillStatus';
export * from './HealthChanges';
export * from './HealthDailySteps';
export * from './HealthDataType';
export * from './HealthHistoryAccess';
export * from './HealthImporter';
export * from './HealthImportResult';
export * from './HealthImportStatus';
export * from './HealthIntakeWriter';
export * from './HealthReadFailure';
export * from './HealthSample';
export * from './HealthSampleStore';
export * from './HealthSource';
export * from './HealthSyncReason';
export * from './HealthSyncSchedule';
export * from './HealthWriteKind';
export * from './HealthWriteNamespace';
export * from './HealthWriting';
export * from './NightOfSleep';
export * from './localMidnight';
export * from './nightlySleep';
export * from './NutritionRecord';
export * from './primaryWeightSource';
export * from './sameHealthSample';
export * from './testing/FakeHealthSource';
export * from './testing/InMemoryHealthSampleStore';
export * from './testing/recordedHealthHistory';
export * from './WaterRecord';
export * from './WeighInBasis';
export * from './WeighInWindow';
export * from './WeighInWindowReader';
export * from './WeighInWindowWriter';
