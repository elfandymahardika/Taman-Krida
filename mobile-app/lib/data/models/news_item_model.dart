import '../../domain/entities/news_item.dart';
import 'json.dart';

/// Konten terpublikasi dari dashboard (GET /api/contents).
class NewsItemModel extends NewsItem {
  const NewsItemModel({
    required super.id,
    required super.title,
    required super.type,
    required super.summary,
    required super.body,
    required super.updatedAt,
    super.cta,
    super.link,
    super.isHero,
  });

  factory NewsItemModel.fromJson(Json j) {
    String? text(String key) {
      final value = (j[key] as String?)?.trim();
      return value == null || value.isEmpty ? null : value;
    }

    return NewsItemModel(
      id: j['id'] as String,
      title: j['title'] as String,
      type: j['type'] as String,
      summary: text('summary') ?? '',
      body: text('body') ?? '',
      updatedAt: parseDate(j['updatedAt']),
      cta: text('cta'),
      link: text('link'),
      isHero: j['isHero'] == true,
    );
  }
}
