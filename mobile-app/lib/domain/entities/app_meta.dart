import 'community.dart';
import 'cultural_event.dart';
import 'facility.dart';
import 'gallery_item.dart';
import 'news_item.dart';
import 'rental_request.dart';

/// Profil lembaga yang diatur admin di dashboard (menu Profil & denah).
class InstitutionProfile {
  const InstitutionProfile({
    required this.name,
    required this.manager,
    required this.address,
    required this.phone,
    required this.whatsapp,
    required this.hours,
    required this.about,
  });

  /// Dipakai sebelum data server termuat (isi sama dengan data awal
  /// dashboard).
  static const fallback = InstitutionProfile(
    name: 'Taman Krida Budaya Jawa Timur',
    manager: 'UPT LPPK Taman Krida Budaya · Disbudpar Provinsi Jawa Timur',
    address: 'Jl. Soekarno Hatta No. 7, Jatimulyo, Lowokwaru, Kota Malang',
    phone: '(0341) 471509',
    whatsapp: '',
    hours: 'Senin–Jumat · 08.00–16.00 WIB',
    about: 'Kompleks seni budaya yang dikelola Disbudpar Jatim di Kota Malang.',
  );

  final String name;
  final String manager;
  final String address;
  final String phone;

  /// Kosong bila TKBJ belum punya WhatsApp layanan.
  final String whatsapp;
  final String hours;
  final String about;
}

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
    this.profile = InstitutionProfile.fallback,
  });

  final InstitutionProfile profile;

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
    this.news = const [],
  });

  final AppMeta meta;

  /// Banner beranda, berita, pengumuman, artikel budaya (menu Konten).
  final List<NewsItem> news;
  final List<CulturalEvent> events;
  final List<Facility> facilities;
  final List<Community> communities;
  final List<GalleryItem> gallery;
}

/// Ketersediaan slot per tanggal ("2026-10-02") untuk satu venue & bulan.
typedef Availability = Map<String, Map<RentalSlot, SlotState>>;
