import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tkbj_mobile/app.dart';
import 'package:tkbj_mobile/core/utils/formatters.dart';
import 'package:tkbj_mobile/data/dummy/dummy_data.dart';
import 'package:tkbj_mobile/data/models/rental_request.dart';
import 'package:tkbj_mobile/data/models/ticket_order.dart';
import 'package:tkbj_mobile/routes/app_routes.dart';
import 'package:tkbj_mobile/state/app_state.dart';
import 'package:tkbj_mobile/widgets/interactive/chip_filter.dart';

import 'helpers/screen_harness.dart';

Future<void> _open(WidgetTester tester, AppState state, String route) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(TkbjApp(state: state));
  await tester.pumpAndSettle();
  tester.state<NavigatorState>(find.byType(Navigator).first).pushNamed(route);
  await tester.pumpAndSettle();
}

Future<void> _tapText(WidgetTester tester, String text) async {
  final finder = find.text(text).last;
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  test('format rupiah singkat & waktu relatif', () {
    expect(Formatters.rupiahShort(3500000), 'Rp 3,5 jt');
    expect(Formatters.rupiahShort(2000000), 'Rp 2 jt');
    final now = DateTime(2026, 10, 11, 12);
    expect(Formatters.relative(now, now: now), 'Baru saja');
    expect(
      Formatters.relative(now.subtract(const Duration(hours: 2)), now: now),
      '2 jam lalu',
    );
    expect(
      Formatters.relative(now.subtract(const Duration(days: 1)), now: now),
      'Kemarin',
    );
  });

  test('alur sewa gedung: ajukan → disetujui → bayar', () {
    final state = AppState();
    final unreadBefore = state.unreadCount;
    state.startRental(facility: pendopo);
    final (date, slot) = firstAvailableBooking(state, pendopo);
    state
      ..selectRentalDate(date)
      ..selectRentalSlot(slot)
      ..saveRentalForm(
        activityName: 'Pentas Seni Sekolah',
        applicantName: 'SMA Negeri 1 Malang',
        contact: '081234567890',
      );
    for (final label in DummyData.rentalDocuments) {
      state.attachRentalDocument(label);
    }

    final request = state.submitRental();
    expect(request.status, RentalStatus.pending);
    expect(request.documentCount, 3);
    expect(request.estimatedCost, 3500000 * 4);
    // Slot yang sudah diajukan tidak boleh dipesan lagi.
    expect(state.isSlotTaken(pendopo, date, slot), isTrue);

    state.approveRental(request.code);
    expect(state.findRental(request.code)!.status, RentalStatus.approved);
    state.payRental(request.code, PaymentMethod.virtualAccount);
    expect(state.findRental(request.code)!.status, RentalStatus.paid);
    expect(state.unreadCount, unreadBefore + 2);
  });

  test('pengajuan ditolak menyimpan catatan admin', () {
    final state = AppState();
    state.rejectRental('SG-1026-0020');
    final rental = state.findRental('SG-1026-0020')!;
    expect(rental.status, RentalStatus.rejected);
    expect(rental.adminNote, contains('bentrok'));
    expect(rental.fixes, isNotEmpty);
  });

  testWidgets('unggah berkas wajib lengkap sebelum pengajuan dikirim', (
    tester,
  ) async {
    final state = AppState()..startRental(facility: pendopo);
    final (date, slot) = firstAvailableBooking(state, pendopo);
    state
      ..selectRentalDate(date)
      ..selectRentalSlot(slot)
      ..saveRentalForm(
        activityName: 'Festival Tari',
        applicantName: 'Yayasan Mekar Sari',
        contact: '081234567890',
      );
    await _open(tester, state, AppRoutes.rentalDocuments);

    await _tapText(tester, 'Kirim Pengajuan');
    expect(
      find.text('Unggah KTP Penanggung Jawab terlebih dahulu.'),
      findsOneWidget,
    );

    for (final label in DummyData.rentalDocuments) {
      await _tapText(tester, 'Unggah $label');
    }
    await _tapText(tester, 'Kirim Pengajuan');
    expect(find.text('Centang pernyataan untuk melanjutkan.'), findsOneWidget);

    await _tapText(
      tester,
      'Saya menyatakan data dan dokumen yang diunggah adalah benar dan dapat '
      'dipertanggungjawabkan.',
    );
    await _tapText(tester, 'Kirim Pengajuan');
    expect(find.text('Pengajuan Terkirim'), findsOneWidget);
    expect(state.rentals.first.status, RentalStatus.pending);
  });

  testWidgets('cek jadwal menampilkan slot setelah tanggal dipilih', (
    tester,
  ) async {
    final state = AppState()..startRental(facility: pendopo);
    final (date, _) = firstAvailableBooking(state, pendopo);
    state.selectRentalDate(date);
    await _open(tester, state, AppRoutes.rentalSchedule);

    expect(find.text('Venue dipilih'), findsOneWidget);
    expect(find.textContaining('Slot Waktu'), findsOneWidget);
    expect(find.text('Penuh'), findsWidgets);
  });

  testWidgets('daftar komunitas memvalidasi kategori dan persetujuan', (
    tester,
  ) async {
    final state = AppState();
    await _open(tester, state, AppRoutes.communityRegister);
    await _tapText(tester, 'Kirim Pendaftaran');
    expect(find.text('Pilih salah satu kategori.'), findsOneWidget);
    expect(find.text('Persetujuan wajib dicentang.'), findsOneWidget);
    expect(state.communityRegistrations, isEmpty);
  });

  testWidgets('filter galeri menampilkan kategori yang dipilih', (
    tester,
  ) async {
    await _open(tester, AppState(), AppRoutes.gallery);
    expect(find.text('Seni Wayang Semalam Suntuk'), findsOneWidget);
    final chip = find.widgetWithText(ChipFilter, 'Fasilitas');
    await tester.ensureVisible(chip);
    await tester.pumpAndSettle();
    await tester.tap(chip);
    await tester.pumpAndSettle();
    expect(find.text('Seni Wayang Semalam Suntuk'), findsNothing);
    expect(find.text('Gamelan Slendro Pelog'), findsOneWidget);
  });

  testWidgets('tandai semua notifikasi sudah dibaca', (tester) async {
    final state = AppState()
      ..login(DummyData.demoAccount.email, DummyData.demoAccount.password);
    await _open(tester, state, AppRoutes.notifications);
    expect(find.text('2 baru'), findsOneWidget);
    await _tapText(tester, 'Tandai Semua Sudah Dibaca');
    expect(state.unreadCount, 0);
    expect(find.text('2 baru'), findsNothing);
  });
}
