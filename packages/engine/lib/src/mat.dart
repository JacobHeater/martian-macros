/// Minimal dense square matrix for the 3-state filter.
final class Mat {
  Mat._(this.n, this._v);

  factory Mat.of(int n, List<double> rowMajor) {
    assert(rowMajor.length == n * n);
    return Mat._(n, List.of(rowMajor));
  }

  factory Mat.generate(int n, double Function(int i, int j) f) => Mat._(n, [
    for (var i = 0; i < n; i++)
      for (var j = 0; j < n; j++) f(i, j),
  ]);

  factory Mat.diagonal(List<double> d) =>
      Mat.generate(d.length, (i, j) => i == j ? d[i] : 0);

  final int n;
  final List<double> _v;

  double at(int i, int j) => _v[i * n + j];

  Mat mul(Mat o) => Mat.generate(n, (i, j) {
    var sum = 0.0;
    for (var k = 0; k < n; k++) {
      sum += at(i, k) * o.at(k, j);
    }
    return sum;
  });

  List<double> apply(List<double> x) => [
    for (var i = 0; i < n; i++)
      [for (var k = 0; k < n; k++) at(i, k) * x[k]].fold(0.0, (a, b) => a + b),
  ];

  Mat add(Mat o) => Mat.generate(n, (i, j) => at(i, j) + o.at(i, j));
  Mat sub(Mat o) => Mat.generate(n, (i, j) => at(i, j) - o.at(i, j));
  Mat t() => Mat.generate(n, (i, j) => at(j, i));

  /// Gauss-Jordan inverse with partial pivoting.
  Mat inverse() {
    final a = [
      for (var i = 0; i < n; i++)
        [
          for (var j = 0; j < n; j++) at(i, j),
          for (var j = 0; j < n; j++) i == j ? 1.0 : 0.0,
        ],
    ];
    for (var col = 0; col < n; col++) {
      var pivot = col;
      for (var r = col + 1; r < n; r++) {
        if (a[r][col].abs() > a[pivot][col].abs()) pivot = r;
      }
      final tmp = a[col];
      a[col] = a[pivot];
      a[pivot] = tmp;
      final p = a[col][col];
      if (p == 0) throw StateError('Singular covariance');
      for (var j = 0; j < 2 * n; j++) {
        a[col][j] /= p;
      }
      for (var r = 0; r < n; r++) {
        if (r == col) continue;
        final factor = a[r][col];
        if (factor == 0) continue;
        for (var j = 0; j < 2 * n; j++) {
          a[r][j] -= factor * a[col][j];
        }
      }
    }
    return Mat.generate(n, (i, j) => a[i][n + j]);
  }
}
