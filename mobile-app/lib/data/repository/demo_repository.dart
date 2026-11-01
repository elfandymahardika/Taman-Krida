import 'dart:math';

import 'package:flutter/material.dart' show DateUtils;

import '../../core/utils/formatters.dart';
import '../api/api_client.dart';
import '../dummy/community_data.dart';
import '../dummy/dummy_data.dart';
import '../dummy/gallery_data.dart';
import '../dummy/notification_data.dart';
import '../models/app_notification.dart';
import '../models/community.dart';
import '../models/cultural_event.dart';
import '../models/facility.dart';
import '../models/gallery_item.dart';
import '../models/rental_request.dart';
import '../models/ticket_order.dart';
import '../models/user_account.dart';
import 'tkbj_repository.dart';

/// Data contoh di memori, tanpa server: dipakai test dan mode presentasi
/// offline (`--dart-define=DEMO_MODE=true`). Aturannya meniru API mobile
/// (status bayar, slot penuh, isolasi akun), dan keputusan admin bisa
/// disimulasikan lewat [approveRental], [rejectRental], [confirmPayment].
class DemoRepository implements TkbjRepository {
  /// [today] bawaan = 1 Juni 2026, tanggal desain prototipe, agar agenda
  /// contoh bulan Juni masih bisa dipesan.
  DemoRepository({DateTime? today})
    : today = DateUtils.dateOnly(today ?? DateTime(2026, 6, 1)),
      _orders = DummyData.seedOrders(),
      _rentals = DummyData.seedRentals(),
      _notifications = NotificationData.seed(DateTime.now());

  final DateTime today;
  final _random = Random();

  final Map<String, (UserAccount, String)> _accounts = {
    DummyData.demoAccount.email: (
      DummyData.demoAccount,
      DummyData.demoPassword,
    ),
  };
  UserAccount? _current;

  final List<TicketOrder> _orders;
  final List<RentalRequest> _rentals;
  final List<CommunityRegistration> _registrations = [];
  final List<AppNotification> _notifications;
  int _notificationSeq = 100;
  int _nextRentalNumber = 21;

  /// Memberi jeda satu microtask, agar perilaku async sama dengan API.
  Future<T> _ok<T>(T value) => Future.value(value);

  UserAccount _requireUser() {
    final user = _current;
    if (user == null) {
      throw const ApiException(401, 'Silakan masuk terlebih dahulu.');
    }
    return user;
  }

  void _notify(
    String symbol,
    String title,
    String body,
    NotificationTarget target, [
    String? targetId,
  ]) {
    _notifications.insert(
      0,
      AppNotification(
        id: 'n${_notificationSeq++}',
        symbol: symbol,
        title: title,
        body: body,
        createdAt: DateTime.now(),
        target: target,
        targetId: targetId,
      ),
    );
  }

  String _randomCode(int length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return List.generate(
      length,
      (_) => chars[_random.nextInt(chars.length)],
    ).join();
  }

  // ------------------------------------------------------------ Publik

  @override
  Future<AppMeta> meta() => _ok(
    AppMeta(
      today: today,
      eventCategories: DummyData.eventCategories,
      communityCategories: CommunityData.registerCategories,
      maxTicketsPerEvent: 4,
      payDeadlineHours: 24,
      bank: 'Bank Jatim',
      account: '0011 2233 4455 (contoh)',
    ),
  );

  @override
  Future<List<CulturalEvent>> events() => _ok(DummyData.events);

  @override
  Future<List<Facility>> facilities() => _ok(DummyData.facilities);

  @override
  Future<List<Community>> communities() => _ok(CommunityData.communities);

  @override
  Future<List<GalleryItem>> gallery() => _ok(GalleryData.items);

  /// Slot penuh: agenda contoh (pola tetap) atau pengajuan sewa yang berlaku.
  bool _slotTaken(Facility facility, DateTime date, RentalSlot slot) {
    final agenda = (date.day + facility.number + slot.index) % 3 == 0;
    final fullDay = (date.day + facility.number * 2 + date.month) % 7 == 0;
    return agenda ||
        fullDay ||
        _rentals.any(
          (r) =>
              r.holdsSchedule &&
              r.facility.id == facility.id &&
              r.slot == slot &&
              DateUtils.isSameDay(r.date, date),
        );
  }

  @override
  Future<Availability> availability(Facility facility, DateTime month) {
    final days = DateUtils.getDaysInMonth(month.year, month.month);
    return _ok({
      for (var d = 1; d <= days; d++)
        Formatters.isoDate(DateTime(month.year, month.month, d)): {
          for (final slot in RentalSlot.values)
            slot: DateTime(month.year, month.month, d).isBefore(today)
                ? SlotState.past
                : _slotTaken(
                    facility,
                    DateTime(month.year, month.month, d),
                    slot,
                  )
                ? SlotState.full
                : SlotState.available,
        },
    });
  }

  // -------------------------------------------------------------- Akun

  @override
  Future<UserAccount?> restoreSession() => _ok(_current);

  @override
  Future<UserAccount> login(String email, String password) async {
    final entry = _accounts[email.trim().toLowerCase()];
    if (entry == null) {
      throw const ApiException(
        401,
        'Email belum terdaftar. Silakan daftar akun baru.',
      );
    }
    if (entry.$2 != password) {
      throw const ApiException(
        401,
        'Kata sandi salah. Periksa kembali kata sandi Anda.',
      );
    }
    return _current = entry.$1;
  }

  @override
  Future<UserAccount> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final key = email.trim().toLowerCase();
    if (_accounts.containsKey(key)) {
      throw const ApiException(400, 'Email sudah terdaftar. Silakan masuk.', {
        'email': 'Email sudah terdaftar. Silakan masuk.',
      });
    }
    final account = UserAccount(
      name: name.trim(),
      email: key,
      phone: phone.trim(),
      memberSince: today.year,
    );
    _accounts[key] = (account, password);
    return _current = account;
  }

  @override
  Future<void> logout() async => _current = null;

  @override
  Future<UserAccount> updateProfile({
    required String name,
    required String email,
    required String phone,
    required String city,
  }) async {
    final current = _requireUser();
    final key = email.trim().toLowerCase();
    final owner = _accounts[key];
    if (owner != null && owner.$1.email != current.email) {
      throw const ApiException(400, 'Email sudah dipakai akun lain.', {
        'email': 'Email sudah dipakai akun lain.',
      });
    }
    final password = _accounts.remove(current.email)!.$2;
    final updated = current.copyWith(
      name: name.trim(),
      email: key,
      phone: phone.trim(),
      city: city.trim(),
    );
    _accounts[key] = (updated, password);
    return _current = updated;
  }

  // ------------------------------------------------------------- Tiket

  @override
  Future<List<TicketOrder>> bookings() async {
    _requireUser();
    return List.of(_orders);
  }

  @override
  Future<TicketOrder> checkout(List<CartLine> lines, BuyerInfo buyer) async {
    _requireUser();
    if (lines.isEmpty) {
      throw const ApiException(400, 'Keranjang tiket masih kosong.');
    }
    final order = TicketOrder(
      bookingCode: 'TKBJ-${_randomCode(6)}',
      buyer: buyer,
      lines: lines,
      createdAt: DateTime.now(),
      payBefore: DateTime.now().add(const Duration(hours: 24)),
    );
    _orders.insert(0, order);
    _notify(
      '⏰',
      'Selesaikan pembayaran tiket',
      'Pesanan ${order.bookingCode} menunggu pembayaran. Unggah bukti '
          'transfer dalam 24 jam.',
      NotificationTarget.tickets,
      order.bookingCode,
    );
    return order;
  }

  TicketOrder _replaceOrder(String code, TicketOrder Function(TicketOrder) f) {
    final index = _orders.indexWhere((o) => o.bookingCode == code);
    if (index < 0) {
      throw const ApiException(404, 'Pesanan tiket tidak ditemukan.');
    }
    return _orders[index] = f(_orders[index]);
  }

  @override
  Future<TicketOrder> payBooking(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async {
    _requireUser();
    return _replaceOrder(code, (o) {
      if (o.status != PaymentStatus.waiting) {
        throw ApiException(
          409,
          o.isPaid
              ? 'Pesanan ini sudah lunas.'
              : 'Bukti transfer sedang diverifikasi admin.',
        );
      }
      return _withStatus(o, PaymentStatus.verifying, method: method);
    });
  }

  TicketOrder _withStatus(
    TicketOrder o,
    PaymentStatus status, {
    PaymentMethod? method,
  }) {
    final paid = status == PaymentStatus.paid;
    return TicketOrder(
      bookingCode: o.bookingCode,
      buyer: o.buyer,
      lines: [
        for (final (i, line) in o.lines.indexed)
          CartLine(
            event: line.event,
            quantity: line.quantity,
            orderId: line.orderId ?? '${o.bookingCode}-${i + 1}',
            ticketCodes: paid
                ? [
                    for (var t = 0; t < line.quantity; t++)
                      '${o.bookingCode.substring(5)}-${i + 1}${String.fromCharCode(65 + t)}',
                  ]
                : const [],
          ),
      ],
      createdAt: o.createdAt,
      status: status,
      method: method ?? o.method,
      paidAt: paid ? DateTime.now() : null,
      payBefore: paid ? null : o.payBefore,
    );
  }

  // -------------------------------------------------------------- Sewa

  @override
  Future<List<RentalRequest>> rentals() async {
    _requireUser();
    return List.of(_rentals);
  }

  @override
  Future<RentalRequest> submitRental(RentalDraft draft) async {
    _requireUser();
    final facility = draft.facility!;
    final missing = [
      for (final doc in RentalDocument.all)
        if (!draft.documents.containsKey(doc.key)) doc,
    ];
    if (missing.isNotEmpty) {
      throw ApiException(400, '${missing.first.label} wajib diunggah.', {
        for (final doc in missing) doc.key: '${doc.label} wajib diunggah.',
      });
    }
    if (_slotTaken(facility, draft.date!, draft.slot!)) {
      throw const ApiException(409, 'Jadwal tidak tersedia.', {
        'slot': 'Slot ini sudah terisi. Pilih slot atau tanggal lain.',
      });
    }
    final now = DateTime.now();
    final request = RentalRequest(
      code:
          'SG-${Formatters.twoDigits(now.month)}${now.year % 100}-'
          '${(_nextRentalNumber++).toString().padLeft(4, '0')}',
      facility: facility,
      activityName: draft.activityName,
      date: draft.date!,
      slot: draft.slot,
      startTime: Formatters.hour(draft.slot!.startHour),
      endTime: Formatters.hour(draft.slot!.endHour),
      applicantName: draft.applicantName,
      contact: draft.contact,
      documentCount: draft.documents.length,
      submittedAt: now,
      amount: facility.rentalRate ?? 0,
    );
    _rentals.insert(0, request);
    _notify(
      '📅',
      'Pengajuan sewa terkirim',
      '${request.code} sedang ditinjau Admin Sewa.',
      NotificationTarget.rental,
      request.code,
    );
    return request;
  }

  RentalRequest _replaceRental(
    String code,
    RentalRequest Function(RentalRequest) f,
  ) {
    final index = _rentals.indexWhere((r) => r.code == code);
    if (index < 0) {
      throw const ApiException(404, 'Pengajuan sewa tidak ditemukan.');
    }
    return _rentals[index] = f(_rentals[index]);
  }

  @override
  Future<RentalRequest> payRental(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async {
    _requireUser();
    return _replaceRental(code, (r) {
      if (r.status != RentalStatus.approved || r.isVerifyingPayment) {
        throw const ApiException(409, 'Tagihan ini tidak menunggu pembayaran.');
      }
      return r.copyWith(
        payment: PaymentStatus.verifying,
        paymentMethod: method,
      );
    });
  }

  // --------------------------------------------------------- Komunitas

  @override
  Future<CommunityRegistration> registerCommunity(
    CommunityRegistration registration,
  ) async {
    _requireUser();
    _registrations.insert(0, registration);
    _notify(
      '👥',
      'Pendaftaran komunitas terkirim',
      '${registration.name} sedang ditinjau pengelola TKBJ.',
      NotificationTarget.communities,
    );
    return registration;
  }

  @override
  Future<List<CommunityRegistration>> myCommunities() async {
    _requireUser();
    return List.of(_registrations);
  }

  // -------------------------------------------------------- Notifikasi

  @override
  Future<List<AppNotification>> notifications() async {
    _requireUser();
    return List.of(_notifications);
  }

  @override
  Future<void> markNotificationRead(String id) async {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index >= 0) _notifications[index] = _notifications[index].markRead();
  }

  @override
  Future<void> markAllNotificationsRead() async {
    for (var i = 0; i < _notifications.length; i++) {
      _notifications[i] = _notifications[i].markRead();
    }
  }

  // ------------------------------------- Simulasi keputusan admin (demo)

  void approveRental(String code) {
    final rental = _replaceRental(
      code,
      (r) => r.copyWith(
        status: RentalStatus.approved,
        payment: PaymentStatus.waiting,
        reviewedAt: DateTime.now(),
      ),
    );
    _notify(
      '✅',
      'Pengajuan sewa disetujui',
      '$code · ${rental.facility.name} disetujui admin. Selesaikan '
          'pembayaran ${Formatters.rupiah(rental.amount)}.',
      NotificationTarget.rental,
      code,
    );
  }

  void rejectRental(String code) {
    final rental = _replaceRental(
      code,
      (r) => r.copyWith(
        status: RentalStatus.rejected,
        reviewedAt: DateTime.now(),
        adminNote: DummyData.rejectionNote(r.date),
        fixes: DummyData.rejectionFixes,
      ),
    );
    _notify(
      '❌',
      'Pengajuan sewa ditolak',
      '${rental.code} ditolak admin. Lihat catatan dan ajukan ulang.',
      NotificationTarget.rental,
      code,
    );
  }

  /// Admin Keuangan menyatakan pembayaran tiket (kode booking) atau
  /// tagihan sewa (kode sewa) lunas.
  void confirmPayment(String code) {
    if (_rentals.any((r) => r.code == code)) {
      _replaceRental(
        code,
        (r) => r.copyWith(
          status: RentalStatus.paid,
          payment: PaymentStatus.paid,
          paidAt: DateTime.now(),
        ),
      );
      _notify(
        '🧾',
        'Pembayaran sewa lunas',
        'Bukti reservasi $code sudah terbit.',
        NotificationTarget.rental,
        code,
      );
      return;
    }
    _replaceOrder(code, (o) => _withStatus(o, PaymentStatus.paid));
    _notify(
      '🎟',
      'Pembayaran tiket dikonfirmasi',
      'E-tiket $code sudah aktif di Tiket Saya.',
      NotificationTarget.tickets,
      code,
    );
  }
}
