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
