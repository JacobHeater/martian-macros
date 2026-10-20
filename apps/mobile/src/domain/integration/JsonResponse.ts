/** What a JSON request came back with: the status and the parsed body (undefined when it was not JSON). */
export interface JsonResponse {
  readonly statusCode: number;
  readonly body: unknown;
}
