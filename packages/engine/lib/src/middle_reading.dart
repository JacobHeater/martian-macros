/// The measurement three readings stand for (MM-155): the middle one, so a
/// single odd reading does not move it. For one reading, that reading.
double middleReading(List<double> readings) {
  if (readings.length != 1 && readings.length != 3) {
    throw ArgumentError.value(readings, 'readings', 'One reading or three.');
  }
  return ([...readings]..sort())[readings.length ~/ 2];
}
