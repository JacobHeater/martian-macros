/**
 * The trend engine (MM-605): daily series in, findings and transitions
 * out. Pure: no clock and no storage. The detectors and their statistics
 * are imported from their own files; this is what the signals use.
 */
export * from './FindingDismissal';
export * from './TrendAnnouncement';
export * from './TrendAspect';
export * from './TrendBoundary';
export * from './TrendBoundaryCause';
export * from './TrendDay';
export * from './TrendDetector';
export * from './TrendDirection';
export * from './TrendEvaluation';
export * from './TrendFigures';
export * from './TrendFinding';
export * from './TrendPoint';
export * from './TrendIneligibleReason';
export * from './TrendLogReader';
export * from './TrendLogRepository';
export * from './TrendLogWriter';
export * from './TrendReading';
export * from './TrendReadingStatus';
export * from './TrendRule';
export * from './TrendSignal';
export * from './TrendSpan';
export * from './TrendStep';
export * from './TrendTier';
export * from './TrendTransition';
export * from './TrendTransitionInput';
export * from './binomialCriticalCount';
export * from './dedupeTrendFindings';
export * from './evaluateSignal';
export * from './nextTrendTransition';
export * from './rankTrendFindings';
export * from './robustSigma';
export * from './trendKeyOf';
