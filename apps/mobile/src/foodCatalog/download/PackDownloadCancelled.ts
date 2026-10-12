/** The user cancelled. What was downloaded is kept so a later start resumes. */
export class PackDownloadCancelled extends Error {
  override readonly name = 'PackDownloadCancelled';

  constructor() {
    super('PackDownloadCancelled');
  }
}
