/// Lokasi Taman Krida Budaya Jawa Timur di OpenStreetMap
/// (way 195460627, Jl. Soekarno Hatta No. 7, Malang).
abstract final class TkbjLocation {
  /// Titik tengah area TKBJ (lintang, bujur).
  static const center = (-7.94272, 112.62257);

  /// Batas lahan TKBJ, disalin dari geometri OSM way 195460627.
  static const boundary = [
    (-7.942451, 112.621787),
    (-7.943162, 112.622405),
    (-7.943181, 112.622384),
    (-7.943303, 112.622245),
    (-7.943329, 112.622291),
    (-7.943374, 112.622379),
    (-7.943470, 112.622548),
    (-7.943544, 112.622678),
    (-7.942961, 112.623351),
    (-7.942130, 112.622626),
    (-7.941899, 112.622421),
  ];

  /// Ubin peta OpenStreetMap standar.
  static const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  /// Kebijakan ubin OSM mewajibkan identitas aplikasi.
  static const userAgentPackage = 'id.tkbj.tkbj_mobile';
}
