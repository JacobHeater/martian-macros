import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'barcode_scan_step_state.dart';

/// Scan a packaged food's barcode, or type its digits (MM-43). A product found
/// in the installed packs is handed to [onFound]; otherwise the step says it is
/// not there and offers [onManual].
class BarcodeScanStep extends ConsumerStatefulWidget {
  const BarcodeScanStep({
    required this.onFound,
    required this.onFoundCustom,
    required this.onReadLabel,
    required this.onManual,
    required this.onBack,
    super.key,
  });

  final ValueChanged<CatalogFood> onFound;
  final ValueChanged<CustomFood> onFoundCustom;

  /// A product the packs do not have: read its label, to be saved against
  /// these digits (MM-44).
  final ValueChanged<String> onReadLabel;
  final VoidCallback onManual;
  final VoidCallback onBack;

  @override
  ConsumerState<BarcodeScanStep> createState() => BarcodeScanStepState();
}
