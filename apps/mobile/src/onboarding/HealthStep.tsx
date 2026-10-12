import { ScreeningAnswers } from '../domain/ScreeningAnswers';
import { MmCheckRow } from '../ui/MmCheckRow';

type Answer =
  | 'pregnant'
  | 'breastfeeding'
  | 'eatingDisorderHistory'
  | 'chronicKidneyDisease'
  | 'androgenUse'
  | 'pcos'
  | 'menopause'
  | 'thyroidCondition'
  | 'insulinOrSulfonylurea'
  | 'insulinCareTeamConfirmed'
  | 'bariatricSurgery'
  | 'weightAffectingMedication';

const answers: readonly Answer[] = [
  'pregnant',
  'breastfeeding',
  'eatingDisorderHistory',
  'chronicKidneyDisease',
  'androgenUse',
  'pcos',
  'menopause',
  'thyroidCondition',
  'insulinOrSulfonylurea',
  'insulinCareTeamConfirmed',
  'bariatricSurgery',
  'weightAffectingMedication',
];

interface HealthStepProps {
  screening: ScreeningAnswers;
  female: boolean;
  onChange: (answers: ScreeningAnswers) => void;
  /** Whether to show the step's own heading; off where a screen already has one. */
  heading?: boolean;
}

/** Step 6: the health check. Female-only questions appear only for females. */
export function HealthStep({ screening, female, onChange, heading = true }: HealthStepProps) {
  const s = screening;
  const item = (title: string, answer: Answer) => (
    <MmCheckRow
      title={title}
      value={s[answer]}
      onChange={(value) =>
        onChange(new ScreeningAnswers(Object.fromEntries(answers.map((a) => [a, a === answer ? value : s[a]]))))
      }
    />
  );
  return (
    <>
      {heading ? <h1 className="app-headline">Health check</h1> : null}
      <p className="app-text">
        Tick anything that applies. These change what the app will recommend, and some switch off calorie deficits
        entirely.
      </p>
      {female ? (
        <>
          {item('Pregnant', 'pregnant')}
          {item('Breastfeeding', 'breastfeeding')}
          {item('PCOS', 'pcos')}
          {item('Perimenopause or menopause', 'menopause')}
        </>
      ) : null}
      {item('History of an eating disorder', 'eatingDisorderHistory')}
      {item('Chronic kidney disease', 'chronicKidneyDisease')}
      {item('Thyroid condition', 'thyroidCondition')}
      {item('Testosterone therapy or anabolic steroids', 'androgenUse')}
      {item('Diabetes treated with insulin or a sulfonylurea', 'insulinOrSulfonylurea')}
      {s.insulinOrSulfonylurea
        ? item('I have discussed a calorie deficit with my care team', 'insulinCareTeamConfirmed')
        : null}
      {item('I have had bariatric surgery', 'bariatricSurgery')}
      {item('A medication I take can change my weight or water retention', 'weightAffectingMedication')}
      <p className="app-caption">
        This app is not medical advice. Talk to your clinician before changing your diet if you have a medical
        condition.
      </p>
    </>
  );
}
