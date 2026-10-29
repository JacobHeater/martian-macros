import type { CoachToolbox } from './CoachToolbox';

/**
 * A bounded request for coaching narration over a deterministic pre-calculated
 * brief or meal breakdown (MM-665).
 */
export interface CoachNarrationRequest {
  /** Deterministic state hash so identical state is never requested twice. */
  readonly cacheKey: string;
  /** System instructions bounding the model to the supplied figures. */
  readonly systemPrompt: string;
  /** Structured JSON or text summary of the deterministic figures. */
  readonly userPrompt: string;
  /** Offline / fallback archetype text returned when BYOK is off or verification fails. */
  readonly fallbackText: string;
  /** True when the person has an active eating disorder or safeguard requiring protein-only framing. */
  readonly protectedPath: boolean;
  /** True when `proteinRemainingG * 4 > kcalRemaining` so tonight's protein gap cannot fit. */
  readonly proteinUnrecoverable: boolean;
  /** Numbers from the deterministic brief that the narration is permitted to cite. */
  readonly allowedNumbers: readonly number[];
  /** The tools the model may call before it answers (MM-685); none, and it answers from the prompt alone. */
  readonly toolbox?: CoachToolbox | undefined;
  /** The most sentences the answer may run to (MM-693); more, and it is refused for rambling. None, and only the character bound holds. */
  readonly maxSentences?: number | undefined;
  /** The most words the answer may run to (MM-693); more, and it is refused for rambling. */
  readonly maxWords?: number | undefined;
}
