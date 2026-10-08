import 'package:flutter/material.dart';

import 'edit_height_sheet_state.dart';

/// A sheet to correct the user's height. Saves only a plausible value.
class EditHeightSheet extends StatefulWidget {
  const EditHeightSheet({
    required this.initialCm,
    required this.imperial,
    required this.onSave,
    super.key,
  });

  final double initialCm;
  final bool imperial;
  final ValueChanged<double> onSave;

  @override
  State<EditHeightSheet> createState() => EditHeightSheetState();
}
