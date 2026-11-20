import '../../../core/utils/formatters.dart';
import '../../../domain/entities/app_meta.dart';
import '../../../domain/entities/facility.dart';
import '../../../domain/entities/rental_request.dart';
import '../../../domain/entities/ticket_order.dart';
import '../../models/app_meta_model.dart';
import '../../models/facility_model.dart';
import '../../models/json.dart';
import '../../models/rental_request_model.dart';
import 'api_client.dart';
import 'facility_cache.dart';

/// Sumber data sewa gedung.
abstract interface class RentalRemoteDataSource {
  Future<Availability> availability(Facility facility, DateTime month);
  Future<List<RentalRequest>> rentals();
  Future<RentalRequest> submitRental(RentalDraft draft);
  Future<RentalRequest> payRental(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  );
}

class RentalRemoteDataSourceImpl implements RentalRemoteDataSource {
  RentalRemoteDataSourceImpl(this._api, this._cache);

  final ApiClient _api;
  final FacilityCache _cache;

  @override
  Future<Availability> availability(Facility facility, DateTime month) async =>
      AvailabilityModel.fromJson(
        await _api.get(
          '/rentals/availability',
          query: {
            'facilityId': facility.id,
            'month': '${month.year}-${Formatters.twoDigits(month.month)}',
          },
        ) as Json,
      );

  @override
  Future<List<RentalRequest>> rentals() async {
    if (_cache.facilities.isEmpty) {
      final list = await _api.get('/facilities') as List;
      _cache.facilities = FacilityModel.listFromJson(list.cast<Json>());
    }
    final list = await _api.get('/rentals') as List;
    return [for (final j in list.cast<Json>()) _rental(j)];
  }

  @override
  Future<RentalRequest> submitRental(RentalDraft draft) async => _rental(
    await _api.postMultipart(
      '/rentals',
      fields: RentalRequestModel.draftFields(draft),
      files: draft.documents,
    ) as Json,
  );

  @override
  Future<RentalRequest> payRental(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async => _rental(
    await _api.postMultipart(
      '/rentals/$code/payment',
      fields: {'method': method.shortLabel, 'sender': sender},
      files: {'file': proof},
    ) as Json,
  );

  RentalRequest _rental(Json json) =>
      RentalRequestModel.fromJson(json, facilityOf: _facilityNamed);

  /// Venue sewa → fasilitas dari daftar terakhir (atau tiruan bila tidak ada).
  Facility _facilityNamed(String venue, int amount) {
    for (final f in _cache.facilities) {
      if (f.name == venue) return f;
    }
    return FacilityModel.placeholder(venue, amount);
  }
}
