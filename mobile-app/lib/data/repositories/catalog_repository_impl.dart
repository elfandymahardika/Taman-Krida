import '../../domain/entities/app_meta.dart';
import '../../domain/entities/community.dart';
import '../../domain/entities/cultural_event.dart';
import '../../domain/entities/facility.dart';
import '../../domain/entities/gallery_item.dart';
import '../../domain/repositories/catalog_repository.dart';
import '../datasources/remote/catalog_remote_data_source.dart';
import 'guard.dart';

class CatalogRepositoryImpl implements CatalogRepository {
  const CatalogRepositoryImpl(this._remote);

  final CatalogRemoteDataSource _remote;

  @override
  Future<AppMeta> getMeta() => guard(_remote.meta);

  @override
  Future<List<CulturalEvent>> getEvents() => guard(_remote.events);

  @override
  Future<List<Facility>> getFacilities() => guard(_remote.facilities);

  @override
  Future<List<Community>> getCommunities() => guard(_remote.communities);

  @override
  Future<List<GalleryItem>> getGallery() => guard(_remote.gallery);
}
