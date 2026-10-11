/// Why GitHub could not be read.
enum GhFailureKind {
  /// Not logged in, or the login was refused. Retrying will not help.
  auth,
  rateLimit,

  /// The repository or pull request does not exist, or cannot be seen.
  notFound,

  /// The head commit kept changing while it was being read.
  headUnstable,

  /// Anything else: the network, a timeout, an answer not understood.
  other,
}
