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
    this.mapPosition,
    this.rentalRate,
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
  /// `null` untuk area baru dari admin yang belum punya titik di denah.
  final Offset? mapPosition;

  /// Tarif sewa per pemakaian (satu slot), ditagihkan setelah admin
  /// menyetujui. `null` jika fasilitas tidak dapat disewa.
  final int? rentalRate;

  /// Jumlah kursi, mis. 500 (dipakai di ringkasan venue terpilih).
  final int? seatCount;

  /// Keterangan kapasitas pada kartu pilih venue.
  final String? rentalCapacityLabel;

  bool get isRentable => rentalRate != null;
}
