import { describe, expect, it } from 'vitest';
import {
  type BiologicalSex,
  CalendarDate,
  CoachingPolicy,
  Profile,
  ScreeningAnswers,
  type TrainingStatus,
} from '../../src/domain';
import {
  BodyFatEstimate,
  cycleNoiseMultiplier,
  deurenbergBodyFat,
  energyDensityKcalPerKg,
  fatFreeMassKcalPerKg,
  fatMassKcalPerKg,
  katchMcArdleKcal,
  leanFractionOfChange,
  mifflinStJeorKcal,
  recommendMode,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';

describe('energy expenditure', () => {
  it('Mifflin-St Jeor matches hand calculation for both sexes', () => {
    // 10*80 + 6.25*180 - 5*30 = 1775
    expect(mifflinStJeorKcal({ sex: 'male', weightKg: 80, heightCm: 180, ageYears: 30 })).toBe(1780);
    expect(mifflinStJeorKcal({ sex: 'female', weightKg: 80, heightCm: 180, ageYears: 30 })).toBe(1614);
  });

  it('Katch-McArdle', () => {
    expectClose(katchMcArdleKcal({ fatFreeMassKg: 60 }), 1666, 1e-9);
  });
});

describe('partition', () => {
  it('Forbes lean fraction falls as fat mass rises', () => {
    const lean = leanFractionOfChange({ fatMassKg: 10, losing: true, resistanceTrained: false });
    const fat = leanFractionOfChange({ fatMassKg: 40, losing: true, resistanceTrained: false });
    expectClose(lean, 10.4 / 20.4, 1e-9);
    expect(fat).toBeLessThan(lean);
  });

  it('training halves lean loss in a deficit but not in a surplus', () => {
    const p = (losing: boolean) => leanFractionOfChange({ fatMassKg: 20, losing, resistanceTrained: true });
    expectClose(p(true), (0.5 * 10.4) / 30.4, 1e-9);
    expectClose(p(false), 10.4 / 30.4, 1e-9);
  });

  it('energy density spans lean-only to fat-only', () => {
    expect(energyDensityKcalPerKg(0)).toBe(fatMassKcalPerKg);
    expect(energyDensityKcalPerKg(1)).toBe(fatFreeMassKcalPerKg);
  });
});

describe('body composition', () => {
  it('Deurenberg estimate is sex-specific', () => {
    const bf = (sex: BiologicalSex) => deurenbergBodyFat({ sex, weightKg: 80, heightCm: 180, ageYears: 30 }).percent;
    expectClose(bf('female') - bf('male'), 10.8, 1e-9);
  });

  it('fat-free mass upper bound uses the lower body-fat bound', () => {
    const estimate = new BodyFatEstimate({ percent: 20, sigmaPercent: 2 });
    expect(estimate.lowerPercent).toBe(16);
    expectClose(estimate.fatFreeMassUpperKg(100), 84, 1e-9);
  });
});

describe('cycle noise', () => {
  it('widens noise around each menses start only', () => {
    const start = CalendarDate.of(2026, 3, 10);
    const noise = cycleNoiseMultiplier([0, 1, 2, 3, 4].map((i) => ({ date: start.addDays(i) })));
    expect(noise(start.addDays(-6))).toBe(1.0);
    expect(noise(start.addDays(-5))).toBe(1.6);
    expect(noise(start.addDays(2))).toBe(1.6);
    expect(noise(start.addDays(3))).toBe(1.0);
  });

  it('is neutral without data', () => {
    expect(cycleNoiseMultiplier([])(CalendarDate.of(2026, 1, 1))).toBe(1.0);
  });
});

describe('mode advisor', () => {
  const policy = CoachingPolicy.derive({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 180 }),
    screening: new ScreeningAnswers(),
    today: CalendarDate.of(2026, 10, 5),
  });

  const mode = (bf: number, status: TrainingStatus) =>
    recommendMode({ sex: 'male', bodyFatPercent: bf, trainingStatus: status, policy }).mode;

  it('recommends recomp for novices and returning lifters', () => {
    expect(mode(18, 'novice')).toBe('recomp');
    expect(mode(18, 'returning')).toBe('recomp');
  });

  it('recommends a cut at very high body fat, even for novices', () => {
    expect(mode(28, 'novice')).toBe('fatLoss');
  });

  it('lean trained lifters gain; moderate trained lifters cut', () => {
    expect(mode(12, 'intermediate')).toBe('leanGain');
    expect(mode(17, 'intermediate')).toBe('fatLoss');
  });

  it('uses female thresholds for female users', () => {
    const femalePolicy = CoachingPolicy.derive({
      profile: new Profile({ sex: 'female', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 165 }),
      screening: new ScreeningAnswers(),
      today: CalendarDate.of(2026, 10, 5),
    });
    const rec = (bf: number) =>
      recommendMode({ sex: 'female', bodyFatPercent: bf, trainingStatus: 'intermediate', policy: femalePolicy });
    expect(rec(22).mode).toBe('leanGain');
    expect(rec(31).mode).toBe('recomp');
  });
});
