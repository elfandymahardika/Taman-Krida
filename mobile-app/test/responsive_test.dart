import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/screen_harness.dart';

/// Memastikan setiap layar tidak overflow pada ponsel kecil, ponsel besar,
/// dan tablet landscape. Flutter melempar error "RenderFlex overflowed"
/// yang membuat test gagal jika ada elemen yang terpotong.
void main() {
  const sizes = {
    'ponsel kecil 320x568': Size(320, 568),
    'ponsel besar 430x932': Size(430, 932),
    'landscape 844x390': Size(844, 390),
    'tablet 1024x768': Size(1024, 768),
  };

  for (final size in sizes.entries) {
    group(size.key, () {
      for (final screen in screenCases) {
        testWidgets(screen.name, (tester) async {
          addTearDown(tester.view.reset);
          await pumpScreen(tester, screen, size.value);
          expect(tester.takeException(), isNull);

          // Scroll ke bawah untuk merender seluruh isi halaman.
          final scrollable = find.byType(Scrollable).first;
          await tester.drag(scrollable, const Offset(0, -4000));
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
        });
      }
    });
  }
}
