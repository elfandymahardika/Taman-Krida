import 'dart:ui';

import '../../core/constants/app_assets.dart';
import '../../core/utils/formatters.dart';
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
      seatCount: 500,
      rentalCapacityLabel: 'Kapasitas up to 500 kursi pementasan',
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
      ratePerHour: 2500000,
      seatCount: 800,
      rentalCapacityLabel: 'Kapasitas up to 800 penonton',
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
      ratePerHour: 1500000,
      seatCount: 200,
      rentalCapacityLabel: 'Kapasitas up to 200 pameran',
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

  static const demoAccount = UserAccount(
    name: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    phone: '081234567890',
    password: 'tkbj2026',
    memberSince: 2026,
    city: 'Malang',
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
      code: 'SG-1026-0020',
      facility: facilities[2],
      activityName: 'Pameran Kriya Muda Malang Raya',
      date: DateTime(2026, 6, 20),
      slot: RentalSlot.afternoon,
      applicantName: 'Komunitas Ruang Seni',
      contact: '0813-5566-7788',
      documentCount: 3,
      submittedAt: DateTime(2026, 6, 2, 10, 5),
    ),
    RentalRequest(
      code: 'SG-1026-0019',
      facility: facilities[0],
      activityName: 'Festival Tari Topeng Malangan 2026',
      date: DateTime(2026, 6, 12),
      slot: RentalSlot.morning,
      applicantName: 'Yayasan Mekar Sari Malang',
      contact: '0812-3456-7890',
      documentCount: 3,
      submittedAt: DateTime(2026, 6, 1, 14, 20),
      status: RentalStatus.paid,
      reviewedAt: DateTime(2026, 6, 2, 9, 12),
      paymentMethod: PaymentMethod.virtualAccount,
    ),
    RentalRequest(
      code: 'SG-1026-0012',
      facility: facilities[1],
      activityName: 'Malam Apresiasi Jaranan',
      date: DateTime(2026, 6, 5),
      slot: RentalSlot.evening,
      applicantName: "Jaranan Dor 'Turonggo Putro'",
      contact: '0822-9988-7766',
      documentCount: 2,
      submittedAt: DateTime(2026, 5, 20, 16, 40),
      status: RentalStatus.rejected,
      reviewedAt: DateTime(2026, 5, 21, 9, 12),
      adminNote: rejectionNote(DateTime(2026, 6, 5)),
      fixes: rejectionFixes,
    ),
  ];

  /// Catatan admin (simulasi) saat pengajuan sewa ditolak.
  static String rejectionNote(DateTime date) =>
      'Tanggal ${Formatters.longDate(date)} bentrok dengan agenda internal '
      'Disbudpar Jatim. Mohon ajukan ulang dengan tanggal lain dan lengkapi '
      'proposal dengan rundown acara.';

  static const rejectionFixes = [
    'Ganti tanggal pelaksanaan',
    'Lampirkan rundown acara di proposal',
  ];

  /// Berkas wajib pada langkah Unggah Berkas sewa gedung.
  static const rentalDocuments = [
    'KTP Penanggung Jawab',
    'Surat Permohonan Resmi',
    'Proposal Kegiatan',
  ];
}
