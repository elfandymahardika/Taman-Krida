import '../../domain/entities/app_meta.dart';
import '../../domain/entities/rental_request.dart';
import 'json.dart';

/// GET /api/meta.
class AppMetaModel extends AppMeta {
  const AppMetaModel({
    required super.today,
    required super.eventCategories,
    required super.communityCategories,
    required super.maxTicketsPerEvent,
    required super.payDeadlineHours,
    required super.bank,
    required super.account,
    super.profile,
  });

  factory AppMetaModel.fromJson(Json json) {
    final tickets = json['tickets'] as Json;
    final bank = json['bankAccount'] as Json;
    return AppMetaModel(
      today: DateTime.parse(json['today'] as String),
      eventCategories: ['Semua', ...(json['eventCategories'] as List).cast()],
      communityCategories: (json['communityCategories'] as List).cast(),
      maxTicketsPerEvent: tickets['maxPerEvent'] as int,
      payDeadlineHours: tickets['payDeadlineHours'] as int,
      bank: bank['bank'] as String,
      account: bank['account'] as String,
      profile: _profile(json['profile']),
    );
  }

  /// Profil lembaga dari dashboard; kolom kosong memakai isi bawaan.
  static InstitutionProfile _profile(Object? json) {
    const d = InstitutionProfile.fallback;
    if (json is! Json) return d;
    String text(String key, String fallback) {
      final value = (json[key] as String?)?.trim() ?? '';
      return value.isEmpty ? fallback : value;
    }

    return InstitutionProfile(
      name: text('name', d.name),
      manager: text('manager', d.manager),
      address: text('address', d.address),
      phone: text('phone', d.phone),
      whatsapp: text('whatsapp', ''),
      hours: text('hours', d.hours),
      about: text('about', d.about),
    );
  }
}

/// GET /api/rentals/availability → slot per tanggal.
abstract final class AvailabilityModel {
  static Availability fromJson(Json json) => {
    for (final day in (json['days'] as List).cast<Json>())
      day['date'] as String: {
        for (final slot in RentalSlot.values)
          slot: SlotState.values.byName(
            (day['slots'] as Json)[slot.name] as String,
          ),
      },
  };
}
