/// Sanggar atau komunitas seni pada Direktori Komunitas.
class Community {
  const Community({
    required this.id,
    required this.name,
    required this.category,
    required this.specialization,
    required this.phone,
    required this.imageAsset,
    required this.headline,
    required this.foundedYear,
    required this.members,
    required this.performances,
    required this.about,
    required this.schedule,
    required this.place,
    required this.leader,
    required this.address,
  });

  final String id;
  final String name;

  /// Tari, Wayang, Ketoprak, atau Jaranan.
  final String category;
  final String specialization;
  final String phone;
  final String imageAsset;
  final String headline;
  final int foundedYear;
  final int members;
  final String performances;
  final String about;

  /// Pasangan (hari, jam) latihan rutin.
  final List<(String, String)> schedule;
  final String place;
  final String leader;
  final String address;
}

/// Pendaftaran komunitas baru dari form "Daftarkan Komunitas".
class CommunityRegistration {
  const CommunityRegistration({
    required this.name,
    required this.category,
    required this.leader,
    required this.phone,
    required this.address,
    required this.description,
    required this.submittedAt,
  });

  final String name;
  final String category;
  final String leader;
  final String phone;
  final String address;
  final String description;
  final DateTime submittedAt;
}
