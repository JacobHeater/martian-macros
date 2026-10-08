import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../theme/mm_theme.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import 'button_specimens.dart';
import 'color_swatches.dart';
import 'data_specimens.dart';
import 'gallery_screen.dart';
import 'gallery_section.dart';
import 'input_specimens.dart';
import 'surface_specimens.dart';
import 'type_specimens.dart';

class GalleryScreenState extends ConsumerState<GalleryScreen> {
  var _brightness = Brightness.dark;
  var _textScale = 1.0;

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    return Theme(
      data: mmTheme(_brightness),
      child: MediaQuery(
        data: media.copyWith(textScaler: TextScaler.linear(_textScale)),
        child: Builder(
          builder: (context) => Scaffold(
            appBar: const MmAppBar(title: 'Component gallery'),
            body: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Wrap(
                  spacing: 16,
                  runSpacing: 8,
                  children: [
                    MmSegmented<Brightness>(
                      segments: const [
                        MmSegment(Brightness.light, 'Light'),
                        MmSegment(Brightness.dark, 'Dark'),
                      ],
                      selected: {_brightness},
                      onChanged: (s) => setState(() => _brightness = s.first),
                    ),
                    MmSegmented<double>(
                      segments: const [
                        MmSegment(1.0, '100%'),
                        MmSegment(2.0, '200%'),
                      ],
                      selected: {_textScale},
                      onChanged: (s) => setState(() => _textScale = s.first),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                const GallerySection(title: 'Colors', child: ColorSwatches()),
                const GallerySection(title: 'Type', child: TypeSpecimens()),
                const GallerySection(
                  title: 'Buttons',
                  child: ButtonSpecimens(),
                ),
                const GallerySection(title: 'Inputs', child: InputSpecimens()),
                const GallerySection(
                  title: 'Surfaces and rows',
                  child: SurfaceSpecimens(),
                ),
                const GallerySection(
                  title: 'Data and progress',
                  child: DataSpecimens(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
