import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tkbj_mobile/app.dart';
import 'package:tkbj_mobile/core/constants/app_assets.dart';
import 'package:tkbj_mobile/core/utils/formatters.dart';
import 'package:tkbj_mobile/data/datasources/demo/demo_data_source.dart';
import 'package:tkbj_mobile/data/datasources/remote/api_client.dart';
import 'package:tkbj_mobile/data/models/app_meta_model.dart';
import 'package:tkbj_mobile/data/models/community_model.dart';
import 'package:tkbj_mobile/data/models/culture_topic_model.dart';
import 'package:tkbj_mobile/data/models/gallery_item_model.dart';
import 'package:tkbj_mobile/domain/entities/culture_topic.dart';
import 'package:tkbj_mobile/domain/entities/app_notification.dart';
import 'package:tkbj_mobile/domain/entities/assistant_message.dart';
import 'package:tkbj_mobile/domain/entities/rental_request.dart';
import 'package:tkbj_mobile/domain/entities/ticket_order.dart';
import 'package:tkbj_mobile/injection.dart';
import 'package:tkbj_mobile/presentation/pages/education/video_player_screen.dart';
import 'package:tkbj_mobile/presentation/routes/app_routes.dart';
import 'package:tkbj_mobile/presentation/widgets/interactive/chip_filter.dart';

import 'helpers/screen_harness.dart';

Future<void> _open(
  WidgetTester tester,
  AppContainer state,
  String route,
) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(TkbjApp(container: state));
  await tester.pumpAndSettle();
  tester.state<NavigatorState>(find.byType(Navigator).first).pushNamed(route);
  await tester.pumpAndSettle();
}

Future<void> _tapText(WidgetTester tester, String text) async {
  final finder = find.text(text).last;
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

/// Draf sewa lengkap sampai formulir, di slot pertama yang masih tersedia.
Future<(DateTime, RentalSlot)> _draftRental(
  AppContainer state,
  String activity,
) async {
  state.rental.startRental(facility: pendopo);
  final (date, slot) = await firstAvailableBooking(state, pendopo);
  state.rental
    ..selectDate(date)
    ..selectSlot(slot)
    ..saveForm(
      activityName: activity,
      applicantName: 'SMA Negeri 1 Malang',
      contact: '081234567890',
    );
  return (date, slot);
}

void main() {
  test('format rupiah singkat, waktu relatif, dan ukuran berkas', () {
    expect(Formatters.rupiahShort(3500000), 'Rp 3,5 jt');
    expect(Formatters.rupiahShort(2000000), 'Rp 2 jt');
    final now = DateTime(2026, 10, 11, 12);
    expect(Formatters.relative(now, now: now), 'Baru saja');
    expect(
      Formatters.relative(now.subtract(const Duration(hours: 2)), now: now),
      '2 jam lalu',
    );
    expect(
      Formatters.relative(now.subtract(const Duration(days: 1)), now: now),
      'Kemarin',
    );
    expect(Formatters.fileSize(1258291), '1,2 MB');
    expect(Formatters.fileSize(344064), '336 KB');
    expect(Formatters.isoDate(DateTime(2026, 6, 3)), '2026-06-03');
  });

  test('alur sewa gedung: ajukan → disetujui → bayar → lunas', () async {
    final state = await signedInState();
    final unreadBefore = state.notification.unreadCount;
    final (date, slot) = await _draftRental(state, 'Pentas Seni Sekolah');
    for (final doc in RentalDocument.all) {
      state.rental.attachDocument(doc.key, fakeFile('${doc.key}.pdf'));
    }

    final request = await state.rental.submit();
    expect(request.status, RentalStatus.pending);
    expect(request.documentCount, 3);
    expect(
      request.estimatedCost,
      2500000,
      reason: 'tarif Pendopo per pemakaian',
    );
    // Slot yang sudah diajukan tidak boleh dipesan lagi.
    await state.rental.loadAvailability(pendopo, date);
    expect(state.rental.isSlotTaken(pendopo, date, slot), isTrue);

    await state.admin.approveRental(request.code);
    expect(
      state.rental.findRental(request.code)!.status,
      RentalStatus.approved,
    );

    await state.rental.pay(
      request.code,
      PaymentMethod.virtualAccount,
      fakeFile('bukti.pdf'),
      'SMA Negeri 1 Malang',
    );
    expect(state.rental.findRental(request.code)!.isVerifyingPayment, isTrue);

    await state.admin.confirmPayment(request.code);
    final paid = state.rental.findRental(request.code)!;
    expect(paid.status, RentalStatus.paid);
    expect(paid.paymentMethod, PaymentMethod.virtualAccount);
    // Terkirim, disetujui, lunas.
    expect(state.notification.unreadCount, unreadBefore + 3);
  });

  test(
    'tiket gratis langsung lunas; gratis & berbayar dipesan terpisah',
    () async {
      final state = await signedInState();
      final events = state.catalog.events;
      final free = events.firstWhere((e) => e.id == 'pameran-batik-kriya');
      final walkIn = events.firstWhere((e) => e.id == 'malang-djadoel-3');
      expect(free.isFreeTicket, isTrue, reason: 'kuota diisi + harga 0');
      expect(
        walkIn.isTicketed,
        isFalse,
        reason: 'kuota kosong = datang langsung',
      );
      expect(state.catalog.ticketedEvents.map((e) => e.id), contains(free.id));
      expect(
        state.catalog.ticketedEvents.map((e) => e.id),
        isNot(contains(walkIn.id)),
      );

      state.ticket
        ..saveBuyer(
          const BuyerInfo(
            name: 'Budi Santoso',
            email: 'budi.santoso@email.com',
            phone: '081234567890',
          ),
        )
        ..setQuantity(free.id, 2)
        ..setQuantity('wayang-bima-bungkus', 1);
      expect(state.ticket.isCartMixed, isTrue);
      await expectLater(state.ticket.placeOrder(), throwsA(anything));

      state.ticket.setQuantity('wayang-bima-bungkus', 0);
      expect(state.ticket.isCartFree, isTrue);
      final order = await state.ticket.placeOrder();
      expect(order.status, PaymentStatus.paid);
      expect(order.total, 0);
      expect(order.lines.single.ticketCodes, hasLength(2));
    },
  );

  testWidgets('alur ambil tiket gratis tanpa layar pembayaran', (tester) async {
    final state = await signedInState();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(TkbjApp(container: state));
    await tester.pumpAndSettle();
    final navigator = tester.state<NavigatorState>(
      find.byType(Navigator).first,
    );

    // Pola 2: datang langsung → tidak ada tombol pesan.
    navigator.pushNamed(AppRoutes.eventDetail, arguments: 'malang-djadoel-3');
    await tester.pumpAndSettle();
    expect(find.text('Gratis · datang langsung'), findsOneWidget);
    expect(find.text('Lihat Denah Lokasi'), findsOneWidget);
    navigator.pop();
    await tester.pumpAndSettle();

    // Pola 1: tiket gratis → detail → keranjang → data pemesan → e-tiket.
    navigator.pushNamed(
      AppRoutes.eventDetail,
      arguments: 'pameran-batik-kriya',
    );
    await tester.pumpAndSettle();
    await _tapText(tester, 'Ambil Tiket Gratis');
    await _tapText(tester, 'Ya, Ambil Tiket');
    await _tapText(tester, 'Ambil Tiket Gratis');
    expect(find.text('Lanjutkan Pembayaran →'), findsNothing);
    await _tapText(tester, 'Ambil Tiket Gratis →');
    expect(find.text('Tiket Gratis Aktif!'), findsOneWidget);
    expect(state.ticket.orders.first.status, PaymentStatus.paid);
  });

  test('pengajuan ditolak menyimpan catatan admin', () async {
    final state = await signedInState();
    await state.admin.rejectRental('SG-1026-0020');
    final rental = state.rental.findRental('SG-1026-0020')!;
    expect(rental.status, RentalStatus.rejected);
    expect(rental.adminNote, contains('bentrok'));
    expect(rental.fixes, isNotEmpty);
  });

  testWidgets('unggah berkas wajib lengkap sebelum pengajuan dikirim', (
    tester,
  ) async {
    final state = await signedInState();
    await _draftRental(state, 'Festival Tari');
    await _open(tester, state, AppRoutes.rentalDocuments);

    await _tapText(tester, 'Kirim Pengajuan');
    expect(
      find.text('Unggah KTP Penanggung Jawab terlebih dahulu.'),
      findsOneWidget,
    );

    for (final doc in RentalDocument.all) {
      await _tapText(tester, 'Unggah ${doc.label}');
    }
    await _tapText(tester, 'Kirim Pengajuan');
    expect(find.text('Centang pernyataan untuk melanjutkan.'), findsOneWidget);

    await _tapText(
      tester,
      'Saya menyatakan data dan dokumen yang diunggah adalah benar dan dapat '
      'dipertanggungjawabkan.',
    );
    await _tapText(tester, 'Kirim Pengajuan');
    expect(find.text('Pengajuan Terkirim'), findsOneWidget);
    expect(state.rental.rentals.first.status, RentalStatus.pending);
    expect(state.rental.rentals.first.activityName, 'Festival Tari');
  });

  testWidgets('cek jadwal menampilkan slot setelah tanggal dipilih', (
    tester,
  ) async {
    final state = await signedInState();
    state.rental.startRental(facility: pendopo);
    final (date, _) = await firstAvailableBooking(state, pendopo);
    state.rental.selectDate(date);
    await _open(tester, state, AppRoutes.rentalSchedule);

    expect(find.text('Venue dipilih'), findsOneWidget);
    expect(find.textContaining('Slot Waktu'), findsOneWidget);
    expect(find.text('Penuh'), findsWidgets);
  });

  testWidgets('daftar komunitas memvalidasi kategori dan persetujuan', (
    tester,
  ) async {
    final state = await signedInState();
    await _open(tester, state, AppRoutes.communityRegister);
    await _tapText(tester, 'Kirim Pendaftaran');
    expect(find.text('Pilih salah satu kategori.'), findsOneWidget);
    expect(find.text('Persetujuan wajib dicentang.'), findsOneWidget);
    expect(state.community.registrations, isEmpty);
  });

  testWidgets('filter galeri menampilkan kategori yang dipilih', (
    tester,
  ) async {
    await _open(tester, demoState(), AppRoutes.gallery);
    expect(find.text('Seni Wayang Semalam Suntuk'), findsOneWidget);
    final chip = find.widgetWithText(ChipFilter, 'Fasilitas');
    await tester.ensureVisible(chip);
    await tester.pumpAndSettle();
    await tester.tap(chip);
    await tester.pumpAndSettle();
    expect(find.text('Seni Wayang Semalam Suntuk'), findsNothing);
    expect(find.text('Gamelan Slendro Pelog'), findsOneWidget);
  });

  testWidgets('Tanya Krida menjawab, menampilkan tombol, dan membuka layar', (
    tester,
  ) async {
    final state = demoState();
    await _open(tester, state, AppRoutes.assistant);
    expect(find.text('Ada yang bisa Tanya Krida bantu?'), findsOneWidget);

    await _tapText(tester, 'Berapa tarif sewa Pendopo Agung?');
    expect(state.assistant.messages, hasLength(2));
    expect(find.textContaining('Rp 2.500.000'), findsOneWidget);
    expect(find.text('Berkas apa saja yang wajib?'), findsOneWidget);

    await _tapText(tester, 'Sewa Pendopo Agung TKBJ');
    expect(find.text('Sewa Fasilitas TKBJ'), findsWidgets);

    // Kembali: percakapan tetap tersimpan, lalu bisa dimulai baru.
    tester.state<NavigatorState>(find.byType(Navigator).first).pop();
    await tester.pumpAndSettle();
    expect(find.textContaining('Rp 2.500.000'), findsOneWidget);
    await tester.tap(find.byTooltip('Percakapan baru'));
    await tester.pumpAndSettle();
    expect(state.assistant.messages, isEmpty);
  });

  testWidgets('Tanya Krida menjelaskan sejarah tari & membuka materinya', (
    tester,
  ) async {
    final state = demoState();
    await _open(tester, state, AppRoutes.assistant);

    await _tapText(tester, 'Ceritakan sejarah Tari Topeng Malangan');
    expect(find.textContaining('cerita Panji'), findsOneWidget);
    await _tapText(tester, 'Baca materi Tari Topeng Malangan');
    // Layar detail Edukasi Budaya untuk materi yang sama.
    expect(find.text('Tari Topeng Malangan'), findsWidgets);
    expect(find.text('Ada yang bisa Tanya Krida bantu?'), findsNothing);
  });

  testWidgets('Tanya Krida: pertanyaan diketik, gagal, lalu coba lagi', (
    tester,
  ) async {
    final source = _FlakyAssistantDataSource();
    final state = AppContainer.demo(source: source, pickFile: fakePick);
    await _open(tester, state, AppRoutes.assistant);

    await tester.enterText(
      find.byKey(const ValueKey('assistant-input')),
      'Ada wayang kapan?',
    );
    await tester.pump();
    await tester.tap(find.byTooltip('Kirim'));
    await tester.pumpAndSettle();
    expect(state.assistant.messages.map((m) => m.text), [
      'Ada wayang kapan?',
      'Server AI sedang sibuk.',
    ]);
    expect(find.text('Gagal mendapat jawaban'), findsOneWidget);
    expect(find.text('Server AI sedang sibuk.'), findsOneWidget);

    await _tapText(tester, 'Coba lagi');
    expect(find.text('Gagal mendapat jawaban'), findsNothing);
    // Pertanyaan dikirim ulang sekali saja, tanpa pesan gagal di riwayat.
    expect(source.lastHistory.map((m) => m.text), ['Ada wayang kapan?']);
    expect(state.assistant.messages.where((m) => m.isUser), hasLength(1));
    expect(state.assistant.messages.last.isError, isFalse);
  });

  testWidgets('tandai semua notifikasi sudah dibaca', (tester) async {
    final state = await signedInState();
    await _open(tester, state, AppRoutes.notifications);
    expect(find.text('2 baru'), findsOneWidget);
    await _tapText(tester, 'Tandai Semua Sudah Dibaca');
    expect(state.notification.unreadCount, 0);
    expect(find.text('2 baru'), findsNothing);
  });

  test('materi edukasi dari dashboard: foto bawaan, unggahan, tanpa foto', () {
    final topic = CultureTopicModel.fromJson({
      'id': 'tari-remo',
      'title': 'Tari Remo',
      'category': 'Tari',
      'summary': 'Tari penyambutan khas Jawa Timur.',
      'headline': 'Tari pembuka pertunjukan ludruk.',
      'readMinutes': 6,
      'history': 'Tari Remo berasal dari Jombang.',
      'timelineTitle': 'Linimasa',
      'timeline': [
        {'label': '1950', 'text': 'Mulai dipentaskan.'},
      ],
      'philosophy': [
        {'symbol': '◆', 'title': 'Gerak kaki', 'text': 'Keberanian.'},
      ],
      'photos': ['wayang', 'https://cdn.tkbj.test/remo.jpg', 'tidak-dikenal'],
      'videoMinutes': 0,
      'video': {'url': 'https://youtu.be/abc', 'type': 'youtube'},
    });
    expect(topic.video?.type, CultureVideoType.youtube);
    expect(topic.video?.playsInApp, isFalse);
    expect(topic.photos, [
      AppImages.acaraWayang,
      'https://cdn.tkbj.test/remo.jpg',
    ]);
    expect(topic.imageAsset, AppImages.acaraWayang);
    expect(topic.timeline.single.label, '1950');
    expect(topic.philosophy.single.title, 'Gerak kaki');
    expect(
      CultureTopicModel.fromJson({'id': 'x', 'title': 'X', 'category': 'Musik'})
          .imageAsset,
      '',
    );
  });

  test('kategori Edukasi mengikuti materi yang terbit', () async {
    final state = AppContainer.demo(source: _CultureDataSource());
    await state.init();
    expect(state.education.categories, ['Semua', 'Tari']);
    expect(state.education.topicById('tari-remo')?.title, 'Tari Remo');
  });

  testWidgets('video berkas dari dashboard diputar di layar pemutar', (
    tester,
  ) async {
    final state = AppContainer.demo(source: _CultureDataSource());
    await _open(tester, state, AppRoutes.education);
    await _tapText(tester, 'Tari Remo');
    await _tapText(tester, 'Foto / Video');
    expect(find.text('Video dokumenter · 4 menit'), findsOneWidget);
    await _tapText(tester, 'Video dokumenter · 4 menit');
    expect(find.byType(VideoPlayerScreen), findsOneWidget);
  });

  testWidgets('Beranda menampilkan banner & kabar dari menu Konten', (
    tester,
  ) async {
    final state = AppContainer.demo(pickFile: fakePick);
    await _open(tester, state, AppRoutes.home);
    expect(find.text('Pekan Wayang Oktober di TKBJ'), findsOneWidget);
    expect(find.text('Kabar TKBJ'), findsOneWidget);
    await _tapText(tester, 'Mengenal Topeng Malangan dan tokoh Panji');
    expect(find.text('Artikel budaya'), findsOneWidget);
    expect(
      find.text('Kisah Panji dan makna warna topeng Malangan.'),
      findsOneWidget,
    );
  });

  test('profil lembaga, komunitas, dan video galeri dari dashboard', () {
    final meta = AppMetaModel.fromJson({
      'today': '2026-06-01',
      'eventCategories': ['Wayang'],
      'communityCategories': ['Seni musik'],
      'tickets': {'maxPerEvent': 4, 'payDeadlineHours': 24},
      'bankAccount': {'bank': 'Bank Jatim', 'account': '001'},
      'profile': {'hours': 'Setiap hari · 08.00–20.00 WIB', 'about': ''},
    });
    expect(meta.profile.hours, 'Setiap hari · 08.00–20.00 WIB');
    expect(meta.profile.address, isNotEmpty, reason: 'kolom kosong → bawaan');

    final community = CommunityModel.fromJson({
      'id': 'sanggar',
      'name': 'Sanggar Uji',
      'category': 'Seni musik',
      'city': 'Malang',
      'members': 12,
      'contact': '0812',
      'description': 'Deskripsi dari admin.',
      'address': 'Jl. Uji 1',
      'schedule': [
        {'day': 'Sabtu', 'time': '15.00–17.00'},
      ],
      'performances': '12 pentas',
    });
    expect(community.about, 'Deskripsi dari admin.');
    expect(community.schedule, [('Sabtu', '15.00–17.00')]);
    expect(community.performances, '12 pentas');
    expect(community.address, 'Jl. Uji 1');

    final media = [
      {
        'id': 'v1',
        'title': 'Video Wayang',
        'collection': 'Wayang',
        'date': '2026-05-01',
        'type': 'Video',
        'url': 'https://cdn.tkbj.test/wayang.mp4',
        'credit': 'Tim TKBJ',
      },
      {
        'id': 'f1',
        'title': 'Foto Wayang',
        'collection': 'Wayang',
        'date': '2026-05-01',
        'type': 'Foto',
        'url': 'https://cdn.tkbj.test/wayang.jpg',
        'credit': 'Tim TKBJ',
      },
    ];
    final video = GalleryItemModel.fromJson(media[0], media);
    expect(video.videos, ['https://cdn.tkbj.test/wayang.mp4']);
    expect(video.photos, ['https://cdn.tkbj.test/wayang.jpg']);
    expect(GalleryItemModel.fromJson(media[1], media).videos, hasLength(1));
  });

  testWidgets('akun dinonaktifkan admin: keluar otomatis & alasannya tampil', (
    tester,
  ) async {
    final source = _DisabledAccountDataSource();
    final state = AppContainer.demo(source: source, pickFile: fakePick);
    await state.init();
    await state.auth.login('budi.santoso@email.com', 'tkbj2026');
    expect(state.auth.isLoggedIn, isTrue);

    // Admin menonaktifkan akun → permintaan berikutnya ditolak 401.
    source.disabled = true;
    await state.auth.refreshAccount();
    expect(state.auth.isLoggedIn, isFalse);

    await _open(tester, state, AppRoutes.login);
    expect(
      find.textContaining('dinonaktifkan oleh pengelola TKBJ'),
      findsOneWidget,
    );
  });

  testWidgets('Edukasi menampilkan pesan & tombol coba lagi saat gagal', (
    tester,
  ) async {
    // Gagal saat aplikasi dibuka dan saat layar Edukasi memuat ulang.
    final source = _CultureDataSource(failures: 2);
    final state = AppContainer.demo(source: source);
    await _open(tester, state, AppRoutes.education);
    expect(find.text('Gagal memuat data'), findsOneWidget);
    await _tapText(tester, 'Coba Lagi');
    expect(find.text('Tari Remo'), findsOneWidget);
  });
}

/// Server berisi satu materi edukasi buatan admin; [failures] = jumlah
/// permintaan pertama yang gagal (server mati).
class _CultureDataSource extends DemoDataSource {
  _CultureDataSource({this.failures = 0});

  final int failures;
  int calls = 0;

  @override
  Future<List<CultureTopic>> cultureTopics() async {
    if (calls++ < failures) {
      throw const ApiException(0, 'Tidak dapat terhubung ke server.');
    }
    return const [
      CultureTopic(
        id: 'tari-remo',
        title: 'Tari Remo',
        category: 'Tari',
        summary: 'Tari penyambutan khas Jawa Timur.',
        headline: 'Tari pembuka pertunjukan ludruk.',
        readMinutes: 6,
        history: 'Tari Remo berasal dari Jombang.',
        timelineTitle: 'Linimasa',
        timeline: [],
        philosophy: [],
        photos: [],
        videoMinutes: 4,
        video: CultureVideo(
          'https://cdn.tkbj.test/remo.mp4',
          CultureVideoType.file,
        ),
      ),
    ];
  }
}

/// Data source demo yang gagal pada pertanyaan pertama ke Tanya Krida.
class _FlakyAssistantDataSource extends DemoDataSource {
  int calls = 0;
  List<AssistantMessage> lastHistory = const [];

  @override
  Future<AssistantMessage> askAssistant(List<AssistantMessage> history) {
    lastHistory = List.of(history);
    if (calls++ == 0) {
      throw const ApiException(503, 'Server AI sedang sibuk.');
    }
    return super.askAssistant(history);
  }
}

/// Akun yang dinonaktifkan admin di dashboard saat aplikasi sedang dipakai.
class _DisabledAccountDataSource extends DemoDataSource {
  bool disabled = false;

  @override
  Future<List<AppNotification>> notifications() {
    if (disabled) {
      throw const ApiException(
        401,
        'Akun Anda dinonaktifkan oleh pengelola TKBJ. Hubungi TKBJ untuk '
        'informasi lebih lanjut.',
      );
    }
    return super.notifications();
  }
}
