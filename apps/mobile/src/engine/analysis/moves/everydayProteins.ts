import type { EverydayProtein } from './EverydayProtein';

/**
 * The lean protein foods the coach may name to add or to carry the next
 * meal (MM-688), in the order it prefers them. The catalog holds thousands
 * of foods in the protein groups, and the one with the most protein inside
 * a calorie cap is game, offal or a whole can of clams: the owner's brief
 * of 2026-10-28 added "a beaver" beside a biscuit. The coach names what a
 * person would buy and cook: chicken breast first, as the owner's approved
 * line A says.
 */
export const everydayProteins: readonly EverydayProtein[] = [
  { query: 'chicken breast', name: /\bchicken\b.*\bbreast\b/i, group: 'meatAndPoultry' },
  { query: 'turkey breast', name: /\bturkey\b.*\bbreast\b/i, group: 'meatAndPoultry' },
  { query: 'egg white', name: /\begg,?\s+whites?\b/i, group: 'eggs' },
  { query: 'yogurt greek', name: /\b(yogurt,?\s+greek|greek\s+yogurt)\b/i, group: 'dairyAndYogurt' },
  { query: 'cottage cheese', name: /\b(cottage\s+cheese|cheese,?\s+cottage)\b/i, group: 'dairyAndYogurt' },
  { query: 'tuna', name: /\btuna\b/i, group: 'fish' },
  { query: 'shrimp', name: /\bshrimp\b/i, group: 'fish' },
  { query: 'cod', name: /\bcod\b/i, group: 'fish' },
  { query: 'tilapia', name: /\btilapia\b/i, group: 'fish' },
  { query: 'salmon', name: /\bsalmon\b/i, group: 'fish' },
  { query: 'pork tenderloin', name: /\bpork\b.*\btenderloin\b/i, group: 'meatAndPoultry' },
  { query: 'sirloin', name: /\bsirloin\b/i, group: 'meatAndPoultry' },
  { query: 'ground turkey', name: /\b(turkey,?\s+ground|ground\s+turkey)\b/i, group: 'meatAndPoultry' },
];
