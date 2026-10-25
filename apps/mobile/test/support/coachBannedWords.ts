/**
 * MM-617: what the coach's analysis text never says, in place of MM-108's
 * list (`test/voice.test.ts`), which bans verdicts on choices that the
 * coach is allowed ("too much", "that was the mistake"). Profanity; words
 * about the person's body, weight or worth ("fat" aimed at the person,
 * "lazy", "weak", "disgusting"); and the moral words for food: cheat,
 * sinful, deserve, earn, burn off.
 */
export const coachBannedWords: readonly (readonly [name: string, pattern: RegExp])[] = [
  ['profanity', /\b(fuck\w*|shit\w*|bitch\w*|damn\w*|ass|asses|asshole\w*|bastard\w*|crap\w*|piss\w*|dick\w*|hell|bloody|wtf)\b/i],
  ['fat, aimed at the person', /\b(you|you're|you are|yourself|you look|you got|you're getting)\s+(\w+\s+)?(fat|obese|chubby|flabby|fatty)\b/i],
  ['fat, as a name for a person', /\bfat (ass|slob|pig|person|people|body|guy|girl)\b|\bget(ting)? fat\b|\bfatso\b|\bfatty\b/i],
  ['lazy', /\blaz(y|iness)\b/i],
  ['weak', /\bweak(ling)?\b/i],
  ['disgusting', /\bdisgust\w*/i],
  ['pathetic', /\bpathetic\b/i],
  ['worthless', /\bworthless\b/i],
  ['cheat', /\bcheat\w*/i],
  ['sinful', /\bsin(ful)?\b/i],
  ['deserve', /\bdeserv\w*/i],
  ['earn', /\bearn(s|ed|ing)?\b/i],
  ['burn off', /\bburn(s|ed|ing)?( it| that)? off\b/i],
];
