import type { FatLossPace } from '../engine/FatLossPace';

const sentences: Readonly<Record<FatLossPace, string>> = {
  gentle: 'Slow and steady: hunger and training are easiest to manage, and muscle is best kept.',
  standard: 'Training usually carries on as normal at this pace.',
  faster: 'Noticeably hungrier, and strength may dip. For a short, hard push while body fat is high.',
};

/** One sentence of consequence for a fat-loss pace (MM-128): what it is like to live on. */
export const paceConsequence = (pace: FatLossPace): string => sentences[pace];
