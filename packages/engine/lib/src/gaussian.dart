import 'mat.dart';

final class Gaussian {
  const Gaussian(this.mean, this.cov);

  final List<double> mean;
  final Mat cov;
}
