import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_assets.dart';
import '../../core/utils/formatters.dart';
import '../api/api_client.dart';
import '../api/visuals.dart';
import '../models/app_notification.dart';
import '../models/community.dart';
import '../models/cultural_event.dart';
import '../models/facility.dart';
import '../models/gallery_item.dart';
import '../models/rental_request.dart';
import '../models/ticket_order.dart';
import '../models/user_account.dart';
import 'tkbj_repository.dart';

typedef _Json = Map<String, dynamic>;

/// Repository yang memanggil API mobile (backend/mobile-app, satu database
/// dengan dashboard admin). Mengubah JSON server menjadi model aplikasi.
class ApiRepository implements TkbjRepository {
  ApiRepository({ApiClient? client}) : _api = client ?? ApiClient();

  final ApiClient _api;

  static const _tokenKey = 'tkbj_token';

  /// Daftar fasilitas terakhir, untuk mencocokkan nama venue pada sewa.
  List<Facility> _facilities = const [];

  // ------------------------------------------------------------ Publik

  @override
  Future<AppMeta> meta() async {
    final json = await _api.get('/meta') as _Json;
    final tickets = json['tickets'] as _Json;
    final bank = json['bankAccount'] as _Json;
    return AppMeta(
      today: DateTime.parse(json['today'] as String),
      eventCategories: ['Semua', ...(json['eventCategories'] as List).cast()],
      communityCategories: (json['communityCategories'] as List).cast(),
      maxTicketsPerEvent: tickets['maxPerEvent'] as int,
      payDeadlineHours: tickets['payDeadlineHours'] as int,
      bank: bank['bank'] as String,
      account: bank['account'] as String,
    );
  }

  @override
  Future<List<CulturalEvent>> events() async {
    // all=1: termasuk acara yang sudah lewat, agar bulan sebelumnya tetap
    // bisa dilihat di kalender.
    final list = await _api.get('/events', query: {'all': '1'}) as List;
    return list.cast<_Json>().map(_event).toList();
  }

  @override
  Future<List<Facility>> facilities() async {
    final list = await _api.get('/facilities') as List;
    final rows = list.cast<_Json>();
    _facilities = [
      for (var i = 0; i < rows.length; i++) _facility(rows[i], i + 1),
    ];
    return _facilities;
  }

  @override
  Future<List<Community>> communities() async {
    final list = await _api.get('/communities') as List;
    return list.cast<_Json>().map(_community).toList();
  }

  @override
  Future<List<GalleryItem>> gallery() async {
    final media = (await _api.get('/gallery') as List).cast<_Json>();
    return media.map((m) => _galleryItem(m, media)).toList();
  }

  @override
  Future<Availability> availability(Facility facility, DateTime month) async {
    final json = await _api.get(
      '/rentals/availability',
      query: {
        'facilityId': facility.id,
        'month': '${month.year}-${Formatters.twoDigits(month.month)}',
      },
    ) as _Json;
    return {
      for (final day in (json['days'] as List).cast<_Json>())
        day['date'] as String: {
          for (final slot in RentalSlot.values)
            slot: SlotState.values.byName(
              (day['slots'] as _Json)[slot.name] as String,
            ),
        },
    };
  }

  // -------------------------------------------------------------- Akun

  Future<void> _saveToken(String? token) async {
    _api.token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token == null) {
      await prefs.remove(_tokenKey);
    } else {
      await prefs.setString(_tokenKey, token);
    }
  }

  @override
  Future<UserAccount?> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    if (token == null) return null;
    _api.token = token;
    try {
      final json = await _api.get('/auth/me') as _Json;
      return _user(json['user'] as _Json);
    } on ApiException catch (e) {
      // Token kedaluwarsa/dicabut → lupakan. Server mati → coba lagi nanti.
      if (e.isUnauthorized) await _saveToken(null);
      return null;
    }
  }

  Future<UserAccount> _signIn(String path, Map<String, String> body) async {
    final json = await _api.post(path, body) as _Json;
    await _saveToken(json['token'] as String);
    return _user(json['user'] as _Json);
  }

  @override
  Future<UserAccount> login(String email, String password) =>
      _signIn('/auth/login', {'email': email.trim(), 'password': password});

  @override
  Future<UserAccount> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) => _signIn('/auth/register', {
    'name': name,
    'email': email.trim(),
    'phone': phone,
    'password': password,
  });

  @override
  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } on ApiException {
      // Sesi sudah tidak berlaku di server: cukup hapus token lokal.
    }
    await _saveToken(null);
  }

  @override
  Future<UserAccount> updateProfile({
    required String name,
    required String email,
    required String phone,
    required String city,
  }) async {
    final json = await _api.put('/auth/me', {
      'name': name,
      'email': email,
      'phone': phone,
      'city': city,
    }) as _Json;
    return _user(json['user'] as _Json);
  }

  // ------------------------------------------------------------- Tiket

  @override
  Future<List<TicketOrder>> bookings() async {
    final list = await _api.get('/tickets') as List;
    return list.cast<_Json>().map(_booking).toList();
  }

  @override
  Future<TicketOrder> checkout(List<CartLine> lines, BuyerInfo buyer) async {
    final json = await _api.post('/tickets/checkout', {
      'items': [
        for (final line in lines)
          {'eventId': line.event.id, 'qty': line.quantity},
      ],
      'buyer': {'name': buyer.name, 'email': buyer.email, 'phone': buyer.phone},
    }) as _Json;
    return _booking(json);
  }

  @override
  Future<TicketOrder> payBooking(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async {
    final json = await _api.postMultipart(
      '/tickets/$code/payment',
      fields: {'method': method.shortLabel, 'sender': sender},
      files: {'file': proof},
    ) as _Json;
    return _booking(json);
  }

  // -------------------------------------------------------------- Sewa

  @override
  Future<List<RentalRequest>> rentals() async {
    if (_facilities.isEmpty) await facilities();
    final list = await _api.get('/rentals') as List;
    return list.cast<_Json>().map(_rental).toList();
  }

  @override
  Future<RentalRequest> submitRental(RentalDraft draft) async {
    final json = await _api.postMultipart(
      '/rentals',
      fields: {
        'facilityId': draft.facility!.id,
        'date': Formatters.isoDate(draft.date!),
        'slot': draft.slot!.name,
        'activity': draft.activityName,
        'applicant': draft.applicantName,
        'contact': draft.contact,
      },
      files: draft.documents,
    ) as _Json;
    return _rental(json);
  }

  @override
  Future<RentalRequest> payRental(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async {
    final json = await _api.postMultipart(
      '/rentals/$code/payment',
      fields: {'method': method.shortLabel, 'sender': sender},
      files: {'file': proof},
    ) as _Json;
    return _rental(json);
  }

  // --------------------------------------------------------- Komunitas

  @override
  Future<CommunityRegistration> registerCommunity(
    CommunityRegistration r,
  ) async {
    final json = await _api.post('/communities', {
      'name': r.name,
      'category': r.category,
      'leader': r.leader,
      'phone': r.phone,
      'address': r.address,
      'description': r.description,
    }) as _Json;
    return _registration(json);
  }

  @override
  Future<List<CommunityRegistration>> myCommunities() async {
    final list = await _api.get('/me/communities') as List;
    return list.cast<_Json>().map(_registration).toList();
  }

  // -------------------------------------------------------- Notifikasi

  @override
  Future<List<AppNotification>> notifications() async {
    final json = await _api.get('/notifications') as _Json;
    return (json['items'] as List).cast<_Json>().map(_notification).toList();
  }

  @override
  Future<void> markNotificationRead(String id) =>
      _api.post('/notifications/$id/read');

  @override
  Future<void> markAllNotificationsRead() =>
      _api.post('/notifications/read-all');

  // ---------------------------------------------------- JSON → model

  static DateTime _date(Object? value) =>
      DateTime.parse(value as String).toLocal();

  static DateTime? _dateOrNull(Object? value) =>
      value == null ? null : _date(value);

  static UserAccount _user(_Json j) => UserAccount(
    name: j['name'] as String,
    email: j['email'] as String,
    phone: j['phone'] as String,
    city: j['city'] as String? ?? '',
    memberSince: j['memberSince'] as int,
  );

  static CulturalEvent _event(_Json j) {
    final venue = j['venue'] as String;
    final organizer = j['organizer'] as String;
    final ticketed = j['ticketed'] as bool;
    return CulturalEvent(
      id: j['id'] as String,
      category: j['category'] as String,
      title: j['name'] as String,
      shortTitle: j['short'] as String,
      performer: organizer,
      description:
          '${j['name']} dipersembahkan oleh $organizer di $venue, Taman '
          'Krida Budaya Jawa Timur. '
          '${ticketed ? 'Tiket terbatas, pesan lebih awal agar kebagian kursi.' : 'Terbuka untuk umum tanpa tiket.'}',
      date: DateTime.parse(j['date'] as String),
      startTime: j['start'] as String,
      endTime: j['end'] as String,
      venue: venue,
      venueShort: Visuals.venueShort(venue),
      imageAsset:
          Visuals.photo(j['photo'] as String?) ?? Visuals.venueImage(venue),
      price: ticketed ? j['price'] as int : 0,
      quotaTotal: j['quota'] as int? ?? 0,
      quotaLeft: j['remaining'] as int? ?? 0,
    );
  }

  static Facility _facility(_Json j, int index) {
    final id = j['id'] as String;
    final layout = Visuals.facilityLayouts[id];
    final capacity = j['capacity'] as int?;
    final purpose = j['purpose'] as String;
    return Facility(
      id: id,
      number: layout?.number ?? index,
      name: j['name'] as String,
      shortName: layout?.shortName ?? j['name'] as String,
      description: layout?.description ?? purpose,
      capacityLabel: capacity == null
          ? purpose
          : 'Kapasitas hingga $capacity orang',
      imageAsset:
          layout?.imageAsset ??
          Visuals.photo(j['photo'] as String?) ??
          AppImages.fasilitasParkir,
      mapPosition: layout?.mapPosition,
      rentalRate: j['rentalRate'] as int?,
      seatCount: capacity,
      rentalCapacityLabel: capacity == null
          ? purpose
          : 'Kapasitas hingga $capacity orang · $purpose',
    );
  }

  /// Venue sewa → fasilitas dari daftar terakhir (atau tiruan bila tidak ada).
  Facility _facilityNamed(String venue, int? rate) {
    for (final f in _facilities) {
      if (f.name == venue) return f;
    }
    return Facility(
      id: venue,
      number: 0,
      name: venue,
      shortName: Visuals.venueShort(venue),
      description: venue,
      capacityLabel: venue,
      imageAsset: Visuals.venueImage(venue),
      rentalRate: rate,
    );
  }

  static Community _community(_Json j) {
    final since = j['since'] as String?;
    final city = j['city'] as String;
    final category = j['category'] as String;
    return Community(
      id: j['id'] as String,
      name: j['name'] as String,
      category: category,
      specialization: category,
      phone: j['contact'] as String,
      imageAsset:
          Visuals.photo(j['photo'] as String?) ?? AppImages.latihanSanggar,
      headline: '$category · $city',
      foundedYear:
          int.tryParse(RegExp(r'\d{4}').stringMatch(since ?? '') ?? '') ?? 0,
      members: j['members'] as int,
      performances: '–',
      about:
          '${j['name']} adalah komunitas $category dari $city yang terdaftar '
          'di direktori Taman Krida Budaya Jawa Timur.',
      schedule: const [],
      place: city,
      leader: j['leader'] as String? ?? '–',
      address: city,
    );
  }

  static CommunityRegistration _registration(_Json j) => CommunityRegistration(
    id: j['id'] as String,
    name: j['name'] as String,
    category: j['category'] as String,
    leader: j['leader'] as String? ?? '',
    phone: j['contact'] as String,
    address: j['address'] as String,
    description: j['description'] as String,
    submittedAt: _dateOrNull(j['appliedAt']) ?? DateTime.now(),
    status: j['status'] as String,
    adminNote: j['adminNote'] as String?,
  );

  static GalleryItem _galleryItem(_Json m, List<_Json> all) {
    final collection = m['collection'] as String;
    String cover(_Json x) =>
        Visuals.photo(x['url'] as String?) ??
        Visuals.photo(x['photo'] as String?) ??
        AppImages.fasilitasGedung;
    // Foto lain dalam koleksi yang sama ikut tampil sebagai album.
    final album = [
      cover(m),
      for (final other in all)
        if (other != m &&
            other['collection'] == collection &&
            other['type'] == 'Foto')
          cover(other),
    ];
    final date = DateTime.parse(m['date'] as String);
    final description = m['description'] as String? ?? '';
    final minutes = RegExp(r'(\d+)\.\d+')
        .firstMatch(m['dims'] as String? ?? '')
        ?.group(1);
    return GalleryItem(
      id: m['id'] as String,
      title: m['title'] as String,
      category: Visuals.galleryCategory('${m['title']} $collection'),
      badge: collection,
      headline: description.isEmpty ? 'Arsip $collection TKBJ.' : description,
      description: description.isEmpty
          ? 'Dokumentasi oleh ${m['credit']}.'
          : '$description Dokumentasi oleh ${m['credit']}.',
      venue: m['credit'] as String,
      period: Formatters.monthYear(date),
      photos: album,
      videoMinutes: m['type'] == 'Video' ? int.tryParse(minutes ?? '') ?? 1 : 0,
    );
  }

  static CulturalEvent _lineEvent(_Json l) {
    final venue = l['venue'] as String? ?? '';
    return CulturalEvent(
      id: l['eventId'] as String? ?? l['orderId'] as String,
      category: '',
      title: l['event'] as String,
      shortTitle: l['eventShort'] as String,
      performer: '',
      description: '',
      date: DateTime.parse(l['date'] as String),
      startTime: l['start'] as String? ?? '',
      endTime: l['end'] as String? ?? '',
      venue: venue,
      venueShort: Visuals.venueShort(venue),
      imageAsset:
          Visuals.photo(l['photo'] as String?) ?? Visuals.venueImage(venue),
      price: l['price'] as int,
      quotaTotal: 0,
      quotaLeft: 0,
    );
  }

  static TicketOrder _booking(_Json j) {
    final buyer = j['buyer'] as _Json;
    return TicketOrder(
      bookingCode: j['code'] as String,
      buyer: BuyerInfo(
        name: buyer['name'] as String,
        email: buyer['email'] as String,
        phone: buyer['phone'] as String,
      ),
      lines: [
        for (final l in (j['lines'] as List).cast<_Json>())
          CartLine(
            event: _lineEvent(l),
            quantity: l['qty'] as int,
            orderId: l['orderId'] as String,
            ticketCodes: (l['ticketCodes'] as List).cast(),
            note: l['note'] as String?,
          ),
      ],
      createdAt: _date(j['createdAt']),
      status: PaymentStatus.fromApi(j['payment'] as String?),
      method: PaymentMethod.fromLabel(j['method'] as String?),
      paidAt: _dateOrNull(j['paidAt']),
      payBefore: _dateOrNull(j['payBefore']),
    );
  }

  RentalRequest _rental(_Json j) {
    final docs = j['documents'] as List?;
    final amount = j['amount'] as int;
    return RentalRequest(
      code: j['id'] as String,
      facility: _facilityNamed(j['venue'] as String, amount),
      activityName: j['activity'] as String,
      date: DateTime.parse(j['date'] as String),
      startTime: j['start'] as String,
      endTime: j['end'] as String,
      slot: RentalSlot.fromKey(j['slot'] as String?),
      applicantName: j['applicant'] as String,
      contact: j['contact'] as String,
      documentCount: docs?.length ?? RentalDocument.all.length,
      submittedAt: _date(j['submittedAt']),
      amount: amount,
      status: RentalStatus.fromApi(j['status'] as String?),
      payment: j['payment'] == null
          ? null
          : PaymentStatus.fromApi(j['payment'] as String),
      reviewedAt: _dateOrNull(j['decidedAt']),
      adminNote: j['adminNote'] as String?,
      paymentNote: j['paymentNote'] as String?,
      paymentMethod: PaymentMethod.fromLabel(j['method'] as String?),
      paidAt: _dateOrNull(j['paidAt']),
    );
  }

  static AppNotification _notification(_Json j) => AppNotification(
    id: '${j['id']}',
    symbol: j['symbol'] as String,
    title: j['title'] as String,
    body: j['body'] as String,
    createdAt: _date(j['createdAt']),
    target: NotificationTarget.values.byName(j['target'] as String),
    targetId: j['targetId'] as String?,
    read: j['read'] as bool,
  );
}
