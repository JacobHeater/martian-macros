/** What each signal is about, in a word or two, and whether it reads as plural ("Calories are"). */
const subjects: Readonly<Record<string, readonly [subject: string, plural: boolean]>> = {
  proteinMinimum: ['Protein', false],
  proteinTarget: ['Protein', false],
  proteinByMeal: ['Protein at meals', false],
  proteinDensity: ['Protein per 100 kcal', false],
  fatAgainstTarget: ['Fat', false],
  fatShare: ['Fat', false],
  carbohydrate: ['Carbohydrate', false],
  macroSplit: ['The split', false],
  calorieDensity: ['Calories per gram', true],
  fiber: ['Fiber', false],
  sodium: ['Sodium', false],
  calories: ['Calories', true],
  energyUse: ['Intake', false],
  mealBalance: ['Protein in meals', false],
  trainingStopped: ['Training', false],
  trainingDropped: ['Training', false],
  setsPerMuscle: ['Weekly sets', true],
  strengthRising: ['Strength', false],
  strengthStalled: ['Strength', false],
  strengthOnFatLoss: ['Strength', false],
  trainingDays: ['Training days', true],
  rirUnrecorded: ['Reps in reserve', true],
  proteinByTrainingDay: ['Protein on rest days', false],
  waterOnTrainingDays: ['Water on training days', false],
};

/**
 * A finding's subject for MM-610's headline, with its verb: "Protein is",
 * "Calories are". At the start of a sentence, or after a semicolon with a
 * small first letter (`following`). A signal with none is "This".
 */
export function findingSubjectText(signal: string, { following = false }: { following?: boolean } = {}): string {
  const [subject, plural] = subjects[signal] ?? ['This', false];
  const said = following ? `${subject.charAt(0).toLowerCase()}${subject.slice(1)}` : subject;
  return `${said} ${plural ? 'are' : 'is'}`;
}
