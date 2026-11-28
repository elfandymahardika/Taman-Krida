import '../../../domain/entities/app_meta.dart';
import '../../../domain/entities/community.dart';
import '../../../domain/entities/cultural_event.dart';
import '../../../domain/entities/facility.dart';
import '../../../domain/entities/gallery_item.dart';
import '../../../domain/entities/news_item.dart';
import '../../models/app_meta_model.dart';
import '../../models/community_model.dart';
import '../../models/cultural_event_model.dart';
import '../../models/facility_model.dart';
import '../../models/gallery_item_model.dart';
import '../../models/json.dart';
import '../../models/news_item_model.dart';
import 'api_client.dart';
import 'facility_cache.dart';

/// Sumber data publik. Melempar `ApiException` bila server gagal.
abstract interface class CatalogRemoteDataSource {
  Future<AppMeta> meta();
  Future<List<CulturalEvent>> events();
  Future<List<Facility>> facilities();
  Future<List<Community>> communities();
  Future<List<GalleryItem>> gallery();

  /// Konten terpublikasi dari menu Konten dashboard.
  Future<List<NewsItem>> news();
}

/// Data publik dari API mobile (backend/mobile-app).
class CatalogRemoteDataSourceImpl implements CatalogRemoteDataSource {
  CatalogRemoteDataSourceImpl(this._api, this._cache);

  final ApiClient _api;
  final FacilityCache _cache;

  @override
  Future<AppMeta> meta() async =>
      AppMetaModel.fromJson(await _api.get('/meta') as Json);

  @override
  Future<List<CulturalEvent>> events() async {
    // all=1: termasuk acara yang sudah lewat, agar bulan sebelumnya tetap
    // bisa dilihat di kalender.
    final list = await _api.get('/events', query: {'all': '1'}) as List;
    return list.cast<Json>().map(CulturalEventModel.fromJson).toList();
  }

  @override
  Future<List<Facility>> facilities() async {
    final list = await _api.get('/facilities') as List;
    return _cache.facilities = FacilityModel.listFromJson(list.cast<Json>());
  }

  @override
  Future<List<Community>> communities() async {
    final list = await _api.get('/communities') as List;
    return list.cast<Json>().map(CommunityModel.fromJson).toList();
  }

  @override
  Future<List<GalleryItem>> gallery() async {
    final media = (await _api.get('/gallery') as List).cast<Json>();
    return [for (final m in media) GalleryItemModel.fromJson(m, media)];
  }

  @override
  Future<List<NewsItem>> news() async {
    final list = await _api.get('/contents') as List;
    return list.cast<Json>().map(NewsItemModel.fromJson).toList();
  }
}
