import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tkbj_mobile/app.dart';
import 'package:tkbj_mobile/data/dummy/dummy_data.dart';
import 'package:tkbj_mobile/data/models/facility.dart';
import 'package:tkbj_mobile/data/models/rental_request.dart';
import 'package:tkbj_mobile/data/models/ticket_order.dart';
import 'package:tkbj_mobile/data/repository/demo_repository.dart';
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
    this.prepare,
  });

  final String name;
  final String route;
  final Object? arguments;

  /// `false` untuk layar yang tampil sebelum login (navbar "Masuk").
  final bool signedIn;

  /// Tinggi frame pada desain Figma (untuk screenshot satu halaman penuh).
  final double height;

  /// Menyiapkan state tambahan sebelum layar dibuka.
  final Future<void> Function(AppState state)? prepare;
}

/// Berkas PDF kecil pengganti pemilih berkas sistem.
UploadedFile fakeFile([String name = 'berkas.pdf']) => UploadedFile.fromBytes(
  name,
  Uint8List.fromList(utf8.encode('%PDF-1.4\n%contoh\n')),
);

Future<UploadedFile?> fakePick({required bool imagesOnly}) async =>
    fakeFile(imagesOnly ? 'bukti.jpg' : 'berkas.pdf');

/// State dengan data contoh di memori (tanpa server) & pemilih berkas palsu.
AppState demoState() =>
    AppState(repository: DemoRepository(), pickFile: fakePick);

/// [AppState] yang sudah memuat data contoh dan masuk sebagai akun demo.
Future<AppState> signedInState() async {
  final state = demoState();
  await state.init();
  await state.login(DummyData.demoAccount.email, DummyData.demoPassword);
  return state;
}

/// State berisi akun login, keranjang, dan data pemesan agar semua layar
/// (termasuk checkout & akun) bisa dirender langsung.
Future<AppState> seededState({bool signedIn = true}) async {
  final state = signedIn ? await signedInState() : demoState();
  await state.init();
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

Facility get pendopo => DummyData.facilities.first;

/// Tanggal & slot pertama yang masih tersedia untuk [facility], dimulai
/// beberapa hari setelah "hari ini" data contoh.
Future<(DateTime, RentalSlot)> firstAvailableBooking(
  AppState state,
  Facility facility,
) async {
  var date = state.today.add(const Duration(days: 3));
  await state.loadAvailability(facility, date);
  while (state.isDateFull(facility, date)) {
    date = date.add(const Duration(days: 1));
    await state.loadAvailability(facility, date);
  }
  final slot = RentalSlot.values.firstWhere(
    (s) => !state.isSlotTaken(facility, date, s),
  );
  return (date, slot);
}

Future<void> _draftVenue(AppState state) async =>
    state.startRental(facility: pendopo);

Future<void> _draftSchedule(AppState state) async {
  await _draftVenue(state);
  final (date, slot) = await firstAvailableBooking(state, pendopo);
  state
    ..selectRentalDate(date)
    ..selectRentalSlot(slot);
}

Future<void> _draftForm(AppState state) async {
  await _draftSchedule(state);
  state.saveRentalForm(
    activityName: 'Festival Tari Topeng Malangan 2026',
    applicantName: 'Yayasan Mekar Sari Malang',
    contact: '0812-3456-7890',
  );
}

Future<void> _draftDocuments(AppState state) async {
  await _draftForm(state);
  state
    ..attachRentalDocument('ktp', fakeFile('ktp.pdf'))
    ..attachRentalDocument('surat', fakeFile('surat-permohonan.pdf'));
}

Future<void> _approvePending(AppState state) =>
    state.simulateAdmin((demo) => demo.approveRental('SG-1026-0020'));

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
  ScreenCase('11-checkout-konfirmasi', AppRoutes.checkoutConfirm, height: 1290),
  ScreenCase(
    '12-checkout-berhasil',
    AppRoutes.checkoutSuccess,
    arguments: 'TKBJ-A1B2C3',
    height: 960,
  ),
  ScreenCase(
    '13-sewa-pilih-venue',
    AppRoutes.rental,
    height: 960,
    prepare: _draftVenue,
  ),
  ScreenCase(
    '14-sewa-cek-jadwal',
    AppRoutes.rentalSchedule,
    height: 1420,
    prepare: _draftSchedule,
  ),
  ScreenCase(
    '15-sewa-formulir',
    AppRoutes.rentalForm,
    height: 1290,
    prepare: _draftForm,
  ),
  ScreenCase(
    '16-sewa-unggah-berkas',
    AppRoutes.rentalDocuments,
    height: 1120,
    prepare: _draftDocuments,
  ),
  ScreenCase(
    '17-sewa-status-verifikasi',
    AppRoutes.rentalStatus,
    arguments: 'SG-1026-0020',
    height: 1440,
  ),
  ScreenCase(
    '18-sewa-ditolak',
    AppRoutes.rentalRejected,
    arguments: 'SG-1026-0012',
    height: 1000,
  ),
  ScreenCase(
    '19-sewa-pembayaran',
    AppRoutes.rentalPayment,
    arguments: 'SG-1026-0020',
    height: 1220,
    prepare: _approvePending,
  ),
  ScreenCase(
    '20-sewa-bukti-reservasi',
    AppRoutes.rentalReceipt,
    arguments: 'SG-1026-0019',
    height: 1020,
  ),
  ScreenCase('21-virtual-galeri', AppRoutes.gallery, height: 960),
  ScreenCase(
    '22-galeri-detail',
    AppRoutes.galleryDetail,
    arguments: 'wayang-semalam-suntuk',
    height: 1080,
  ),
  ScreenCase('23-direktori-komunitas', AppRoutes.communities, height: 1940),
  ScreenCase(
    '24-komunitas-detail',
    AppRoutes.communityDetail,
    arguments: 'mekar-sari',
    height: 1320,
  ),
  ScreenCase('25-daftar-komunitas', AppRoutes.communityRegister, height: 1260),
  ScreenCase('26-edukasi-budaya', AppRoutes.education, height: 1300),
  ScreenCase(
    '27-edukasi-sejarah',
    AppRoutes.educationDetail,
    arguments: EducationArgs('wayang-kulit'),
    height: 1140,
  ),
  ScreenCase(
    '28-edukasi-filosofi',
    AppRoutes.educationDetail,
    arguments: EducationArgs('wayang-kulit', initialTab: 1),
    height: 1240,
  ),
  ScreenCase(
    '29-edukasi-foto-video',
    AppRoutes.educationDetail,
    arguments: EducationArgs('wayang-kulit', initialTab: 2),
    height: 1240,
  ),
  ScreenCase('30-akun-saya', AppRoutes.account, height: 1100),
  ScreenCase('31-tiket-saya', AppRoutes.myTickets, height: 980),
  ScreenCase('32-riwayat-sewa', AppRoutes.rentalHistory, height: 1040),
  ScreenCase('33-edit-profil', AppRoutes.editProfile, height: 1000),
  ScreenCase('34-notifikasi', AppRoutes.notifications, height: 1160),
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
  final appState = state ?? await seededState(signedIn: screen.signedIn);
  await screen.prepare?.call(appState);
  await tester.pumpWidget(TkbjApp(state: appState));
  await tester.pumpAndSettle();
  if (screen.route != AppRoutes.home) {
    tester
        .state<NavigatorState>(find.byType(Navigator).first)
        .pushNamed(screen.route, arguments: screen.arguments);
    await tester.pumpAndSettle();
  }
}
