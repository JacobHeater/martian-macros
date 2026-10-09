/// The simulated loss of a connection in [InMemoryPackHttp].
final class PackConnectionDropped implements Exception {
  const PackConnectionDropped();

  @override
  String toString() => 'the connection dropped';
}
