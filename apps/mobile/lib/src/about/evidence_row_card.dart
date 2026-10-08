import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import 'evidence_row_card_state.dart';

/// A rule, how well supported it is, and (on tap) where it comes from.
class EvidenceRowCard extends StatefulWidget {
  const EvidenceRowCard({required this.row, super.key});

  final EvidenceRow row;

  @override
  State<EvidenceRowCard> createState() => EvidenceRowCardState();
}
