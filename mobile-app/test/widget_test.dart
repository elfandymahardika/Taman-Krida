import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tkbj_mobile/app.dart';
import 'package:tkbj_mobile/core/utils/formatters.dart';
import 'package:tkbj_mobile/core/utils/validators.dart';
import 'package:tkbj_mobile/data/datasources/demo/seed/dummy_data.dart';
import 'package:tkbj_mobile/domain/entities/ticket_order.dart';
import 'package:tkbj_mobile/injection.dart';
import 'package:tkbj_mobile/presentation/controllers/controllers.dart';

import 'helpers/screen_harness.dart';

Future<void> _pumpApp(WidgetTester tester, AppContainer state) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(TkbjApp(container: state));
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
  group('Formatters & Validators', () {
    test('format rupiah', () {
      expect(Formatters.rupiah(35000), 'Rp 35.000');
      expect(Formatters.rupiah(14000000), 'Rp 14.000.000');
      expect(Formatters.rupiah(500), 'Rp 500');
    });

    test('validasi email, telepon, dan kata sandi', () {
      expect(Validators.email(''), isNotNull);
      expect(Validators.email('budi@'), isNotNull);
      expect(Validators.email('budi.santoso@email.com'), isNull);
      expect(Validators.phone('12345'), isNotNull);
      expect(Validators.phone('081234567890'), isNull);
      // Sama dengan server: huruf besar, huruf kecil, dan angka.
      expect(Validators.password('Katasandi'), contains('angka'));
      expect(Validators.password('tkbj2026'), contains('huruf besar'));
      expect(Validators.password('TKBJ2026'), contains('huruf kecil'));
      expect(Validators.password('Tkbj2026'), isNull);
    });
  });

  group('AppContainer', () {
    test('login gagal untuk kata sandi salah', () async {
      final state = demoState();
      await state.init();
      expect(
        await state.auth.login(DummyData.demoAccount.email, 'salah123'),
        isNotNull,
      );
      expect(state.auth.isLoggedIn, isFalse);
      expect(
        await state.auth.login(
          DummyData.demoAccount.email,
          DummyData.demoPassword,
        ),
        isNull,
      );
      expect(state.auth.isLoggedIn, isTrue);
      expect(
        state.ticket.orders,
        isNotEmpty,
        reason: 'data akun dimuat setelah login',
      );
    });

    test('jumlah tiket dibatasi 0–4', () async {
      final state = demoState();
      await state.init();
      final id = DummyData.events.first.id;
      state.ticket.setQuantity(id, 9);
      expect(state.ticket.quantityOf(id), TicketController.maxTicketsPerEvent);
      expect(state.ticket.cartTotal, 4 * DummyData.events.first.price);
      state.ticket.setQuantity(id, -1);
      expect(state.ticket.isCartEmpty, isTrue);
    });
  });

  testWidgets('beranda menampilkan sapaan, pintasan, dan acara', (
    tester,
  ) async {
    await _pumpApp(tester, demoState());
    expect(find.text('Taman Krida Budaya Jawa Timur'), findsOneWidget);
    expect(find.text('Lihat Acara'), findsOneWidget);
    expect(find.text('Acara Mendatang'), findsOneWidget);
    expect(find.byType(NavigationBar), findsOneWidget);
  });

  testWidgets('bottom navigation berpindah tab & tombol kembali ke Beranda', (
    tester,
  ) async {
    await _pumpApp(tester, demoState());

    await _tapText(tester, 'Acara');
    expect(find.text('Kalender Acara Budaya'), findsOneWidget);

    await _tapText(tester, 'Jelajah');
    expect(find.text('Direktori Komunitas'), findsOneWidget);

    await _tapText(tester, 'Akun');
    expect(find.text('Anda belum masuk'), findsOneWidget);

    // Tombol kembali sistem di tab lain → kembali ke Beranda.
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text('Acara Mendatang'), findsOneWidget);
  });

  testWidgets('login menampilkan validasi lalu masuk ke Akun Saya', (
    tester,
  ) async {
    final state = demoState();
    await _pumpApp(tester, state);

    await _tapText(tester, 'Akun');
    await _tapText(tester, 'Masuk');
    await _tapText(tester, 'Masuk ke Akun');
    expect(find.text('Alamat email wajib diisi.'), findsOneWidget);
    expect(find.text('Kata sandi wajib diisi.'), findsOneWidget);

    await tester.enterText(
      find.byType(TextFormField).at(0),
      DummyData.demoAccount.email,
    );
    await tester.enterText(find.byType(TextFormField).at(1), 'salah123');
    await _tapText(tester, 'Masuk ke Akun');
    expect(find.textContaining('Kata sandi salah'), findsOneWidget);

    await tester.enterText(
      find.byType(TextFormField).at(1),
      DummyData.demoPassword,
    );
    await _tapText(tester, 'Masuk ke Akun');
    expect(state.auth.isLoggedIn, isTrue);
    expect(find.text('Akun Saya'), findsWidgets);
    expect(find.text(DummyData.demoAccount.name), findsOneWidget);
  });

  testWidgets('pesan tiket: checkout → unggah bukti → diverifikasi → lunas', (
    tester,
  ) async {
    final state = await signedInState();
    await _pumpApp(tester, state);

    await _tapText(tester, 'Pesan Tiket');
    await tester.tap(find.text('+').first);
    await tester.pumpAndSettle();
    expect(find.text('Wayang Kulit (1 Tiket)'), findsOneWidget);

    await _tapText(tester, 'Lanjut ke Pembayaran');
    expect(find.text('Isi Data Pemesan'), findsOneWidget);

    // Form kosong tidak boleh lanjut.
    for (var i = 0; i < 3; i++) {
      await tester.enterText(find.byType(TextFormField).at(i), '');
    }
    await _tapText(tester, 'Lanjutkan Pembayaran →');
    expect(find.text('Nama lengkap wajib diisi.'), findsOneWidget);

    await tester.enterText(find.byType(TextFormField).at(0), 'Siti Rahma');
    await tester.enterText(
      find.byType(TextFormField).at(1),
      'siti.rahma@email.com',
    );
    await tester.enterText(find.byType(TextFormField).at(2), '081298765432');
    await _tapText(tester, 'Lanjutkan Pembayaran →');
    expect(find.text('Pilih Metode Pembayaran Resmi'), findsOneWidget);

    await _tapText(tester, 'Lanjutkan ke Konfirmasi →');
    expect(find.text('Pindai Kode QRIS'), findsOneWidget);

    // Bukti pembayaran wajib diunggah sebelum dikirim.
    await _tapText(tester, 'Pesan & Kirim Bukti Pembayaran →');
    expect(
      find.text('Unggah bukti pembayaran terlebih dahulu.'),
      findsOneWidget,
    );
    expect(
      state.ticket.orders.where((o) => o.buyer.name == 'Siti Rahma'),
      isEmpty,
    );

    await _tapText(tester, 'Unggah Bukti Pembayaran');
    await _tapText(tester, 'Pesan & Kirim Bukti Pembayaran →');
    expect(find.text('Bukti Pembayaran Terkirim'), findsOneWidget);
    final order = state.ticket.orders.first;
    expect(order.buyer.name, 'Siti Rahma');
    expect(order.status, PaymentStatus.verifying);
    expect(state.ticket.isCartEmpty, isTrue);

    // Admin Keuangan memverifikasi (disimulasikan pada mode demo).
    await _tapText(tester, 'Simulasi: Admin Verifikasi Lunas');
    expect(find.text('Pembayaran Berhasil!'), findsOneWidget);
    expect(find.text(order.bookingCode), findsOneWidget);
    expect(state.ticket.findOrder(order.bookingCode)!.isPaid, isTrue);
  });

  testWidgets('checkout tanpa login diarahkan ke halaman Masuk', (
    tester,
  ) async {
    final state = demoState();
    await _pumpApp(tester, state);
    await _tapText(tester, 'Pesan Tiket');
    await tester.tap(find.text('+').first);
    await tester.pumpAndSettle();
    await _tapText(tester, 'Lanjut ke Pembayaran');
    expect(find.text('Masuk ke Akun'), findsOneWidget);
  });
}
