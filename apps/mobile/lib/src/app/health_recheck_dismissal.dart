import 'package:flutter_riverpod/flutter_riverpod.dart';

class HealthRecheckDismissal extends Notifier<bool> {
  @override
  bool build() => false;

  void dismissForThisLaunch() => state = true;
}
