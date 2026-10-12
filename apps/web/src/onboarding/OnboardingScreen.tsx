import { useState } from 'react';
import type { BiologicalSex } from '../domain/BiologicalSex';
import { CalendarDate } from '../domain/CalendarDate';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import type { DailyActivity } from '../domain/DailyActivity';
import type { GoalMode } from '../domain/GoalMode';
import { Profile } from '../domain/Profile';
import { ScreeningAnswers } from '../domain/ScreeningAnswers';
import type { TrainingStatus } from '../domain/TrainingStatus';
import { Units } from '../domain/Units';
import type { UnitSystem } from '../domain/UnitSystem';
import { UserSetup } from '../domain/UserSetup';
import { BodyFatEstimate } from '../engine/BodyFatEstimate';
import { deurenbergBodyFat } from '../engine/deurenbergBodyFat';
import { recommendMode } from '../engine/recommendMode';
import { Fmt } from '../format/Fmt';
import { parseNumber } from '../format/parseNumber';
import { useApp } from '../app/useApp';
import { MmButton } from '../ui/MmButton';
import { StepProgress } from '../ui/StepProgress';
import { useOverlays } from '../ui/useOverlays';
import { ActivityStep } from './ActivityStep';
import { BirthDateStep } from './BirthDateStep';
import { GoalStep } from './GoalStep';
import { HealthStep } from './HealthStep';
import { MeasurementsStep, type MeasurementsTyped } from './MeasurementsStep';
import { SexStep } from './SexStep';
import { TrainingStep } from './TrainingStep';
import { WelcomeStep } from './WelcomeStep';
import './onboarding.css';

const stepCount = 7;
const nothingTyped: MeasurementsTyped = { feet: '', inches: '', cm: '', weight: '' };

/**
 * Collects everything the engine needs before it can coach. Biological sex
 * has no default and nothing proceeds without it.
 */
export function OnboardingScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = state.today.peek();

  const [welcomed, setWelcomed] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sex, setSex] = useState<BiologicalSex>();
  const [birthDate, setBirthDate] = useState<CalendarDate>();
  const [units, setUnits] = useState<UnitSystem>('imperial');
  const [typed, setTyped] = useState(nothingTyped);
  const [status, setStatus] = useState<TrainingStatus>('novice');
  const [trainingDays, setTrainingDays] = useState(3);
  const [activity, setActivity] = useState<DailyActivity>('light');
  const [bodyFat, setBodyFat] = useState<number>();
  const [creatineStartedOn, setCreatineStartedOn] = useState<CalendarDate>();
  const [screening, setScreening] = useState(new ScreeningAnswers());
  const [mode, setMode] = useState<GoalMode>();

  // The numbers the typed measurements mean, in what is stored.
  const fmt = new Fmt(units);
  let heightCm: number | undefined;
  if (fmt.imperial) {
    const feet = parseNumber(typed.feet);
    heightCm = feet === undefined ? undefined : Units.inchesToCm(feet * 12 + (parseNumber(typed.inches) ?? 0));
  } else {
    heightCm = parseNumber(typed.cm);
  }
  const typedWeight = parseNumber(typed.weight);
  const weightKg = typedWeight === undefined ? undefined : fmt.weightToKg(typedWeight);

  const profile =
    sex === undefined || birthDate === undefined || heightCm === undefined || heightCm < 100 || heightCm > 250
      ? undefined
      : new Profile({ sex, birthDate, heightCm });

  // Height is irrelevant to age; a placeholder reuses the rule.
  const isMinor =
    birthDate !== undefined && !new Profile({ sex: sex ?? 'male', birthDate, heightCm: 170 }).isAdultOn(today);

  const policy = profile === undefined ? undefined : CoachingPolicy.derive({ profile, screening, today, weightKg });

  let bodyFatEstimate: BodyFatEstimate | undefined;
  if (profile !== undefined && weightKg !== undefined) {
    bodyFatEstimate =
      bodyFat !== undefined
        ? new BodyFatEstimate({ percent: bodyFat, sigmaPercent: 4 })
        : deurenbergBodyFat({ sex: profile.sex, weightKg, heightCm: profile.heightCm, ageYears: profile.ageOn(today) });
  }

  const recommendation =
    policy === undefined || bodyFatEstimate === undefined || sex === undefined
      ? undefined
      : recommendMode({ sex, bodyFatPercent: bodyFatEstimate.percent, trainingStatus: status, policy });

  let canContinue = true;
  if (step === 0) canContinue = sex !== undefined;
  else if (step === 1) canContinue = birthDate !== undefined && !isMinor;
  else if (step === 2) canContinue = profile !== undefined && weightKg !== undefined && weightKg >= 30 && weightKg <= 350;
  else if (step === 6) canContinue = policy !== undefined && recommendation !== undefined;

  const pickBirthDate = async () => {
    const now = services.clock.now();
    const picked = await overlays.date({
      helpText: 'Date of birth',
      initial: CalendarDate.of(now.getFullYear() - 30, 1, 1),
      first: CalendarDate.of(now.getFullYear() - 100, 1, 1),
      last: CalendarDate.fromDate(now),
    });
    if (picked !== undefined) setBirthDate(picked);
  };

  const pickCreatineStartDate = async () => {
    const picked = await overlays.date({
      helpText: 'Creatine start date',
      initial: creatineStartedOn ?? today,
      first: CalendarDate.of(today.year - 100, today.month, today.day),
      last: today,
    });
    if (picked !== undefined) setCreatineStartedOn(picked);
  };

  const finish = async () => {
    if (profile === undefined || policy === undefined || recommendation === undefined || weightKg === undefined) return;
    const chosen = mode ?? recommendation.mode;
    setSaving(true);
    await services.weights.saveWeight(today, weightKg);
    await services.setup.saveSetup(
      new UserSetup({
        profile,
        screening,
        trainingStatus: status,
        trainingDaysPerWeek: trainingDays,
        dailyActivity: activity,
        goalMode: policy.allowedModes.has(chosen) ? chosen : recommendation.mode,
        onboardedOn: today,
        healthCheckConfirmedOn: today,
        unitSystem: units,
        bodyFatPercent: bodyFat,
        creatineStartedOn,
      }),
    );
  };

  if (!welcomed) {
    return (
      <div className="app-frame">
        <WelcomeStep onStart={() => setWelcomed(true)} />
      </div>
    );
  }

  const clearFemaleOnlyAnswers = () => {
    setScreening(
      new ScreeningAnswers({
        eatingDisorderHistory: screening.eatingDisorderHistory,
        chronicKidneyDisease: screening.chronicKidneyDisease,
        androgenUse: screening.androgenUse,
        thyroidCondition: screening.thyroidCondition,
        insulinOrSulfonylurea: screening.insulinOrSulfonylurea,
        insulinCareTeamConfirmed: screening.insulinCareTeamConfirmed,
        bariatricSurgery: screening.bariatricSurgery,
        weightAffectingMedication: screening.weightAffectingMedication,
      }),
    );
  };

  let body;
  if (step === 0) {
    body = (
      <SexStep
        sex={sex}
        onSex={(chosen) => {
          setSex(chosen);
          if (chosen === 'male') clearFemaleOnlyAnswers();
        }}
      />
    );
  } else if (step === 1) {
    body = <BirthDateStep birthDate={birthDate} isMinor={isMinor} onPickBirthDate={() => void pickBirthDate()} />;
  } else if (step === 2) {
    body = (
      <MeasurementsStep
        units={units}
        typed={typed}
        onUnits={(chosen) => {
          setUnits(chosen);
          setTyped(nothingTyped);
        }}
        onTyped={setTyped}
      />
    );
  } else if (step === 3) {
    body = <ActivityStep activity={activity} onActivity={setActivity} />;
  } else if (step === 4) {
    body = (
      <TrainingStep
        status={status}
        trainingDays={trainingDays}
        bodyFat={bodyFat}
        creatineStartedOn={creatineStartedOn}
        onCreatine={(on) => setCreatineStartedOn(on ? (creatineStartedOn ?? today) : undefined)}
        onPickCreatineStartDate={() => void pickCreatineStartDate()}
        onStatus={setStatus}
        onTrainingDays={setTrainingDays}
        onBodyFatKnown={(known) => setBodyFat(known ? (bodyFatEstimate?.percent ?? 25) : undefined)}
        onBodyFat={setBodyFat}
      />
    );
  } else if (step === 5) {
    body = <HealthStep screening={screening} female={sex === 'female'} onChange={setScreening} />;
  } else if (policy !== undefined && recommendation !== undefined) {
    body = (
      <GoalStep policy={policy} recommendation={recommendation} selected={mode ?? recommendation.mode} onMode={setMode} />
    );
  }

  const last = step === stepCount - 1;
  return (
    <div className="app-frame">
      <div className="onboarding-progress">
        <StepProgress current={step} count={stepCount} />
      </div>
      <main className="app-body app-body-roomy">{body}</main>
      <div className="onboarding-actions">
        {step > 0 ? <MmButton label="Back" kind="text" onPress={saving ? undefined : () => setStep(step - 1)} /> : null}
        <span className="onboarding-spacer" />
        <MmButton
          label={last ? 'Start' : 'Next'}
          onPress={!canContinue || saving ? undefined : last ? () => void finish() : () => setStep(step + 1)}
        />
      </div>
    </div>
  );
}
