import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tkbj_mobile/app.dart';
import 'package:tkbj_mobile/core/utils/formatters.dart';
import 'package:tkbj_mobile/core/utils/validators.dart';
import 'package:tkbj_mobile/data/dummy/dummy_data.dart';
import 'package:tkbj_mobile/state/app_state.dart';

Future<void> _pumpApp(WidgetTester tester, AppState state) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(TkbjApp(state: state));
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

    test('validasi email dan telepon', () {
      expect(Validators.email(''), isNotNull);
      expect(Validators.email('budi@'), isNotNull);
      expect(Validators.email('budi.santoso@email.com'), isNull);
      expect(Validators.phone('12345'), isNotNull);
      expect(Validators.phone('081234567890'), isNull);
    });
  });

  group('AppState', () {
    test('login gagal untuk kata sandi salah', () {
      final state = AppState();
      expect(state.login(DummyData.demoAccount.email, 'salah123'), isNotNull);
      expect(state.isLoggedIn, isFalse);
      expect(
        state.login(
          DummyData.demoAccount.email,
          DummyData.demoAccount.password,
        ),
        isNull,
      );
      expect(state.isLoggedIn, isTrue);
    });

    test('jumlah tiket dibatasi 0–4', () {
      final state = AppState();
      final id = DummyData.events.first.id;
      state.setQuantity(id, 9);
      expect(state.quantityOf(id), AppState.maxTicketsPerEvent);
      expect(state.cartTotal, 4 * DummyData.events.first.price);
      state.setQuantity(id, -1);
      expect(state.isCartEmpty, isTrue);
    });
  });

  testWidgets('beranda menampilkan hero dan fitur utama', (tester) async {
    await _pumpApp(tester, AppState());
    expect(find.text('Taman Krida Budaya Jawa Timur'), findsOneWidget);
    expect(find.text('Lihat Kalender Acara'), findsOneWidget);
    expect(find.text('Fitur Utama'), findsOneWidget);
  });

  testWidgets('login menampilkan validasi lalu masuk ke Akun Saya', (
    tester,
  ) async {
    final state = AppState();
    await _pumpApp(tester, state);

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
      DummyData.demoAccount.password,
    );
    await _tapText(tester, 'Masuk ke Akun');
    expect(state.isLoggedIn, isTrue);
    expect(find.text('Akun Saya'), findsWidgets);
    expect(find.text(DummyData.demoAccount.name), findsOneWidget);
  });

  testWidgets('alur pesan tiket sampai pembayaran berhasil', (tester) async {
    final state = AppState();
    await _pumpApp(tester, state);

    await _tapText(tester, 'Pesan Tiket');
    await tester.tap(find.text('+').first);
    await tester.pumpAndSettle();
    expect(find.text('Wayang Kulit (1 Tiket)'), findsOneWidget);

    await _tapText(tester, 'Lanjut ke Pembayaran');
    expect(find.text('Isi Data Pemesan'), findsOneWidget);

    // Form kosong tidak boleh lanjut.
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

    await _tapText(tester, 'Konfirmasi Selesai →');
    expect(find.text('Pembayaran Berhasil!'), findsOneWidget);
    expect(state.orders.first.buyer.name, 'Siti Rahma');
    expect(find.text(state.orders.first.bookingCode), findsOneWidget);
    expect(state.isCartEmpty, isTrue);
  });
}
