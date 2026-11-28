import 'package:flutter/material.dart';

import '../../core/error/failure.dart';
import '../../domain/entities/app_meta.dart';
import '../../domain/entities/community.dart';
import '../../domain/entities/cultural_event.dart';
import '../../domain/entities/facility.dart';
import '../../domain/entities/gallery_item.dart';
import '../../domain/entities/news_item.dart';
import '../../domain/usecases/catalog_usecases.dart';

/// Keadaan pemuatan data dari server.
enum LoadState { idle, loading, ready, error }

/// Data publik: acara, fasilitas, komunitas, galeri, dan aturan aplikasi.
class CatalogController extends ChangeNotifier {
  CatalogController({required this._getCatalog, required this._getEvents});

  final GetCatalogUseCase _getCatalog;
  final GetEventsUseCase _getEvents;

  LoadState loadState = LoadState.idle;
  String? error;
  AppMeta? _meta;

  List<CulturalEvent> events = const [];
  List<Facility> facilities = const [];
  List<Community> communities = const [];
  List<GalleryItem> gallery = const [];

  /// Konten terpublikasi dari menu Konten dashboard (terbaru dulu).
  List<NewsItem> news = const [];

  bool get isReady => loadState == LoadState.ready;

  /// "Hari ini" versi server (data contoh memakai tanggal tetap).
  DateTime get today => _meta?.today ?? DateUtils.dateOnly(DateTime.now());

  List<String> get eventCategories => _meta?.eventCategories ?? const ['Semua'];
  List<String> get communityCategories =>
      _meta?.communityCategories ?? const [];
  int get payDeadlineHours => _meta?.payDeadlineHours ?? 24;
  String get bankName => _meta?.bank ?? '-';
  String get bankAccount => _meta?.account ?? '-';

  /// Profil lembaga yang diatur admin (menu Profil & denah di dashboard).
  InstitutionProfile get profile =>
      _meta?.profile ?? InstitutionProfile.fallback;

  /// Banner beranda aktif: banner bertanda utama, lalu banner terbaru.
  NewsItem? get banner =>
      _find(news, (n) => n.isHero) ?? _find(news, (n) => n.isBanner);

  /// Berita, pengumuman, dan artikel budaya (tanpa banner).
  List<NewsItem> get headlines => news.where((n) => !n.isBanner).toList();

  NewsItem? newsById(String id) => _find(news, (n) => n.id == id);

  /// [quiet]: data lama tetap tampil selama memuat (tarik untuk segarkan),
  /// dan [Failure] diteruskan ke pemanggil bila server gagal dihubungi.
  Future<void> load({bool quiet = false}) async {
    final keepShowing = quiet && isReady;
    if (!keepShowing) {
      loadState = LoadState.loading;
      error = null;
      notifyListeners();
    }
    try {
      final catalog = await _getCatalog();
      _meta = catalog.meta;
      events = catalog.events;
      facilities = catalog.facilities;
      communities = catalog.communities;
      gallery = catalog.gallery;
      news = catalog.news;
      loadState = LoadState.ready;
    } on Failure catch (e) {
      if (keepShowing) rethrow;
      loadState = LoadState.error;
      error = e.message;
    }
    notifyListeners();
  }

  /// Tarik untuk segarkan. Mengembalikan pesan galat bila gagal.
  Future<String?> refresh() async {
    try {
      await load(quiet: true);
      return null;
    } on Failure catch (e) {
      return e.message;
    }
  }

  /// Muat ulang acara (kuota) tanpa mengganggu layar.
  Future<void> refreshEvents() async {
    try {
      events = await _getEvents();
      notifyListeners();
    } on Failure {
      // Data lama tetap dipakai.
    }
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
}
