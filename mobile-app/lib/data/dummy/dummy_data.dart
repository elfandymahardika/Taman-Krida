import 'dart:ui';

import '../../core/constants/app_assets.dart';
import '../models/cultural_event.dart';
import '../models/facility.dart';
import '../models/rental_request.dart';
import '../models/ticket_order.dart';
import '../models/user_account.dart';

/// Data contoh (mock) pengganti backend. Isi teks mengikuti desain Figma.
abstract final class DummyData {
  static const eventCategories = [
    'Semua',
    'Wayang',
    'Tari',
    'Ketoprak',
    'Pameran',
  ];

  static final events = <CulturalEvent>[
    CulturalEvent(
      id: 'wayang-bima-bungkus',
      category: 'Wayang',
      title: 'Wayang Kulit: Lakon Bima Bungkus',
      shortTitle: 'Wayang Kulit: Bima Bungkus',
      performer: 'Dalang Ki Sutejo bersama Paguyuban Wayang "Wahyu Budoyo"',
      description:
          'Lakon Bima Bungkus mengisahkan kelahiran Bima yang terbungkus '
          'selaput dan hanya bisa dibuka oleh gajah Sena. Pagelaran semalam '
          'suntuk ini diiringi gamelan lengkap dan sinden dari Malang Raya.',
      date: DateTime(2026, 6, 3),
      startTime: '19:30',
      endTime: '23:00',
      venue: 'Panggung Terbuka TKBJ',
      venueShort: 'Terbuka',
      imageAsset: AppImages.acaraWayang,
      price: 35000,
      quotaTotal: 300,
      quotaLeft: 180,
    ),
    CulturalEvent(
      id: 'tari-topeng-malangan',
      category: 'Tari',
      title: 'Pentas Akbar Tari Topeng Malangan',
      shortTitle: 'Pentas Tari Topeng Malangan',
      performer: 'Sanggar Tari Mekar Sari Malang',
      description:
          'Pentas akbar tari Topeng Malangan menampilkan tokoh Panji, '
          'Klana, dan Gunungsari dengan iringan gamelan khas Malangan. '
          'Pertunjukan ditutup dengan sesi foto bersama para penari.',
      date: DateTime(2026, 6, 8),
      startTime: '16:00',
      endTime: '18:00',
      venue: 'Pendopo Agung TKBJ',
      venueShort: 'Pendopo',
      imageAsset: AppImages.acaraTopeng,
      price: 25000,
      quotaTotal: 300,
      quotaLeft: 124,
    ),
    CulturalEvent(
      id: 'pameran-batik-kriya',
      category: 'Pameran',
      title: 'Pameran Batik Tulis & Kriya Agung',
      shortTitle: 'Pameran Batik & Kriya',
      performer: 'Dekranasda Provinsi Jawa Timur',
      description:
          'Pameran karya batik tulis dan kriya dari perajin seluruh Jawa '
          'Timur, lengkap dengan demonstrasi membatik dan lokakarya singkat '
          'untuk pengunjung. Terbuka untuk umum tanpa tiket.',
      date: DateTime(2026, 6, 14),
      startTime: '09:00',
      endTime: '16:00',
      venue: 'Gedung Kesenian TKBJ',
      venueShort: 'Gedung Kesenian',
      imageAsset: AppImages.fasilitasGedung,
      price: 0,
      quotaTotal: 200,
      quotaLeft: 200,
    ),
    CulturalEvent(
      id: 'ketoprak-sang-adipati',
      category: 'Ketoprak',
      title: 'Ketoprak Humor: Sang Adipati',
      shortTitle: 'Ketoprak: Sang Adipati',
      performer: 'Komunitas Ketoprak "Guyub Rukun"',
      description:
          'Ketoprak humor bercerita tentang Adipati yang menyamar menjadi '
          'rakyat biasa untuk mengenal negerinya. Dibawakan dengan dialog '
          'jenaka berbahasa Jawa dan iringan gamelan.',
      date: DateTime(2026, 6, 19),
      startTime: '19:00',
      endTime: '22:00',
      venue: 'Panggung Terbuka TKBJ',
      venueShort: 'Terbuka',
      imageAsset: AppImages.acaraKetoprak,
      price: 30000,
      quotaTotal: 200,
      quotaLeft: 96,
    ),
  ];

  static final facilities = <Facility>[
    const Facility(
      id: 'pendopo-agung',
      number: 1,
      name: 'Pendopo Agung TKBJ',
      shortName: 'Pendopo Agung',
      description:
          'Bangunan utama berarsitektur joglo limasan terbuka untuk '
          'pertunjukan tari kolosal & wayang.',
      capacityLabel: 'Kapasitas up to 500 orang',
      imageAsset: AppImages.fasilitasPendopo,
      mapPosition: Offset(0.198, 0.254),
      ratePerHour: 3500000,
    ),
    const Facility(
      id: 'panggung-terbuka',
      number: 2,
      name: 'Panggung Terbuka (Amphitheater)',
      shortName: 'Panggung Terbuka',
      description:
          'Amfiteater ruang terbuka bernuansa alam untuk pertunjukan '
          'sendratari kolosal & festival.',
      capacityLabel: 'Kapasitas up to 800 orang',
      imageAsset: AppImages.fasilitasPanggung,
      mapPosition: Offset(0.534, 0.213),
      ratePerHour: 4000000,
    ),
    const Facility(
      id: 'gedung-kesenian',
      number: 3,
      name: 'Gedung Kesenian & Galeri',
      shortName: 'Gedung Kesenian',
      description:
          'Ruang pameran seni rupa indoor modern, lokakarya kriya, dan '
          'pameran tertutup.',
      capacityLabel: 'Kapasitas up to 200 orang',
      imageAsset: AppImages.fasilitasGedung,
      mapPosition: Offset(0.673, 0.629),
      ratePerHour: 2000000,
    ),
    const Facility(
      id: 'parkir-informasi',
      number: 4,
      name: 'Area Parkir & Pusat Informasi',
      shortName: 'Area Parkir',
      description:
          'Fasilitas parkir luas terkendali, area loket terintegrasi, '
          'toilet, serta mushola.',
      capacityLabel: 'Fasilitas penunjang lengkap',
      imageAsset: AppImages.fasilitasParkir,
      mapPosition: Offset(0.254, 0.713),
    ),
  ];

  /// Tanggal yang sudah terpakai per venue (simulasi jadwal penuh).
  static final bookedDates = <String, List<DateTime>>{
    'pendopo-agung': [DateTime(2026, 10, 10), DateTime(2026, 10, 24)],
    'panggung-terbuka': [DateTime(2026, 10, 17)],
    'gedung-kesenian': [DateTime(2026, 10, 12), DateTime(2026, 10, 13)],
  };

  static const rentalStartHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  /// Gedung tutup pukul 22:00.
  static const rentalClosingHour = 22;

  static const demoAccount = UserAccount(
    name: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    phone: '081234567890',
    password: 'tkbj2026',
    memberSince: 2026,
    savedEvents: 5,
  );

  static List<TicketOrder> seedOrders() => [
    TicketOrder(
      bookingCode: 'TKBJ-A1B2C3',
      buyer: BuyerInfo(
        name: demoAccount.name,
        email: demoAccount.email,
        phone: demoAccount.phone,
      ),
      lines: [
        CartLine(event: events[0], quantity: 2),
        CartLine(event: events[1], quantity: 1),
      ],
      method: PaymentMethod.qris,
      paidAt: DateTime(2026, 6, 1),
    ),
  ];

  static List<RentalRequest> seedRentals() => [
    RentalRequest(
      code: 'SG-1026-0018',
      facility: facilities[0],
      activityName: 'Festival Tari Topeng Malangan 2026',
      date: DateTime(2026, 6, 12),
      startHour: 8,
      durationHours: 4,
      applicantName: 'Yayasan Mekar Sari Malang',
      contact: '0812-3456-7890',
      status: RentalStatus.approved,
    ),
  ];
}
