import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';

import 'health/health_connect_source.dart';

/// The one place the app chooses its integration providers (MM-162). Screens
/// and other providers depend on the interfaces only.
///
/// A seam with no real provider yet throws until one is registered here; a
/// test or a demo overrides it with the in-memory fixture from `mm_fixtures`.
/// Choosing a vendor later is a change to this file (and its entry in the
/// import rules in tool/src/arch/default_import_rules.dart), not to any screen.

/// The real clock. Override with `FixedClock` to fix the day.
final clockProvider = Provider<Clock>((ref) => const SystemClock());

final foodSearchProvider = Provider<FoodSearch>(
  (ref) => throw UnimplementedError('No food search is registered yet.'),
);

final foodBarcodeLookupProvider = Provider<FoodBarcodeLookup>(
  (ref) => throw UnimplementedError('No barcode lookup is registered yet.'),
);

final backupStorageProvider = Provider<BackupStorage>(
  (ref) => throw UnimplementedError('No backup storage is registered yet.'),
);

final entitlementReaderProvider = Provider<EntitlementReader>(
  (ref) => throw UnimplementedError('No entitlement source is registered yet.'),
);

/// The phone's health platform (MM-67): Health Connect on Android (MM-68).
/// HealthKit (MM-69) is registered here when it exists.
final healthSourceProvider = Provider<HealthSource>(
  (ref) => defaultTargetPlatform == TargetPlatform.android
      ? HealthConnectSource()
      : throw UnimplementedError('No health platform is registered yet.'),
);
