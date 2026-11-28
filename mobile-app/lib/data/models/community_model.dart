import '../../core/constants/app_assets.dart';
import '../../domain/entities/community.dart';
import 'json.dart';
import 'visuals.dart';

/// Komunitas pada direktori (GET /api/communities).
class CommunityModel extends Community {
  const CommunityModel({
    required super.id,
    required super.name,
    required super.category,
    required super.specialization,
    required super.phone,
    required super.imageAsset,
    required super.headline,
    required super.foundedYear,
    required super.members,
    required super.performances,
    required super.about,
    required super.schedule,
    required super.place,
    required super.leader,
    required super.address,
  });

  factory CommunityModel.fromJson(Json j) {
    String? text(String key) {
      final value = (j[key] as String?)?.trim();
      return value == null || value.isEmpty ? null : value;
    }

    final since = j['since'] as String?;
    final city = j['city'] as String;
    final category = j['category'] as String;
    return CommunityModel(
      id: j['id'] as String,
      name: j['name'] as String,
      category: category,
      specialization: category,
      phone: j['contact'] as String,
      imageAsset:
          Visuals.photo(j['photo'] as String?) ?? AppImages.latihanSanggar,
      headline: '$category · $city',
      foundedYear:
          int.tryParse(RegExp(r'\d{4}').stringMatch(since ?? '') ?? '') ?? 0,
      members: j['members'] as int,
      // Profil, jadwal latihan, dan jumlah pentas diisi admin di dashboard.
      performances: text('performances') ?? '–',
      about:
          text('description') ??
          '${j['name']} adalah komunitas $category dari $city yang terdaftar '
              'di direktori Taman Krida Budaya Jawa Timur.',
      schedule: [
        for (final s in (j['schedule'] as List? ?? const []).cast<Json>())
          (s['day'] as String, s['time'] as String),
      ],
      place: text('address') ?? city,
      leader: text('leader') ?? '–',
      address: text('address') ?? city,
    );
  }
}

/// Pendaftaran komunitas milik akun (GET /api/me/communities).
class CommunityRegistrationModel extends CommunityRegistration {
  const CommunityRegistrationModel({
    required super.name,
    required super.category,
    required super.leader,
    required super.phone,
    required super.address,
    required super.description,
    required super.submittedAt,
    super.id,
    super.status,
    super.adminNote,
  });

  factory CommunityRegistrationModel.fromJson(Json j) =>
      CommunityRegistrationModel(
        id: j['id'] as String,
        name: j['name'] as String,
        category: j['category'] as String,
        leader: j['leader'] as String? ?? '',
        phone: j['contact'] as String,
        address: j['address'] as String,
        description: j['description'] as String,
        submittedAt: parseDateOrNull(j['appliedAt']) ?? DateTime.now(),
        status: j['status'] as String,
        adminNote: j['adminNote'] as String?,
      );

  /// Body POST /api/communities.
  static Json toJson(CommunityRegistration r) => {
    'name': r.name,
    'category': r.category,
    'leader': r.leader,
    'phone': r.phone,
    'address': r.address,
    'description': r.description,
  };
}
