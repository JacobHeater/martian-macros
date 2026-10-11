/// The id of the watch on a pull request. One pull request has one id, which
/// is what stops two watches of the same one.
String watchId(String repository, int pr) =>
    '${repository.replaceAll(RegExp('[^A-Za-z0-9._-]+'), '-')}-pr$pr';
