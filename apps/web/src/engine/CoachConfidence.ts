import { ArgumentError } from '../lang/ArgumentError';
import { byName } from '../lang/byName';
import { ConfidenceLevel } from './ConfidenceLevel';
import { ConfidenceNextStep } from './ConfidenceNextStep';

interface CoachConfidenceInit {
  level: ConfidenceLevel;
  estimate: ConfidenceLevel;
  foodLog: ConfidenceLevel;
  weighIns: ConfidenceLevel;
  stability: ConfidenceLevel;
  nextStep: ConfidenceNextStep;
  usableFoodDays: number;
  weighInDays: number;
}

function wholeNumber(value: unknown, name: string): number {
  if (typeof value !== 'number') throw new ArgumentError(`${name} is not a number: ${String(value)}`);
  return Math.trunc(value);
}

/** How reliable the current coaching estimate is and what would improve it. */
export class CoachConfidence {
  readonly level: ConfidenceLevel;
  readonly estimate: ConfidenceLevel;
  readonly foodLog: ConfidenceLevel;
  readonly weighIns: ConfidenceLevel;
  readonly stability: ConfidenceLevel;
  readonly nextStep: ConfidenceNextStep;
  readonly usableFoodDays: number;
  readonly weighInDays: number;

  constructor(init: CoachConfidenceInit) {
    this.level = init.level;
    this.estimate = init.estimate;
    this.foodLog = init.foodLog;
    this.weighIns = init.weighIns;
    this.stability = init.stability;
    this.nextStep = init.nextStep;
    this.usableFoodDays = init.usableFoodDays;
    this.weighInDays = init.weighInDays;
  }

  toJson(): Record<string, unknown> {
    return {
      level: this.level,
      estimate: this.estimate,
      foodLog: this.foodLog,
      weighIns: this.weighIns,
      stability: this.stability,
      nextStep: this.nextStep,
      usableFoodDays: this.usableFoodDays,
      weighInDays: this.weighInDays,
    };
  }

  static fromJson(json: Record<string, unknown>): CoachConfidence {
    return new CoachConfidence({
      level: byName(ConfidenceLevel.values, json['level']),
      estimate: byName(ConfidenceLevel.values, json['estimate']),
      foodLog: byName(ConfidenceLevel.values, json['foodLog']),
      weighIns: byName(ConfidenceLevel.values, json['weighIns']),
      stability: byName(ConfidenceLevel.values, json['stability']),
      nextStep: byName(ConfidenceNextStep.values, json['nextStep']),
      usableFoodDays: wholeNumber(json['usableFoodDays'], 'usableFoodDays'),
      weighInDays: wholeNumber(json['weighInDays'], 'weighInDays'),
    });
  }
}
