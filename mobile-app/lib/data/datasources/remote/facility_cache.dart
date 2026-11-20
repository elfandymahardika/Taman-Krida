import '../../../domain/entities/facility.dart';

/// Daftar fasilitas terakhir dari server, dipakai bersama oleh data source
/// katalog (pengisi) dan sewa (mencocokkan nama venue pada pengajuan).
class FacilityCache {
  List<Facility> facilities = const [];
}
