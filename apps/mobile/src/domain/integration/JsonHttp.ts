import type { JsonResponse } from './JsonResponse';

/**
 * One small JSON request to a web service, the only kind of request the
 * online food lookup makes (MM-58). A fixture stands in for it in tests; the
 * phone's own HTTP stack is behind it in the shell, so the request carries
 * the app's name as the services ask. A failure to reach the service throws.
 */
export interface JsonHttp {
  getJson(url: URL, options?: { headers?: Readonly<Record<string, string>> | undefined }): Promise<JsonResponse>;
  postJson(url: URL, body: unknown, options?: { headers?: Readonly<Record<string, string>> | undefined }): Promise<JsonResponse>;
}
