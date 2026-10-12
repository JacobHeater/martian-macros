/**
 * Whether the checks GitHub requires for the branch could be established.
 * `noneReported` is what GitHub says when none are configured, and also
 * before any has registered, so it is not proof that nothing is required.
 */
export type RequiredDiscovery = 'discovered' | 'noneReported' | 'unknown';
