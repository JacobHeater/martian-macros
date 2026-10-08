/// Deletes everything the app has stored (reset app).
abstract interface class DataEraser {
  Future<void> eraseAll();
}
