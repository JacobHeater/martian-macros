/// Unit conversions for the UI edge. The domain and engine are SI-only.
abstract final class Units {
  static const double kgPerLb = 0.45359237;
  static const double cmPerInch = 2.54;

  static double lbToKg(double lb) => lb * kgPerLb;
  static double kgToLb(double kg) => kg / kgPerLb;
  static double inchesToCm(double inches) => inches * cmPerInch;
  static double cmToInches(double cm) => cm / cmPerInch;
}
