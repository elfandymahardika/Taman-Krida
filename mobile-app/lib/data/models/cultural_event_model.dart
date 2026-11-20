import '../../domain/entities/cultural_event.dart';
import 'json.dart';
import 'visuals.dart';

/// Acara dari API, lengkap dengan aset visual aplikasi.
class CulturalEventModel extends CulturalEvent {
  const CulturalEventModel({
    required super.id,
    required super.category,
    required super.title,
    required super.shortTitle,
    required super.performer,
    required super.description,
    required super.date,
    required super.startTime,
    required super.endTime,
    required super.venue,
    required super.venueShort,
    required super.imageAsset,
    required super.price,
    required super.quotaTotal,
    required super.quotaLeft,
  });

  /// Satu acara dari GET /api/events.
  factory CulturalEventModel.fromJson(Json j) {
    final venue = j['venue'] as String;
    final organizer = j['organizer'] as String;
    final ticketed = j['ticketed'] as bool;
    return CulturalEventModel(
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

  /// Acara ringkas di dalam baris pesanan tiket (`lines[]`).
  factory CulturalEventModel.fromTicketLine(Json l) {
    final venue = l['venue'] as String? ?? '';
    return CulturalEventModel(
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
}
