// Membuat screenshot setiap layar untuk README.
// Jalankan: flutter test test_screenshots --update-goldens
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import '../test/helpers/screen_harness.dart';

Future<void> _loadFamily(String family, List<String> assets) async {
  final loader = FontLoader(family);
  for (final asset in assets) {
    loader.addFont(rootBundle.load(asset));
  }
  await loader.load();
}

/// Emoji (🎟 🔔) memakai font emoji sistem, seperti di perangkat asli.
Future<void> _loadEmojiFont() async {
  final file = File(r'C:\Windows\Fonts\seguiemj.ttf');
  if (!file.existsSync()) return;
  final loader = FontLoader('Segoe UI Emoji')
    ..addFont(Future.value(ByteData.sublistView(file.readAsBytesSync())));
  await loader.load();
}

Future<void> _precacheImages(WidgetTester tester) async {
  await tester.runAsync(() async {
    for (final element in find.byType(Image).evaluate()) {
      final image = element.widget as Image;
      await precacheImage(image.image, element);
    }
    // Beri waktu flutter_svg memuat & mem-parse aset SVG.
    await Future<void>.delayed(const Duration(milliseconds: 300));
  });
  await tester.pumpAndSettle();
}

void main() {
  setUpAll(() async {
    await _loadFamily('Poppins', [
      for (final w in [
        'Regular',
        'Italic',
        'Medium',
        'SemiBold',
        'Bold',
        'ExtraBold',
      ])
        'assets/fonts/Poppins-$w.ttf',
    ]);
    await _loadFamily('PlayfairDisplay', [
      for (final w in [600, 700, 800]) 'assets/fonts/PlayfairDisplay-$w.ttf',
    ]);
    await _loadFamily('TkbjSymbolsMath', ['assets/fonts/TkbjSymbolsMath.ttf']);
    await _loadFamily('TkbjSymbols2', ['assets/fonts/TkbjSymbols2.ttf']);
    await _loadEmojiFont();
  });

  for (final screen in screenCases) {
    testWidgets(screen.name, (tester) async {
      addTearDown(tester.view.reset);
      await pumpScreen(tester, screen, Size(390, screen.height));
      await _precacheImages(tester);
      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('../docs/screenshots/${screen.name}.png'),
      );
    });
  }
}
