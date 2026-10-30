import { useState } from 'react';
import type { BiologicalSex } from '../domain/BiologicalSex';
import { CalendarDate } from '../domain/CalendarDate';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import type { HealthProfile } from '../domain/integration/HealthProfile';
import type { DailyActivity } from '../domain/DailyActivity';
import type { GoalMode } from '../domain/GoalMode';
import { Profile } from '../domain/Profile';
import { ScreeningAnswers } from '../domain/ScreeningAnswers';
import type { TrainingStatus } from '../domain/TrainingStatus';
import { Units } from '../domain/Units';
import type { UnitSystem } from '../domain/UnitSystem';
import { UserSetup } from '../domain/UserSetup';
import { BodyFatEstimate } from '../engine/BodyFatEstimate';
import { describePaces } from '../engine/describePaces';
import { deurenbergBodyFat } from '../engine/deurenbergBodyFat';
import type { FatLossPace } from '../engine/FatLossPace';
import { FatLossPace as Paces } from '../engine/FatLossPace';
import { initialTdeePrior } from '../engine/initialTdeePrior';
import { mifflinStJeorKcal } from '../engine/mifflinStJeorKcal';
import { TargetInputs } from '../engine/TargetInputs';
import { recommendMode } from '../engine/recommendMode';
import { Fmt } from '../format/Fmt';
import { trainsNotYet } from '../format/trainsNotYet';
import { parseNumber } from '../format/parseNumber';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { healthPlatformName } from '../format/healthPlatformName';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import type { HealthDataType } from '../healthIngest/HealthDataType';
import { MartianRidge } from '../ui/MartianRidge';
import { MmButton } from '../ui/MmButton';
import { StepProgress } from '../ui/StepProgress';
import { useOverlays } from '../ui/useOverlays';
import { ActivityStep } from './ActivityStep';
import { BirthDateStep } from './BirthDateStep';
import { GoalStep } from './GoalStep';
import type { HealthFillState } from './HealthFillState';
import { heightTyped } from './heightTyped';
import { HealthStep } from './HealthStep';
import { MeasurementsStep } from './MeasurementsStep';
import type { MeasurementsTyped } from './MeasurementsTyped';
import type { WeightFromHealth } from './WeightFromHealth';
import { SexStep } from './SexStep';
import { TrainingStep } from './TrainingStep';
import { WelcomeStep } from './WelcomeStep';
import { useMoveToAnotherPhone } from '../settings/useMoveToAnotherPhone';
import { WhatToExpectStep } from './WhatToExpectStep';
import { whatToExpectPoints } from '../format/whatToExpectPoints';
import { ReminderRule } from '../engine/ReminderRule';
import { ReminderSetting } from '../domain/ReminderSetting';
import { reminderCountFrom } from '../engine/reminderCountFrom';
import { minuteOfDayNow } from '../state/minuteOfDayNow';
import './onboarding.css';

const stepCount = 8;
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
  // A fresh install holds nothing a backup could keep, so the move asks for none (MM-698).
  const move = useMoveToAnotherPhone();
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
  const [pace, setPace] = useState<FatLossPace>();
  const [gainAcknowledged, setGainAcknowledged] = useState(false);
  const [remind, setRemind] = useState(false);
  // The health platform's offer at the weight question (MM-68, MM-73).
  const connection = useLoaded(state.healthConnection);
  const importedWeighIns = useLoaded(state.importedWeighIns);
  const [healthReading, setHealthReading] = useState(false);
  const [usedImport, setUsedImport] = useState(false);
  const [focusWeight, setFocusWeight] = useState(0);
  // Onboarding filled in from Apple Health (MM-69): where the offer stands, and the height read, kept across a change of units.
  const [fromHealth, setFromHealth] = useState<HealthFillState>('offered');
  const [heightFromHealthCm, setHeightFromHealthCm] = useState<number>();

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

  // The paces of fat loss as they would apply from the starting estimate of expenditure (MM-128).
  let paces: ReturnType<typeof describePaces> | undefined;
  if (profile !== undefined && policy !== undefined && bodyFatEstimate !== undefined && weightKg !== undefined && policy.targetsAllowed) {
    const bmrKcal = mifflinStJeorKcal({ sex: profile.sex, weightKg, heightCm: profile.heightCm, ageYears: profile.ageOn(today) });
    paces = describePaces(
      new TargetInputs({
        sex: profile.sex,
        heightCm: profile.heightCm,
        trendWeightKg: weightKg,
        bodyFat: bodyFatEstimate,
        mode: 'fatLoss',
        trainingStatus: status,
        trainingDaysPerWeek: trainingDays,
        policy,
        tdeeKcal: initialTdeePrior({ bmrKcal, dailyActivity: activity, trainingDaysPerWeek: trainingDays }).kcal,
        bmrKcal,
      }),
    );
  }

  let canContinue = true;
  if (step === 0) canContinue = sex !== undefined;
  else if (step === 1) canContinue = birthDate !== undefined && !isMinor;
  else if (step === 2) canContinue = profile !== undefined && weightKg !== undefined && weightKg >= 30 && weightKg <= 350;
  else if (step === 6) {
    // Lean gain without training needs one acknowledgement before it is saved (MM-134).
    const chosenGoal = mode ?? recommendation?.mode;
    const notTraining = trainsNotYet({ trainingDaysPerWeek: trainingDays, trainingStatus: status });
    canContinue =
      policy !== undefined && recommendation !== undefined && !(notTraining && chosenGoal === 'leanGain' && !gainAcknowledged);
  }

  const pickBirthDate = async () => {
    const now = services.clock.now();
    const picked = await overlays.date({
      helpText: 'Date of birth',
      initial: CalendarDate.of(now.getFullYear() - 30, 1, 1),
      first: CalendarDate.of(now.getFullYear() - 100, 1, 1),
      last: CalendarDate.fromDate(now),
      today: CalendarDate.fromDate(now),
    });
    if (picked !== undefined) setBirthDate(picked);
  };

  const pickCreatineStartDate = async () => {
    const picked = await overlays.date({
      helpText: 'Creatine start date',
      initial: creatineStartedOn ?? today,
      first: CalendarDate.of(today.year - 100, today.month, today.day),
      last: today,
      today,
    });
    if (picked !== undefined) setCreatineStartedOn(picked);
  };

  const platform = healthPlatformName(services.platform);
  const importedToday = importedWeighIns?.find((w) => CalendarDate.fromDate(w.day) === today);

  /**
   * Asks to read weight and, with it, its history (MM-73), then reads. Refused,
   * the person types the weight as before; Settings can allow it later.
   */
  const allowWeight = async () => {
    // The row pressed goes away once weight is allowed: the weight field is where a reader goes on.
    setFocusWeight((n) => n + 1);
    const after = await services.healthSource.requestPermission(new Set<HealthDataType>(['weight']));
    state.refreshHealthConnection();
    if (!after.has('weight')) {
      overlays.snack(`Weight was not allowed. You can allow it in Settings, or in ${platform}, whenever you like.`);
      return;
    }
    await services.healthSource.requestHistory().catch(() => false);
    setHealthReading(true);
    try {
      if (!(await state.syncHealth('asked'))) overlays.snack(`${platform} could not be read just now. Type today’s weight instead.`);
    } finally {
      setHealthReading(false);
    }
  };

  const health: WeightFromHealth | undefined =
    connection === undefined || !connection.available.has('weight')
      ? undefined
      : {
          platform,
          allowed: connection.permitted.has('weight'),
          reading: healthReading,
          today: importedToday === undefined ? undefined : { kg: importedToday.kg, sourceName: importedToday.sourceName },
          used: usedImport,
          focusWeight,
          onAllow: () => void allowWeight(),
          onUse: () => {
            if (importedToday === undefined) return;
            setTyped({ ...typed, weight: toStringAsFixed(fmt.weightFromKg(importedToday.kg), 1) });
            setUsedImport(true);
            setFocusWeight((n) => n + 1);
          },
        };

  const finish = async () => {
    if (profile === undefined || policy === undefined || recommendation === undefined || weightKg === undefined) return;
    const chosen = mode ?? recommendation.mode;
    setSaving(true);
    // Today's imported weigh-in, used as it was, is today's weigh-in already: nothing is typed over it (MM-71, MM-73).
    if (!usedImport || importedToday === undefined) await services.weights.saveWeight(today, weightKg);
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
        // A pace chosen for a cut (MM-128); the default pace is stored as none, as before.
        requestedLossFraction:
          chosen === 'fatLoss' && pace !== undefined && pace !== Paces.default ? Paces.fraction(pace) : undefined,
      }),
    );
    // The weigh-in reminder, offered once on the last step (MM-146, MM-158).
    if (remind && (await services.reminderScheduler.requestPermission())) {
      const minuteOfDay = ReminderRule.defaultMinuteOfDay('weighIn');
      await services.reminders.saveReminder(
        new ReminderSetting({
          kind: 'weighIn',
          minuteOfDay,
          enabled: true,
          countFrom: reminderCountFrom({ today, minuteNow: minuteOfDayNow(services.clock), minuteOfDay }),
        }),
      );
    }
  };

  if (!welcomed) {
    return (
      <div className="app-frame">
        <WelcomeStep onStart={() => setWelcomed(true)} onMoveHere={() => void move.receive()} />
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
        weightLossMedication: screening.weightLossMedication,
        fluidLimitedByClinician: screening.fluidLimitedByClinician,
        sleepDisorder: screening.sleepDisorder,
      }),
    );
  };

  const chooseSex = (chosen: BiologicalSex) => {
    setSex(chosen);
    if (chosen === 'male') clearFemaleOnlyAnswers();
  };

  // What Apple Health holds fills the questions it answers; each is still confirmed with Next (MM-69, MM-14).
  const fillFromHealth = async () => {
    setFromHealth('asking');
    let read: HealthProfile;
    try {
      read = await services.healthProfile.readProfile();
    } catch {
      setFromHealth('failed');
      return;
    }
    const born = read.birthDate !== undefined && read.birthDate.epochDay <= today.epochDay ? read.birthDate : undefined;
    const height = read.heightCm !== undefined && read.heightCm >= 100 && read.heightCm <= 250 ? read.heightCm : undefined;
    if (read.sex !== undefined) chooseSex(read.sex);
    if (born !== undefined) setBirthDate(born);
    if (height !== undefined) {
      setHeightFromHealthCm(height);
      setTyped((was) => ({ ...was, ...heightTyped(height, units) }));
    }
    setFromHealth(read.sex !== undefined || born !== undefined || height !== undefined ? 'filled' : 'nothing');
  };

  let body;
  if (step === 0) {
    body = (
      <SexStep
        sex={sex}
        onSex={chooseSex}
        fromHealth={
          services.healthProfile.offersProfile ? { state: fromHealth, onFill: () => void fillFromHealth() } : undefined
        }
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
          setTyped(
            heightFromHealthCm === undefined ? nothingTyped : { ...nothingTyped, ...heightTyped(heightFromHealthCm, chosen) },
          );
          setUsedImport(false);
        }}
        onTyped={(changed) => {
          // A weight typed over the platform's is the person's own.
          if (changed.weight !== typed.weight) setUsedImport(false);
          // So is a height: a change of units no longer puts Apple Health's back over it (the panel review of MM-69).
          if (changed.cm !== typed.cm || changed.feet !== typed.feet || changed.inches !== typed.inches) {
            setHeightFromHealthCm(undefined);
          }
          setTyped(changed);
        }}
        health={health}
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
  } else if (step === 7 && policy !== undefined && recommendation !== undefined && weightKg !== undefined && sex !== undefined) {
    // What the first month will look like (MM-158), from the goal and pace chosen.
    const chosenGoal = policy.allowedModes.has(mode ?? recommendation.mode) ? (mode ?? recommendation.mode) : recommendation.mode;
    const paceFraction =
      chosenGoal === 'fatLoss'
        ? (paces?.find((p) => p.pace === (pace ?? Paces.default))?.achievedFraction ?? Paces.fraction(pace ?? Paces.default))
        : chosenGoal === 'leanGain'
          ? 0.0025
          : 0;
    body = (
      <WhatToExpectStep
        points={whatToExpectPoints({
          goal: chosenGoal,
          paceFraction,
          weightKg,
          sex,
          menstruates: sex === 'female' && !screening.menopause,
          fmt,
        })}
        remind={remind}
        onRemind={setRemind}
      />
    );
  } else if (policy !== undefined && recommendation !== undefined) {
    body = (
      <GoalStep
        policy={policy}
        recommendation={recommendation}
        selected={mode ?? recommendation.mode}
        onMode={setMode}
        paces={paces}
        pace={pace}
        onPace={setPace}
        weightKg={weightKg}
        fmt={fmt}
        notTraining={trainsNotYet({ trainingDaysPerWeek: trainingDays, trainingStatus: status })}
        acknowledged={gainAcknowledged}
        onAcknowledge={() => setGainAcknowledged(true)}
      />
    );
  }

  const last = step === stepCount - 1;
  return (
    <div className="app-frame">
      <div className="onboarding-progress">
        <StepProgress current={step} count={stepCount} />
      </div>
      <main className="app-body app-body-roomy">
        {body}
        <MartianRidge />
      </main>
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
