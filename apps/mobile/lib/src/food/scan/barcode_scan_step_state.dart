import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../../food_packs/food_catalog_provider.dart';
import '../../ui/mm_button.dart';
import '../../ui/mm_button_kind.dart';
import '../../ui/mm_text_field.dart';
import '../../ui/mm_text_field_kind.dart';
import '../../ui/notice.dart';
import 'barcode_scan_step.dart';
import 'barcode_scanner_provider.dart';
import 'scanned_barcode.dart';

class BarcodeScanStepState extends ConsumerState<BarcodeScanStep> {
  final _digits = TextEditingController();
  String? _message;

  @override
  void dispose() {
    _digits.dispose();
    super.dispose();
  }

  Future<void> _lookup(ScannedBarcode scanned) async {
    final gtin = normalizeBarcode(
      scanned.digits,
      symbology: scanned.symbology == BarcodeSymbology.gtin14
          ? null
          : scanned.symbology,
    );
    if (gtin == null) {
      setState(
        () => _message =
            'Those digits are not a valid barcode. Check them against the '
            'package.',
      );
      return;
    }
    final catalog = await ref.read(foodCatalogProvider.future);
    final food = catalog.byBarcode(gtin);
    if (!mounted) return;
    if (food == null) {
      setState(
        () => _message =
            'This product is not in the food database on this phone. You can '
            'enter it yourself.',
      );
      return;
    }
    widget.onFound(food);
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Scan a barcode', style: text.titleLarge),
        const SizedBox(height: 4),
        Text(
          'The camera reads the barcode on this phone. Nothing is uploaded.',
          style: text.bodySmall,
        ),
        const SizedBox(height: 12),
        ref
            .watch(barcodeScannerProvider)
            .view(
              onScan: _lookup,
              unavailable: (_) => const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Notice(
                  text:
                      'The camera is not available. Allow camera access in '
                      'your phone settings to scan, or type the digits below.',
                ),
              ),
            ),
        const SizedBox(height: 12),
        MmTextField(
          key: const ValueKey('barcode-digits'),
          controller: _digits,
          label: 'Or type the digits',
          kind: MmTextFieldKind.number,
          onChanged: (_) => setState(() => _message = null),
        ),
        const SizedBox(height: 8),
        MmButton(
          key: const ValueKey('barcode-lookup'),
          label: 'Look up',
          kind: MmButtonKind.secondary,
          onPressed: _digits.text.trim().isEmpty
              ? null
              : () => _lookup(
                  ScannedBarcode(_digits.text, BarcodeSymbology.gtin14),
                ),
        ),
        if (_message != null) ...[
          const SizedBox(height: 12),
          Notice(text: _message!),
          const SizedBox(height: 8),
          MmButton(
            label: 'Enter manually',
            kind: MmButtonKind.secondary,
            onPressed: widget.onManual,
          ),
        ],
        MmButton(
          label: 'Back to search',
          kind: MmButtonKind.text,
          onPressed: widget.onBack,
        ),
      ],
    );
  }
}
