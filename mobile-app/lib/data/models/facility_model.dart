import '../../core/constants/app_assets.dart';
import '../../domain/entities/facility.dart';
import 'json.dart';
import 'visuals.dart';

/// Fasilitas dari API, digabung dengan tata letak denah aplikasi.
class FacilityModel extends Facility {
  const FacilityModel({
    required super.id,
    required super.number,
    required super.name,
    required super.shortName,
    required super.description,
    required super.capacityLabel,
    required super.imageAsset,
    super.mapPosition,
    super.rentalRate,
    super.seatCount,
    super.rentalCapacityLabel,
  });

  /// [index] = nomor urut (mulai 1) bila fasilitas belum punya titik denah.
  factory FacilityModel.fromJson(Json j, int index) {
    final id = j['id'] as String;
    final layout = Visuals.facilityLayouts[id];
    final capacity = j['capacity'] as int?;
    final purpose = j['purpose'] as String;
    return FacilityModel(
      id: id,
      number: layout?.number ?? index,
      name: j['name'] as String,
      shortName: layout?.shortName ?? j['name'] as String,
      description: layout?.description ?? purpose,
      capacityLabel: capacity == null
          ? purpose
          : 'Kapasitas hingga $capacity orang',
      imageAsset:
          layout?.imageAsset ??
          Visuals.photo(j['photo'] as String?) ??
          AppImages.fasilitasParkir,
      mapPosition: layout?.mapPosition,
      rentalRate: j['rentalRate'] as int?,
      seatCount: capacity,
      rentalCapacityLabel: capacity == null
          ? purpose
          : 'Kapasitas hingga $capacity orang · $purpose',
    );
  }

  /// Daftar GET /api/facilities.
  static List<Facility> listFromJson(List<Json> rows) => [
    for (var i = 0; i < rows.length; i++)
      FacilityModel.fromJson(rows[i], i + 1),
  ];

  /// Venue sewa yang tidak ada di daftar fasilitas (mis. dicatat admin).
  factory FacilityModel.placeholder(String venue, int? rate) => FacilityModel(
    id: venue,
    number: 0,
    name: venue,
    shortName: Visuals.venueShort(venue),
    description: venue,
    capacityLabel: venue,
    imageAsset: Visuals.venueImage(venue),
    rentalRate: rate,
  );
}
