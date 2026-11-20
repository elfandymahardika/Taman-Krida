import '../entities/app_meta.dart';
import '../entities/community.dart';
import '../entities/cultural_event.dart';
import '../entities/facility.dart';
import '../entities/gallery_item.dart';
import '../repositories/catalog_repository.dart';

/// Memuat seluruh data publik: aturan aplikasi dulu, lalu acara, fasilitas,
/// komunitas, dan galeri secara paralel.
class GetCatalogUseCase {
  const GetCatalogUseCase(this._repository);

  final CatalogRepository _repository;

  Future<Catalog> call() async {
    final meta = await _repository.getMeta();
    // Future.wait (bukan record `.wait`) agar Failure pertama diteruskan apa
    // adanya, tidak dibungkus ParallelWaitError.
    final results = await Future.wait<List<Object>>([
      _repository.getEvents(),
      _repository.getFacilities(),
      _repository.getCommunities(),
      _repository.getGallery(),
    ]);
    return Catalog(
      meta: meta,
      events: results[0] as List<CulturalEvent>,
      facilities: results[1] as List<Facility>,
      communities: results[2] as List<Community>,
      gallery: results[3] as List<GalleryItem>,
    );
  }
}

/// Memuat ulang daftar acara saja (mis. kuota setelah checkout).
class GetEventsUseCase {
  const GetEventsUseCase(this._repository);

  final CatalogRepository _repository;

  Future<List<CulturalEvent>> call() => _repository.getEvents();
}
