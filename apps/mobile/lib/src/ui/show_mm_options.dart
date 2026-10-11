import 'package:flutter/material.dart';

import 'mm_menu_item.dart';

/// Asks for one of a short list of [options], with the [selected] one
/// marked in words and with a check, not by color alone. Returns the chosen
/// entry, or null if the list was closed. Each row is keyed
/// `option-<index>`.
Future<MmMenuItem<T>?> showMmOptions<T>(
  BuildContext context, {
  required String title,
  required List<MmMenuItem<T>> options,
  required T selected,
}) => showDialog<MmMenuItem<T>>(
  context: context,
  builder: (context) => SimpleDialog(
    title: Text(title),
    children: [
      for (var i = 0; i < options.length; i++)
        Semantics(
          selected: options[i].value == selected,
          child: ListTile(
            key: ValueKey('option-$i'),
            title: Text(options[i].label),
            trailing: options[i].value == selected
                ? const Icon(Icons.check, semanticLabel: 'Chosen')
                : null,
            onTap: () => Navigator.of(context).pop(options[i]),
          ),
        ),
    ],
  ),
);
