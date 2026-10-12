import type { Caution } from '../domain';

const messages: Readonly<Record<Caution, string>> = {
  pregnancy:
    'Pregnancy: the app holds you at maintenance and will not prescribe ' +
    'a deficit. Follow your clinician’s guidance on intake.',
  breastfeeding:
    'Breastfeeding: targets include extra energy for milk production ' +
    'and the app will not prescribe a deficit.',
  eatingDisorderHistory:
    'Deficit modes are switched off. If food or weight tracking starts ' +
    'to feel distressing, stop and talk to your care team.',
  chronicKidneyDisease:
    'Kidney disease: protein is capped low. Confirm your protein and ' +
    'energy targets with your nephrologist or dietitian.',
  pcos:
    'PCOS can change how your body responds. The app adapts to your ' +
    'measured results; keep your clinician in the loop.',
  menopause:
    'Hormonal changes can shift energy needs and water retention. The ' + 'app adapts to your measured results.',
  underweight:
    'Your weight is below the range where the app will plan a calorie ' +
    'deficit, so it holds you at maintenance. If you are not eating ' +
    'enough, or you are losing weight without trying, talk to a clinician.',
  lowBodyWeight:
    'Your weight is close to the low end of the healthy range, so the app ' + 'only plans the gentlest pace of loss.',
  thyroidCondition:
    'Thyroid conditions affect energy needs. The app adapts to your ' +
    'measured results; keep your treatment stable where you can.',
  insulinOrSulfonylurea:
    'Insulin or sulfonylurea treatment can cause low blood sugar when you ' +
    'eat less. Talk to your care team before a deficit; until then, ' +
    'the app limits loss to the gentlest pace.',
  bariatricSurgery:
    'After bariatric surgery, your surgical team should set your nutrition ' +
    'targets. The app will not issue coaching targets.',
  weightAffectingMedication:
    'Some medications can change weight or water retention. Your trend may ' +
    'move for reasons other than food; keep your clinician informed.',
};

/** What the app says about a caution raised by the health check. */
export const cautionMessage = (caution: Caution): string => messages[caution];
