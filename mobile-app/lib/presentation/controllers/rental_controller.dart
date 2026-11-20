import 'package:flutter/material.dart';

import '../../core/error/failure.dart';
import '../../core/utils/formatters.dart';
import '../../domain/entities/app_meta.dart';
import '../../domain/entities/facility.dart';
import '../../domain/entities/rental_request.dart';
import '../../domain/entities/ticket_order.dart';
import '../../domain/entities/user_account.dart';
import '../../domain/usecases/rental_usecases.dart';
import 'account_data_controller.dart';
import 'catalog_controller.dart';
import 'notification_controller.dart';

/// Sewa gedung: draf 5 langkah, kalender ketersediaan, dan pengajuan milik
/// akun.
class RentalController extends ChangeNotifier implements AccountDataController {
  RentalController({
    required this._getRentals,
    required this._submitRental,
    required this._payRental,
    required this._getAvailability,
    required this._catalog,
    required this._notifications,
    required this._currentUser,
  }) {
    // "Hari ini" dari server menentukan tanggal yang sudah lewat.
    _catalog.addListener(notifyListeners);
  }

  final GetRentalsUseCase _getRentals;
  final SubmitRentalUseCase _submitRental;
  final PayRentalUseCase _payRental;
  final GetAvailabilityUseCase _getAvailability;
  final CatalogController _catalog;
  final NotificationController _notifications;

  /// Akun login, untuk mengisi nama & kontak pemohon secara otomatis.
  final UserAccount? Function() _currentUser;

  List<RentalRequest> _rentals = [];
  RentalDraft _draft = RentalDraft();

  List<RentalRequest> get rentals => List.unmodifiable(_rentals);
  RentalDraft get draft => _draft;

  RentalRequest? findRental(String code) {
    for (final rental in _rentals) {
      if (rental.code == code) return rental;
    }
    return null;
  }

  void _putRental(RentalRequest rental) {
    _rentals = [
      rental,
      for (final r in _rentals)
        if (r.code != rental.code) r,
    ];
  }

  // ------------------------------------------------------- Draf 5 langkah

  /// Memulai pengajuan baru (langkah 1). [facility] dari denah/ajukan ulang.
  void startRental({Facility? facility, String activityName = ''}) {
    final user = _currentUser();
    _draft = RentalDraft()
      ..facility = facility
      ..activityName = activityName
      ..applicantName = user?.name ?? ''
      ..contact = user?.phone ?? '';
    notifyListeners();
  }

  void selectVenue(Facility facility) {
    if (_draft.facility?.id != facility.id) {
      _draft
        ..facility = facility
        ..date = null
        ..slot = null;
    }
    notifyListeners();
  }

  void selectDate(DateTime date) {
    _draft
      ..date = DateUtils.dateOnly(date)
      ..slot = null;
    notifyListeners();
  }

  void selectSlot(RentalSlot slot) {
    _draft.slot = slot;
    notifyListeners();
  }

  void saveForm({
    required String activityName,
    required String applicantName,
    required String contact,
  }) {
    _draft
      ..activityName = activityName.trim()
      ..applicantName = applicantName.trim()
      ..contact = contact.trim();
    notifyListeners();
  }

  /// Simpan berkas yang dipilih untuk dokumen [key] (ktp/surat/proposal).
  void attachDocument(String key, UploadedFile file) {
    _draft.documents[key] = file;
    notifyListeners();
  }

  // --------------------------------------------- Kalender ketersediaan

  final Map<String, Availability> _availability = {};
  final Set<String> _availabilityLoading = {};

  String _availabilityKey(Facility facility, DateTime month) =>
      '${facility.id}|${month.year}-${month.month}';

  bool isAvailabilityLoading(Facility facility, DateTime month) =>
      _availabilityLoading.contains(_availabilityKey(facility, month));

  /// Muat ketersediaan satu bulan (sekali, kecuali [force]).
  Future<void> loadAvailability(
    Facility facility,
    DateTime month, {
    bool force = false,
  }) async {
    final key = _availabilityKey(facility, month);
    if (_availabilityLoading.contains(key)) return;
    if (!force && _availability.containsKey(key)) return;
    _availabilityLoading.add(key);
    notifyListeners();
    try {
      _availability[key] = await _getAvailability(facility, month);
    } on Failure {
      // Kalender tetap bisa dipakai; server menolak slot penuh saat dikirim.
    }
    _availabilityLoading.remove(key);
    notifyListeners();
  }

  SlotState slotState(Facility facility, DateTime date, RentalSlot slot) {
    if (isDatePast(date)) return SlotState.past;
    final month = _availability[_availabilityKey(facility, date)];
    return month?[Formatters.isoDate(date)]?[slot] ?? SlotState.available;
  }

  /// Slot dipakai acara atau pengajuan sewa lain.
  bool isSlotTaken(Facility facility, DateTime date, RentalSlot slot) =>
      slotState(facility, date, slot) == SlotState.full;

  /// Tanggal penuh: semua slot terpakai.
  bool isDateFull(Facility facility, DateTime date) =>
      RentalSlot.values.every((slot) => isSlotTaken(facility, date, slot));

  bool isDatePast(DateTime date) =>
      DateUtils.dateOnly(date).isBefore(_catalog.today);

  // ------------------------------------------------------- Kirim & bayar

  /// Kirim pengajuan + 3 berkas. Melempar `Failure` bila ditolak (mis. slot
  /// baru saja diambil orang lain).
  Future<RentalRequest> submit() async {
    final draft = _draft;
    final request = await _submitRental(draft);
    _putRental(request);
    _availability.removeWhere(
      (key, _) => key.startsWith('${draft.facility!.id}|'),
    );
    _draft = RentalDraft();
    notifyListeners();
    _catalog.refreshEvents();
    _notifications.refreshQuietly();
    return request;
  }

  /// Unggah bukti pembayaran tagihan sewa → "Sedang diverifikasi".
  Future<RentalRequest> pay(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async {
    final rental = await _payRental(code, method, proof, sender);
    _putRental(rental);
    notifyListeners();
    return rental;
  }

  @override
  Future<void> load() async {
    _rentals = await _getRentals();
    notifyListeners();
  }

  @override
  void clear() {
    _rentals = [];
    notifyListeners();
  }

  @override
  void dispose() {
    _catalog.removeListener(notifyListeners);
    super.dispose();
  }
}
