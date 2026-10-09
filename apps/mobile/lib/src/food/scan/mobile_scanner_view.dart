import 'package:flutter/widgets.dart';

import 'scanned_barcode.dart';
import 'mobile_scanner_view_state.dart';

/// The live camera with a torch toggle. The only widget that touches the
/// camera plugin.
class MobileScannerView extends StatefulWidget {
  const MobileScannerView({
    required this.onScan,
    required this.unavailable,
    super.key,
  });

  final ValueChanged<ScannedBarcode> onScan;
  final WidgetBuilder unavailable;

  @override
  State<MobileScannerView> createState() => MobileScannerViewState();
}
