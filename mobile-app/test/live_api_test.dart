// Uji aplikasi terhadap backend sungguhan (backend/mobile-app + dashboard).
// Dilewati kecuali alamat server diisi, mis. (PowerShell):
//   $env:TKBJ_API_URL='http://localhost:5001/api'
//   $env:TKBJ_ADMIN_URL='http://localhost:5000/api'
//   flutter test test/live_api_test.dart
// Gunakan database berisi data contoh (npm run seed di kedua backend):
// test ini membuat pesanan, pengajuan sewa, dan pendaftaran komunitas baru.
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tkbj_mobile/core/error/failure.dart';
import 'package:tkbj_mobile/data/datasources/demo/seed/dummy_data.dart';
import 'package:tkbj_mobile/data/datasources/remote/api_client.dart';
import 'package:tkbj_mobile/domain/entities/community.dart';
import 'package:tkbj_mobile/domain/entities/rental_request.dart';
import 'package:tkbj_mobile/domain/entities/ticket_order.dart';
import 'package:tkbj_mobile/injection.dart';
import 'package:tkbj_mobile/presentation/controllers/controllers.dart';

import 'helpers/screen_harness.dart';

final _apiUrl = Platform.environment['TKBJ_API_URL'];
final _adminUrl = Platform.environment['TKBJ_ADMIN_URL'];

/// Keputusan admin lewat API dashboard (login sebagai Administrator utama).
class _Admin {
  String? _token;

  Future<Map<String, dynamic>> post(String path, [Object? body]) async {
    _token ??=
        (jsonDecode(
              (await http.post(
                Uri.parse('$_adminUrl/auth/login'),
                headers: {'content-type': 'application/json'},
                body: jsonEncode({'username': 'admin', 'password': 'admin123'}),
              )).body,
            ) as Map)['token']
            as String;
    final res = await http.post(
      Uri.parse('$_adminUrl$path'),
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer $_token',
      },
      body: jsonEncode(body ?? {}),
    );
    expect(res.statusCode, 200, reason: '$path → ${res.body}');
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}

AppContainer _liveState() => AppContainer.api(
  client: ApiClient(baseUrl: _apiUrl),
  pickFile: fakePick,
);

void main() {
  final skip = _apiUrl == null || _adminUrl == null
      ? 'Isi TKBJ_API_URL & TKBJ_ADMIN_URL untuk menguji server sungguhan.'
      : null;
  final admin = _Admin();

  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('data publik dari server', () async {
    final state = _liveState();
    await state.init();
    expect(
      state.catalog.loadState,
      LoadState.ready,
      reason: state.catalog.error,
    );
    expect(state.catalog.today, DateTime(2026, 10, 2));
    expect(state.catalog.events, isNotEmpty);
    expect(state.catalog.eventById('topeng')!.category, 'Tari');
    final pendopo = state.catalog.facilityById('pendopo')!;
    expect(pendopo.rentalRate, 2500000);
    expect(pendopo.mapPosition, isNotNull);
    expect(state.catalog.facilityById('loket')!.isRentable, isFalse);
    expect(state.catalog.gallery, isNotEmpty);
    expect(state.catalog.communities.map((c) => c.id), contains('asmorobangun'));
    expect(
      state.catalog.communityCategories,
      contains('Seni tari tradisional'),
    );

    await state.rental.loadAvailability(pendopo, DateTime(2026, 10));
    expect(
      state.rental.isSlotTaken(
        pendopo,
        DateTime(2026, 10, 10),
        RentalSlot.evening,
      ),
      isTrue,
    );
    expect(state.rental.isDatePast(DateTime(2026, 10, 1)), isTrue);
  }, skip: skip);

  test('login, sesi tersimpan, dan data akun demo', () async {
    final state = _liveState();
    await state.init();
    expect(
      await state.auth.login('budi.santoso@email.com', 'salah1234'),
      isNotNull,
    );
    expect(
      await state.auth.login(
        DummyData.demoAccount.email,
        DummyData.demoPassword,
      ),
      isNull,
    );
    expect(
      state.ticket.findOrder('TKBJ-A1B2C3')!.status,
      PaymentStatus.verifying,
    );
    expect(
      state.rental.findRental('SG-1026-0017')!.status,
      RentalStatus.approved,
    );
    expect(state.notification.notifications, isNotEmpty);

    // Aplikasi dibuka ulang: token dari SharedPreferences dipakai lagi.
    final reopened = _liveState();
    await reopened.init();
    expect(reopened.auth.currentUser?.email, DummyData.demoAccount.email);
    await reopened.auth.logout();
    final afterLogout = _liveState();
    await afterLogout.init();
    expect(afterLogout.auth.isLoggedIn, isFalse);
  }, skip: skip);

  test('tiket: checkout → bukti → admin verifikasi → e-tiket', () async {
    final state = _liveState();
    await state.init();
    await state.auth.login(DummyData.demoAccount.email, DummyData.demoPassword);
    state.ticket
      ..setQuantity('topeng', 2)
      ..saveBuyer(
        const BuyerInfo(
          name: 'Budi Santoso',
          email: 'budi.santoso@email.com',
          phone: '081234567890',
        ),
      );
    final order = await state.ticket.placeOrder();
    expect(order.status, PaymentStatus.waiting);
    expect(order.total, 100000);

    final sent = await state.ticket.payBooking(
      order.bookingCode,
      PaymentMethod.qris,
      fakeFile('bukti-qris.pdf'),
      'Budi Santoso',
    );
    expect(sent.status, PaymentStatus.verifying);

    await admin.post('/orders/${order.lines.single.orderId}/verify');
    await state.auth.refreshAccount();
    final paid = state.ticket.findOrder(order.bookingCode)!;
    expect(paid.status, PaymentStatus.paid);
    expect(paid.lines.single.ticketCodes, hasLength(2));
    expect(
      state.notification.notifications.map((n) => n.title),
      contains('Pembayaran tiket dikonfirmasi'),
    );
  }, skip: skip);

  test('sewa: ajukan + berkas → disetujui → bayar → lunas', () async {
    final state = _liveState();
    await state.init();
    await state.auth.login(DummyData.demoAccount.email, DummyData.demoPassword);
    final pendopo = state.catalog.facilityById('pendopo')!;
    final date = DateTime(2026, 10, 27);
    await state.rental.loadAvailability(pendopo, date);
    final slot = RentalSlot.values.firstWhere(
      (s) => !state.rental.isSlotTaken(pendopo, date, s),
    );
    state.rental
      ..startRental(facility: pendopo)
      ..selectDate(date)
      ..selectSlot(slot)
      ..saveForm(
        activityName: 'Pentas Tari Anak Malang',
        applicantName: 'Sanggar Budi',
        contact: '081234567890',
      );
    for (final doc in RentalDocument.all) {
      state.rental.attachDocument(doc.key, fakeFile('${doc.key}.pdf'));
    }
    final request = await state.rental.submit();
    expect(request.status, RentalStatus.pending);
    expect(request.documentCount, 3);
    expect(request.facility.id, 'pendopo');

    await admin.post('/rentals/${request.code}/approve');
    await state.auth.refreshAccount();
    expect(
      state.rental.findRental(request.code)!.status,
      RentalStatus.approved,
    );

    await state.rental.pay(
      request.code,
      PaymentMethod.virtualAccount,
      fakeFile('bukti-va.pdf'),
      'Sanggar Budi',
    );
    expect(state.rental.findRental(request.code)!.isVerifyingPayment, isTrue);

    await admin.post('/orders/${request.code}/verify');
    await state.auth.refreshAccount();
    final paid = state.rental.findRental(request.code)!;
    expect(paid.status, RentalStatus.paid);
    expect(paid.paymentMethod, PaymentMethod.virtualAccount);
  }, skip: skip);

  test('daftarkan komunitas → menunggu persetujuan admin', () async {
    final state = _liveState();
    await state.init();
    await state.auth.login(DummyData.demoAccount.email, DummyData.demoPassword);
    await state.community.register(
      CommunityRegistration(
        name: 'Sanggar Karawitan Uji Coba',
        category: state.catalog.communityCategories[2],
        leader: 'Budi Santoso',
        phone: '081234567890',
        address: 'Jl. Soekarno-Hatta No. 7, Malang',
        description: 'Komunitas karawitan yang berlatih rutin setiap pekan.',
        submittedAt: DateTime.now(),
      ),
    );
    expect(state.community.registrations.first.status, 'Menunggu persetujuan');
    // Validasi server tetap berlaku walau aplikasi dilewati.
    expect(
      () => state.community.register(
        CommunityRegistration(
          name: 'X',
          category: 'Tari',
          leader: 'Budi',
          phone: '1',
          address: 'Malang',
          description: 'pendek',
          submittedAt: DateTime.now(),
        ),
      ),
      throwsA(
        isA<Failure>().having((e) => e.type, 'type', FailureType.validation),
      ),
    );
  }, skip: skip);
}
