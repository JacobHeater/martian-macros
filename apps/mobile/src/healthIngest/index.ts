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
export * from './DayWeighIn';
export * from './HealthChanges';
export * from './HealthDataType';
export * from './HealthImporter';
export * from './HealthImportResult';
export * from './HealthImportStatus';
export * from './HealthReadFailure';
export * from './HealthSample';
export * from './HealthSampleStore';
export * from './HealthSource';
export * from './NutritionRecord';
export * from './primaryWeightSource';
export * from './sameHealthSample';
export * from './testing/FakeHealthSource';
export * from './testing/InMemoryHealthSampleStore';
export * from './testing/recordedHealthHistory';
export * from './WeighInBasis';
