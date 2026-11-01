import 'package:flutter/material.dart';

import '../core/utils/file_pick.dart';
import '../core/utils/formatters.dart';
import '../data/api/api_client.dart';
import '../data/models/app_notification.dart';
import '../data/models/community.dart';
import '../data/models/cultural_event.dart';
import '../data/models/facility.dart';
import '../data/models/gallery_item.dart';
import '../data/models/rental_request.dart';
import '../data/models/ticket_order.dart';
import '../data/models/user_account.dart';
import '../data/repository/demo_repository.dart';
import '../data/repository/tkbj_repository.dart';

/// Keadaan pemuatan data dari server.
enum LoadState { idle, loading, ready, error }

/// State aplikasi: data publik (acara, fasilitas, komunitas, galeri), sesi
/// login, keranjang tiket, pesanan, pengajuan sewa, pendaftaran komunitas,
/// dan notifikasi. Data diambil & disimpan lewat [repository]
/// (API backend/mobile-app, atau data contoh pada mode demo/test).
class AppState extends ChangeNotifier {
  AppState({TkbjRepository? repository, FilePick? pickFile})
    : repository = repository ?? TkbjRepository.fromEnvironment(),
      pickFile = pickFile ?? pickWithSystemPicker;

  final TkbjRepository repository;

  /// Pemilih berkas (dokumen sewa, bukti transfer).
  final FilePick pickFile;

  /// Batas tiket per acara di aplikasi (server mengizinkan hingga batas
  /// Pengaturan dashboard, mana yang lebih kecil).
  static const maxTicketsPerEvent = 4;

  /// Mode demo tanpa server: keputusan admin bisa disimulasikan.
  bool get canSimulateAdmin => repository is DemoRepository;

  Future<void>? _init;

  /// Muat data publik lalu pulihkan sesi login. Aman dipanggil berulang.
  Future<void> init() => _init ??= _bootstrap();

  Future<void> _bootstrap() async {
    await loadCatalog();
    try {
      final user = await repository.restoreSession();
      if (user != null) {
        _currentUser = user;
        notifyListeners();
        await refreshAccount();
      }
    } on ApiException {
      // Server tidak bisa dihubungi: tetap jalan sebagai tamu.
    }
  }

  // ---------------------------------------------------------- Data publik

  LoadState catalogState = LoadState.idle;
  String? catalogError;
  AppMeta? _meta;

  List<CulturalEvent> events = const [];
  List<Facility> facilities = const [];
  List<Community> communities = const [];
  List<GalleryItem> gallery = const [];

  /// "Hari ini" versi server (data contoh memakai tanggal tetap).
  DateTime get today => _meta?.today ?? DateUtils.dateOnly(DateTime.now());

  List<String> get eventCategories => _meta?.eventCategories ?? const ['Semua'];
  List<String> get communityCategories =>
      _meta?.communityCategories ?? const [];
  int get payDeadlineHours => _meta?.payDeadlineHours ?? 24;
  String get bankName => _meta?.bank ?? '-';
  String get bankAccount => _meta?.account ?? '-';

  Future<void> loadCatalog() async {
    catalogState = LoadState.loading;
    catalogError = null;
    notifyListeners();
    try {
      final meta = await repository.meta();
      final results = await Future.wait([
        repository.events(),
        repository.facilities(),
        repository.communities(),
        repository.gallery(),
      ]);
      _meta = meta;
      events = results[0] as List<CulturalEvent>;
      facilities = results[1] as List<Facility>;
      communities = results[2] as List<Community>;
      gallery = results[3] as List<GalleryItem>;
      catalogState = LoadState.ready;
    } on ApiException catch (e) {
      catalogState = LoadState.error;
      catalogError = e.message;
    }
    notifyListeners();
  }

  CulturalEvent? eventById(String id) => _find(events, (e) => e.id == id);

  Community? communityById(String id) => _find(communities, (c) => c.id == id);

  GalleryItem? galleryById(String id) => _find(gallery, (g) => g.id == id);

  Facility? facilityById(String id) => _find(facilities, (f) => f.id == id);

  List<Facility> get rentableFacilities =>
      facilities.where((f) => f.isRentable).toList();

  /// Acara bertiket yang belum berlangsung (bisa dipesan).
  List<CulturalEvent> get ticketedEvents =>
      events.where((e) => e.isTicketed && !e.date.isBefore(today)).toList();

  static T? _find<T>(List<T> items, bool Function(T) test) {
    for (final item in items) {
      if (test(item)) return item;
    }
    return null;
  }

  // ---------------------------------------------------------------- Akun

  UserAccount? _currentUser;

  UserAccount? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;

  /// Mengembalikan pesan error, atau `null` jika login berhasil.
  Future<String?> login(String email, String password) =>
      _signIn(() => repository.login(email, password));

  /// Mendaftarkan akun baru lalu langsung login.
  Future<String?> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) => _signIn(
    () => repository.register(
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password,
    ),
  );

  Future<String?> _signIn(Future<UserAccount> Function() call) async {
    try {
      _currentUser = await call();
    } on ApiException catch (e) {
      return e.displayMessage;
    }
    notifyListeners();
    await refreshAccount();
    return null;
  }

  Future<String?> updateProfile({
    required String name,
    required String email,
    required String phone,
    required String city,
  }) async {
    try {
      _currentUser = await repository.updateProfile(
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
      );
    } on ApiException catch (e) {
      return e.displayMessage;
    }
    notifyListeners();
    return null;
  }

  Future<void> logout() async {
    await repository.logout();
    _clearAccount();
  }

  void _clearAccount() {
    _currentUser = null;
    _orders = [];
    _rentals = [];
    _registrations = [];
    _notifications = [];
    _buyer = null;
    notifyListeners();
  }

  // ------------------------------------------------- Data milik akun

  bool accountLoading = false;

  /// Muat ulang tiket, sewa, komunitas, dan notifikasi milik akun. Keputusan
  /// admin terbaru (lunas, disetujui, ditolak) ikut terbawa.
  Future<void> refreshAccount() async {
    if (!isLoggedIn) return;
    accountLoading = true;
    notifyListeners();
    try {
      // Notifikasi dulu: server menyinkronkan keputusan admin saat dibaca.
      _notifications = await repository.notifications();
      final results = await Future.wait([
        repository.bookings(),
        repository.rentals(),
        repository.myCommunities(),
      ]);
      _orders = results[0] as List<TicketOrder>;
      _rentals = results[1] as List<RentalRequest>;
      _registrations = results[2] as List<CommunityRegistration>;
    } on ApiException catch (e) {
      if (e.isUnauthorized) {
        accountLoading = false;
        _clearAccount();
        return;
      }
    }
    accountLoading = false;
    notifyListeners();
  }

  // ------------------------------------------------------ Keranjang tiket

  final Map<String, int> _cart = {};

  int quantityOf(String eventId) => _cart[eventId] ?? 0;

  void setQuantity(String eventId, int quantity) {
    final clamped = quantity.clamp(0, maxTicketsPerEvent);
    if (clamped == 0) {
      _cart.remove(eventId);
    } else {
      _cart[eventId] = clamped;
    }
    notifyListeners();
  }

  /// Dipakai dari halaman detail: pastikan acara ada di keranjang.
  void ensureInCart(String eventId) {
    if (quantityOf(eventId) == 0) setQuantity(eventId, 1);
  }

  List<CartLine> get cartLines => [
    for (final event in events)
      if (quantityOf(event.id) > 0)
        CartLine(event: event, quantity: quantityOf(event.id)),
  ];

  int get cartTotal => cartLines.fold(0, (sum, line) => sum + line.subtotal);

  bool get isCartEmpty => cartLines.isEmpty;

  // ------------------------------------------------------------- Checkout

  BuyerInfo? _buyer;
  PaymentMethod _paymentMethod = PaymentMethod.qris;

  BuyerInfo? get buyer => _buyer;
  PaymentMethod get paymentMethod => _paymentMethod;

  void saveBuyer(BuyerInfo buyer) {
    _buyer = buyer;
    notifyListeners();
  }

  void selectPaymentMethod(PaymentMethod method) {
    _paymentMethod = method;
    notifyListeners();
  }

  List<TicketOrder> _orders = [];

  List<TicketOrder> get orders => List.unmodifiable(_orders);

  /// Semua baris tiket dari seluruh pesanan, terbaru lebih dulu.
  List<({TicketOrder order, CartLine line})> get ticketLines => [
    for (final order in _orders)
      for (final line in order.lines) (order: order, line: line),
  ];

  TicketOrder? findOrder(String bookingCode) =>
      _find(_orders, (o) => o.bookingCode == bookingCode);

  void _putOrder(TicketOrder order) {
    _orders = [
      order,
      for (final o in _orders)
        if (o.bookingCode != order.bookingCode) o,
    ];
  }

  /// Buat pesanan dari keranjang (status "Menunggu pembayaran") lalu
  /// kosongkan keranjang. Melempar [ApiException] bila ditolak server
  /// (mis. kuota habis).
  Future<TicketOrder> placeOrder() async {
    final buyer = _buyer;
    if (buyer == null || isCartEmpty) {
      throw StateError('Data pemesan atau keranjang belum lengkap.');
    }
    final order = await repository.checkout(cartLines, buyer);
    _putOrder(order);
    _cart.clear();
    notifyListeners();
    _refreshQuietly();
    return order;
  }

  /// Unggah bukti pembayaran → "Sedang diverifikasi" admin.
  Future<TicketOrder> payBooking(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async {
    final order = await repository.payBooking(code, method, proof, sender);
    _putOrder(order);
    notifyListeners();
    return order;
  }

  /// Muat ulang data publik (kuota) & notifikasi tanpa mengganggu layar.
  void _refreshQuietly() {
    repository.events().then((list) {
      events = list;
      notifyListeners();
    }, onError: (_) {});
    if (isLoggedIn) {
      repository.notifications().then((list) {
        _notifications = list;
        notifyListeners();
      }, onError: (_) {});
    }
  }

  // ---------------------------------------------------------- Sewa gedung

  List<RentalRequest> _rentals = [];
  RentalDraft _rentalDraft = RentalDraft();

  List<RentalRequest> get rentals => List.unmodifiable(_rentals);
  RentalDraft get rentalDraft => _rentalDraft;

  RentalRequest? findRental(String code) =>
      _find(_rentals, (r) => r.code == code);

  void _putRental(RentalRequest rental) {
    _rentals = [
      rental,
      for (final r in _rentals)
        if (r.code != rental.code) r,
    ];
  }

  /// Memulai pengajuan baru (langkah 1). [facility] dari denah/ajukan ulang.
  void startRental({Facility? facility, String activityName = ''}) {
    final user = _currentUser;
    _rentalDraft = RentalDraft()
      ..facility = facility
      ..activityName = activityName
      ..applicantName = user?.name ?? ''
      ..contact = user?.phone ?? '';
    notifyListeners();
  }

  void selectRentalVenue(Facility facility) {
    if (_rentalDraft.facility?.id != facility.id) {
      _rentalDraft
        ..facility = facility
        ..date = null
        ..slot = null;
    }
    notifyListeners();
  }

  void selectRentalDate(DateTime date) {
    _rentalDraft
      ..date = DateUtils.dateOnly(date)
      ..slot = null;
    notifyListeners();
  }

  void selectRentalSlot(RentalSlot slot) {
    _rentalDraft.slot = slot;
    notifyListeners();
  }

  void saveRentalForm({
    required String activityName,
    required String applicantName,
    required String contact,
  }) {
    _rentalDraft
      ..activityName = activityName.trim()
      ..applicantName = applicantName.trim()
      ..contact = contact.trim();
    notifyListeners();
  }

  /// Simpan berkas yang dipilih untuk dokumen [key] (ktp/surat/proposal).
  void attachRentalDocument(String key, UploadedFile file) {
    _rentalDraft.documents[key] = file;
    notifyListeners();
  }

  // Kalender ketersediaan per venue & bulan, dimuat dari server.
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
      _availability[key] = await repository.availability(facility, month);
    } on ApiException {
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

  bool isDatePast(DateTime date) => DateUtils.dateOnly(date).isBefore(today);

  /// Kirim pengajuan + 3 berkas. Melempar [ApiException] bila ditolak
  /// (mis. slot baru saja diambil orang lain).
  Future<RentalRequest> submitRental() async {
    final draft = _rentalDraft;
    if (draft.facility == null || draft.date == null || draft.slot == null) {
      throw StateError('Venue, tanggal, dan slot belum dipilih.');
    }
    final request = await repository.submitRental(draft);
    _putRental(request);
    _availability.removeWhere(
      (key, _) => key.startsWith('${draft.facility!.id}|'),
    );
    _rentalDraft = RentalDraft();
    notifyListeners();
    _refreshQuietly();
    return request;
  }

  /// Unggah bukti pembayaran tagihan sewa → "Sedang diverifikasi".
  Future<RentalRequest> payRental(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async {
    final rental = await repository.payRental(code, method, proof, sender);
    _putRental(rental);
    notifyListeners();
    return rental;
  }

  /// Mode demo saja: simulasi keputusan admin di dashboard.
  Future<void> simulateAdmin(void Function(DemoRepository demo) decide) async {
    final demo = repository;
    if (demo is! DemoRepository) return;
    decide(demo);
    await refreshAccount();
  }

  // ------------------------------------------------------------ Komunitas

  List<CommunityRegistration> _registrations = [];

  List<CommunityRegistration> get communityRegistrations =>
      List.unmodifiable(_registrations);

  /// Kirim pendaftaran → menunggu persetujuan admin. Melempar [ApiException].
  Future<void> registerCommunity(CommunityRegistration registration) async {
    final saved = await repository.registerCommunity(registration);
    _registrations = [saved, ..._registrations];
    notifyListeners();
    _refreshQuietly();
  }

  // ----------------------------------------------------------- Notifikasi

  List<AppNotification> _notifications = [];

  List<AppNotification> get notifications => List.unmodifiable(_notifications);

  int get unreadCount => _notifications.where((n) => !n.read).length;

  void markNotificationRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index < 0 || _notifications[index].read) return;
    _notifications = List.of(_notifications)
      ..[index] = _notifications[index].markRead();
    notifyListeners();
    repository.markNotificationRead(id).catchError((_) {});
  }

  void markAllNotificationsRead() {
    _notifications = [for (final n in _notifications) n.markRead()];
    notifyListeners();
    repository.markAllNotificationsRead().catchError((_) {});
  }
}

/// Menyediakan [AppState] ke seluruh widget di bawahnya dan me-rebuild
/// widget yang memanggil [AppStateScope.of] saat state berubah.
class AppStateScope extends InheritedNotifier<AppState> {
  const AppStateScope({
    super.key,
    required AppState state,
    required super.child,
  }) : super(notifier: state);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppStateScope>();
    assert(scope != null, 'AppStateScope tidak ditemukan di atas widget ini.');
    return scope!.notifier!;
  }

  /// Akses tanpa berlangganan perubahan (untuk callback tombol).
  static AppState read(BuildContext context) {
    final scope = context.getInheritedWidgetOfExactType<AppStateScope>();
    return scope!.notifier!;
  }
}
