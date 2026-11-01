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
import 'package:tkbj_mobile/data/api/api_client.dart';
import 'package:tkbj_mobile/data/dummy/dummy_data.dart';
import 'package:tkbj_mobile/data/models/community.dart';
import 'package:tkbj_mobile/data/models/rental_request.dart';
import 'package:tkbj_mobile/data/models/ticket_order.dart';
import 'package:tkbj_mobile/data/repository/api_repository.dart';
import 'package:tkbj_mobile/state/app_state.dart';

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

AppState _liveState() => AppState(
  repository: ApiRepository(client: ApiClient(baseUrl: _apiUrl)),
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
    expect(state.catalogState, LoadState.ready, reason: state.catalogError);
    expect(state.today, DateTime(2026, 10, 2));
    expect(state.events, isNotEmpty);
    expect(state.eventById('topeng')!.category, 'Tari');
    final pendopo = state.facilityById('pendopo')!;
    expect(pendopo.rentalRate, 2500000);
    expect(pendopo.mapPosition, isNotNull);
    expect(state.facilityById('loket')!.isRentable, isFalse);
    expect(state.gallery, isNotEmpty);
    expect(state.communities.map((c) => c.id), contains('mekar'));
    expect(state.communityCategories, contains('Seni tari tradisional'));

    await state.loadAvailability(pendopo, DateTime(2026, 10));
    expect(
      state.isSlotTaken(pendopo, DateTime(2026, 10, 10), RentalSlot.evening),
      isTrue,
    );
    expect(state.isDatePast(DateTime(2026, 10, 1)), isTrue);
  }, skip: skip);

  test('login, sesi tersimpan, dan data akun demo', () async {
    final state = _liveState();
    await state.init();
    expect(await state.login('budi.santoso@email.com', 'salah1234'), isNotNull);
    expect(
      await state.login(DummyData.demoAccount.email, DummyData.demoPassword),
      isNull,
    );
    expect(state.findOrder('TKBJ-A1B2C3')!.status, PaymentStatus.verifying);
    expect(state.findRental('SG-1026-0017')!.status, RentalStatus.approved);
    expect(state.notifications, isNotEmpty);

    // Aplikasi dibuka ulang: token dari SharedPreferences dipakai lagi.
    final reopened = _liveState();
    await reopened.init();
    expect(reopened.currentUser?.email, DummyData.demoAccount.email);
    await reopened.logout();
    final afterLogout = _liveState();
    await afterLogout.init();
    expect(afterLogout.isLoggedIn, isFalse);
  }, skip: skip);

  test('tiket: checkout → bukti → admin verifikasi → e-tiket', () async {
    final state = _liveState();
    await state.init();
    await state.login(DummyData.demoAccount.email, DummyData.demoPassword);
    state
      ..setQuantity('topeng', 2)
      ..saveBuyer(
        const BuyerInfo(
          name: 'Budi Santoso',
          email: 'budi.santoso@email.com',
          phone: '081234567890',
        ),
      );
    final order = await state.placeOrder();
    expect(order.status, PaymentStatus.waiting);
    expect(order.total, 100000);

    final sent = await state.payBooking(
      order.bookingCode,
      PaymentMethod.qris,
      fakeFile('bukti-qris.pdf'),
      'Budi Santoso',
    );
    expect(sent.status, PaymentStatus.verifying);

    await admin.post('/orders/${order.lines.single.orderId}/verify');
    await state.refreshAccount();
    final paid = state.findOrder(order.bookingCode)!;
    expect(paid.status, PaymentStatus.paid);
    expect(paid.lines.single.ticketCodes, hasLength(2));
    expect(
      state.notifications.map((n) => n.title),
      contains('Pembayaran tiket dikonfirmasi'),
    );
  }, skip: skip);

  test('sewa: ajukan + berkas → disetujui → bayar → lunas', () async {
    final state = _liveState();
    await state.init();
    await state.login(DummyData.demoAccount.email, DummyData.demoPassword);
    final pendopo = state.facilityById('pendopo')!;
    final date = DateTime(2026, 10, 27);
    await state.loadAvailability(pendopo, date);
    final slot = RentalSlot.values.firstWhere(
      (s) => !state.isSlotTaken(pendopo, date, s),
    );
    state
      ..startRental(facility: pendopo)
      ..selectRentalDate(date)
      ..selectRentalSlot(slot)
      ..saveRentalForm(
        activityName: 'Pentas Tari Anak Malang',
        applicantName: 'Sanggar Budi',
        contact: '081234567890',
      );
    for (final doc in RentalDocument.all) {
      state.attachRentalDocument(doc.key, fakeFile('${doc.key}.pdf'));
    }
    final request = await state.submitRental();
    expect(request.status, RentalStatus.pending);
    expect(request.documentCount, 3);
    expect(request.facility.id, 'pendopo');

    await admin.post('/rentals/${request.code}/approve');
    await state.refreshAccount();
    expect(state.findRental(request.code)!.status, RentalStatus.approved);

    await state.payRental(
      request.code,
      PaymentMethod.virtualAccount,
      fakeFile('bukti-va.pdf'),
      'Sanggar Budi',
    );
    expect(state.findRental(request.code)!.isVerifyingPayment, isTrue);

    await admin.post('/orders/${request.code}/verify');
    await state.refreshAccount();
    final paid = state.findRental(request.code)!;
    expect(paid.status, RentalStatus.paid);
    expect(paid.paymentMethod, PaymentMethod.virtualAccount);
  }, skip: skip);

  test('daftarkan komunitas → menunggu persetujuan admin', () async {
    final state = _liveState();
    await state.init();
    await state.login(DummyData.demoAccount.email, DummyData.demoPassword);
    await state.registerCommunity(
      CommunityRegistration(
        name: 'Sanggar Karawitan Uji Coba',
        category: state.communityCategories[2],
        leader: 'Budi Santoso',
        phone: '081234567890',
        address: 'Jl. Soekarno-Hatta No. 7, Malang',
        description: 'Komunitas karawitan yang berlatih rutin setiap pekan.',
        submittedAt: DateTime.now(),
      ),
    );
    expect(state.communityRegistrations.first.status, 'Menunggu persetujuan');
    // Validasi server tetap berlaku walau aplikasi dilewati.
    expect(
      () => state.registerCommunity(
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
      throwsA(isA<ApiException>().having((e) => e.status, 'status', 400)),
    );
  }, skip: skip);
}
