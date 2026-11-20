/// Agenda pertunjukan atau pameran di TKBJ.
class CulturalEvent {
  const CulturalEvent({
    required this.id,
    required this.category,
    required this.title,
    required this.shortTitle,
    required this.performer,
    required this.description,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.venue,
    required this.venueShort,
    required this.imageAsset,
    required this.price,
    required this.quotaTotal,
    required this.quotaLeft,
  });

  final String id;
  final String category;
  final String title;

  /// Judul ringkas untuk kartu tiket & keranjang.
  final String shortTitle;
  final String performer;
  final String description;
  final DateTime date;
  final String startTime;
  final String endTime;
  final String venue;

  /// Nama venue singkat, mis. "Terbuka" atau "Pendopo".
  final String venueShort;
  final String imageAsset;

  /// Harga per tiket dalam rupiah. 0 berarti acara gratis tanpa tiket.
  final int price;
  final int quotaTotal;
  final int quotaLeft;

  bool get isTicketed => price > 0;
}
