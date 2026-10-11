import 'dart:ui';

/// Fasilitas/venue TKBJ yang tampil di denah dan bisa disewa.
class Facility {
  const Facility({
    required this.id,
    required this.number,
    required this.name,
    required this.shortName,
    required this.description,
    required this.capacityLabel,
    required this.imageAsset,
    required this.mapPosition,
    this.ratePerHour,
    this.seatCount,
    this.rentalCapacityLabel,
  });

  final String id;
  final int number;
  final String name;
  final String shortName;
  final String description;
  final String capacityLabel;
  final String imageAsset;

  /// Posisi pin pada peta denah, relatif terhadap lebar & tinggi peta (0–1).
  final Offset mapPosition;

  /// Tarif sewa per jam. `null` jika fasilitas tidak dapat disewa.
  final int? ratePerHour;

  /// Jumlah kursi, mis. 500 (dipakai di ringkasan venue terpilih).
  final int? seatCount;

  /// Keterangan kapasitas pada kartu pilih venue.
  final String? rentalCapacityLabel;

  bool get isRentable => ratePerHour != null;
}
