import type { CoachAiProvider } from './CoachAiProvider';

/**
 * The person's optional BYOK provider choice and API key (MM-665).
 */
export interface CoachAiConfig {
  readonly provider: CoachAiProvider;
  readonly apiKey: string;
}

export const CoachAiConfig = {
  off: { provider: 'none', apiKey: '' } satisfies CoachAiConfig,
} as const;
