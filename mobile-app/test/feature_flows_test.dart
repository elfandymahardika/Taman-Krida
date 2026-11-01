import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tkbj_mobile/app.dart';
import 'package:tkbj_mobile/core/utils/formatters.dart';
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

/// Draf sewa lengkap sampai formulir, di slot pertama yang masih tersedia.
Future<(DateTime, RentalSlot)> _draftRental(
  AppState state,
  String activity,
) async {
  state.startRental(facility: pendopo);
  final (date, slot) = await firstAvailableBooking(state, pendopo);
  state
    ..selectRentalDate(date)
    ..selectRentalSlot(slot)
    ..saveRentalForm(
      activityName: activity,
      applicantName: 'SMA Negeri 1 Malang',
      contact: '081234567890',
    );
  return (date, slot);
}

void main() {
  test('format rupiah singkat, waktu relatif, dan ukuran berkas', () {
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
    expect(Formatters.fileSize(1258291), '1,2 MB');
    expect(Formatters.fileSize(344064), '336 KB');
    expect(Formatters.isoDate(DateTime(2026, 6, 3)), '2026-06-03');
  });

  test('alur sewa gedung: ajukan → disetujui → bayar → lunas', () async {
    final state = await signedInState();
    final unreadBefore = state.unreadCount;
    final (date, slot) = await _draftRental(state, 'Pentas Seni Sekolah');
    for (final doc in RentalDocument.all) {
      state.attachRentalDocument(doc.key, fakeFile('${doc.key}.pdf'));
    }

    final request = await state.submitRental();
    expect(request.status, RentalStatus.pending);
    expect(request.documentCount, 3);
    expect(
      request.estimatedCost,
      2500000,
      reason: 'tarif Pendopo per pemakaian',
    );
    // Slot yang sudah diajukan tidak boleh dipesan lagi.
    await state.loadAvailability(pendopo, date);
    expect(state.isSlotTaken(pendopo, date, slot), isTrue);

    await state.simulateAdmin((demo) => demo.approveRental(request.code));
    expect(state.findRental(request.code)!.status, RentalStatus.approved);

    await state.payRental(
      request.code,
      PaymentMethod.virtualAccount,
      fakeFile('bukti.pdf'),
      'SMA Negeri 1 Malang',
    );
    expect(state.findRental(request.code)!.isVerifyingPayment, isTrue);

    await state.simulateAdmin((demo) => demo.confirmPayment(request.code));
    final paid = state.findRental(request.code)!;
    expect(paid.status, RentalStatus.paid);
    expect(paid.paymentMethod, PaymentMethod.virtualAccount);
    // Terkirim, disetujui, lunas.
    expect(state.unreadCount, unreadBefore + 3);
  });

  test('pengajuan ditolak menyimpan catatan admin', () async {
    final state = await signedInState();
    await state.simulateAdmin((demo) => demo.rejectRental('SG-1026-0020'));
    final rental = state.findRental('SG-1026-0020')!;
    expect(rental.status, RentalStatus.rejected);
    expect(rental.adminNote, contains('bentrok'));
    expect(rental.fixes, isNotEmpty);
  });

  testWidgets('unggah berkas wajib lengkap sebelum pengajuan dikirim', (
    tester,
  ) async {
    final state = await signedInState();
    await _draftRental(state, 'Festival Tari');
    await _open(tester, state, AppRoutes.rentalDocuments);

    await _tapText(tester, 'Kirim Pengajuan');
    expect(
      find.text('Unggah KTP Penanggung Jawab terlebih dahulu.'),
      findsOneWidget,
    );

    for (final doc in RentalDocument.all) {
      await _tapText(tester, 'Unggah ${doc.label}');
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
    expect(state.rentals.first.activityName, 'Festival Tari');
  });

  testWidgets('cek jadwal menampilkan slot setelah tanggal dipilih', (
    tester,
  ) async {
    final state = await signedInState();
    state.startRental(facility: pendopo);
    final (date, _) = await firstAvailableBooking(state, pendopo);
    state.selectRentalDate(date);
    await _open(tester, state, AppRoutes.rentalSchedule);

    expect(find.text('Venue dipilih'), findsOneWidget);
    expect(find.textContaining('Slot Waktu'), findsOneWidget);
    expect(find.text('Penuh'), findsWidgets);
  });

  testWidgets('daftar komunitas memvalidasi kategori dan persetujuan', (
    tester,
  ) async {
    final state = await signedInState();
    await _open(tester, state, AppRoutes.communityRegister);
    await _tapText(tester, 'Kirim Pendaftaran');
    expect(find.text('Pilih salah satu kategori.'), findsOneWidget);
    expect(find.text('Persetujuan wajib dicentang.'), findsOneWidget);
    expect(state.communityRegistrations, isEmpty);
  });

  testWidgets('filter galeri menampilkan kategori yang dipilih', (
    tester,
  ) async {
    await _open(tester, demoState(), AppRoutes.gallery);
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
    final state = await signedInState();
    await _open(tester, state, AppRoutes.notifications);
    expect(find.text('2 baru'), findsOneWidget);
    await _tapText(tester, 'Tandai Semua Sudah Dibaca');
    expect(state.unreadCount, 0);
    expect(find.text('2 baru'), findsNothing);
  });
}
