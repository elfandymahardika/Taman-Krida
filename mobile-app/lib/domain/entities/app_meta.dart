import 'community.dart';
import 'cultural_event.dart';
import 'facility.dart';
import 'gallery_item.dart';
import 'rental_request.dart';

/// Pilihan & aturan dari server (GET /api/meta).
class AppMeta {
  const AppMeta({
    required this.today,
    required this.eventCategories,
    required this.communityCategories,
    required this.maxTicketsPerEvent,
    required this.payDeadlineHours,
    required this.bank,
    required this.account,
  });

  /// "Hari ini" versi server (data contoh memakai tanggal tetap).
  final DateTime today;

  /// Termasuk "Semua" di urutan pertama, untuk chip filter.
  final List<String> eventCategories;
  final List<String> communityCategories;
  final int maxTicketsPerEvent;
  final int payDeadlineHours;
  final String bank;
  final String account;
}

/// Seluruh data publik yang dimuat saat aplikasi dibuka.
class Catalog {
  const Catalog({
    required this.meta,
    required this.events,
    required this.facilities,
    required this.communities,
    required this.gallery,
  });

  final AppMeta meta;
  final List<CulturalEvent> events;
  final List<Facility> facilities;
  final List<Community> communities;
  final List<GalleryItem> gallery;
}

/// Ketersediaan slot per tanggal ("2026-10-02") untuk satu venue & bulan.
typedef Availability = Map<String, Map<RentalSlot, SlotState>>;
