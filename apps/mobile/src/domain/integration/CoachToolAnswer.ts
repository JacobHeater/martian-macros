/**
 * What a tool answered (MM-685): the answer as JSON, and the numbers in
 * it, which the model may then say (`CoachNarrationRequest.allowedNumbers`
 * grows by them).
 */
export interface CoachToolAnswer {
  readonly result: unknown;
  readonly numbers: readonly number[];
}
