import type { CoachAiProvider } from '../domain/integration/CoachAiProvider';

const labels: Readonly<Record<CoachAiProvider, string>> = {
  none: 'Off (built-in offline coach)',
  gemini: 'Google Gemini (your key)',
  openai: 'OpenAI (your key)',
  anthropic: 'Anthropic (your key)',
};

/**
 * Human-readable label for each `CoachAiProvider` option in Settings (MM-665).
 */
export function coachAiProviderLabel(provider: CoachAiProvider): string {
  return labels[provider];
}
