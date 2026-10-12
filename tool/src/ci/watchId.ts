/**
 * The id of the watch on a pull request. One pull request has one id, which
 * is what stops two watches of the same one.
 */
export const watchId = (repository: string, pr: number): string =>
  `${repository.replace(/[^A-Za-z0-9._-]+/g, '-')}-pr${pr}`;
