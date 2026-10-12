/** The simulated loss of a connection in `InMemoryPackHttp`. */
export class PackConnectionDropped extends Error {
  override readonly name = 'PackConnectionDropped';

  constructor() {
    super('the connection dropped');
  }
}
