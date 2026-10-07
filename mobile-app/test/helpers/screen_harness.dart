import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tkbj_mobile/app.dart';
import 'package:tkbj_mobile/data/dummy/dummy_data.dart';
import 'package:tkbj_mobile/data/models/ticket_order.dart';
import 'package:tkbj_mobile/routes/app_routes.dart';
import 'package:tkbj_mobile/state/app_state.dart';

/// Satu layar yang akan dirender pada pengujian tampilan.
class ScreenCase {
  const ScreenCase(
    this.name,
    this.route, {
    this.arguments,
    this.height = 844,
    this.signedIn = true,
  });

  final String name;
  final String route;
  final Object? arguments;

  /// `false` untuk layar yang tampil sebelum login (navbar "Masuk").
  final bool signedIn;

  /// Tinggi frame pada desain Figma (untuk screenshot satu halaman penuh).
  final double height;
}

/// State berisi akun login, keranjang, dan data pemesan agar semua layar
/// (termasuk checkout & akun) bisa dirender langsung.
AppState seededState({bool signedIn = true}) {
  final state = AppState();
  if (signedIn) {
    state.login(DummyData.demoAccount.email, DummyData.demoAccount.password);
  }
  state
    ..setQuantity(DummyData.events[0].id, 2)
    ..setQuantity(DummyData.events[1].id, 1)
    ..saveBuyer(
      BuyerInfo(
        name: DummyData.demoAccount.name,
        email: DummyData.demoAccount.email,
        phone: DummyData.demoAccount.phone,
      ),
    );
  return state;
}

const screenCases = [
  ScreenCase('01-beranda', AppRoutes.home, height: 1820, signedIn: false),
  ScreenCase('02-menu-navigasi', AppRoutes.menu, height: 960, signedIn: false),
  ScreenCase('03-masuk', AppRoutes.login, height: 844, signedIn: false),
  ScreenCase(
    '04-daftar-akun',
    AppRoutes.register,
    height: 960,
    signedIn: false,
  ),
  ScreenCase('05-profil-denah', AppRoutes.profile, height: 1420),
  ScreenCase('06-kalender-acara', AppRoutes.calendar, height: 1090),
  ScreenCase(
    '07-detail-acara',
    AppRoutes.eventDetail,
    arguments: 'wayang-bima-bungkus',
    height: 1200,
  ),
  ScreenCase('08-tiket-pertunjukan', AppRoutes.tickets, height: 960),
  ScreenCase('09-checkout-data-pemesan', AppRoutes.checkoutBuyer, height: 1150),
  ScreenCase(
    '10-checkout-metode-bayar',
    AppRoutes.checkoutPayment,
    height: 1190,
  ),
  ScreenCase('11-checkout-konfirmasi', AppRoutes.checkoutConfirm, height: 1250),
  ScreenCase(
    '12-checkout-berhasil',
    AppRoutes.checkoutSuccess,
    arguments: 'TKBJ-A1B2C3',
    height: 960,
  ),
  ScreenCase('13-sewa-gedung', AppRoutes.rental, height: 1320),
  ScreenCase('14-akun-saya', AppRoutes.account, height: 1100),
  ScreenCase('15-tiket-saya', AppRoutes.myTickets, height: 960),
  ScreenCase('16-riwayat-sewa', AppRoutes.rentalHistory, height: 900),
  ScreenCase('17-edit-profil', AppRoutes.editProfile, height: 844),
];

/// Merender [screen] di atas beranda pada ukuran [size].
Future<void> pumpScreen(
  WidgetTester tester,
  ScreenCase screen,
  Size size, {
  AppState? state,
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  await tester.pumpWidget(
    TkbjApp(state: state ?? seededState(signedIn: screen.signedIn)),
  );
  await tester.pumpAndSettle();
  if (screen.route != AppRoutes.home) {
    tester
        .state<NavigatorState>(find.byType(Navigator).first)
        .pushNamed(screen.route, arguments: screen.arguments);
    await tester.pumpAndSettle();
  }
}
