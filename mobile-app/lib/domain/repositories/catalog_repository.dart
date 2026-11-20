import '../entities/app_meta.dart';
import '../entities/community.dart';
import '../entities/cultural_event.dart';
import '../entities/facility.dart';
import '../entities/gallery_item.dart';

/// Kontrak data publik: acara, fasilitas, komunitas, galeri, dan aturan
/// aplikasi. Diimplementasikan di layer data (`CatalogRepositoryImpl`).
abstract interface class CatalogRepository {
  Future<AppMeta> getMeta();
  Future<List<CulturalEvent>> getEvents();
  Future<List<Facility>> getFacilities();
  Future<List<Community>> getCommunities();
  Future<List<GalleryItem>> getGallery();
}
