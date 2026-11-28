import '../../domain/entities/culture_topic.dart';
import 'json.dart';
import 'visuals.dart';

/// Materi Edukasi Budaya (GET /api/culture), dikelola admin di dashboard.
class CultureTopicModel extends CultureTopic {
  const CultureTopicModel({
    required super.id,
    required super.title,
    required super.category,
    required super.summary,
    required super.headline,
    required super.readMinutes,
    required super.history,
    required super.timelineTitle,
    required super.timeline,
    required super.philosophy,
    required super.photos,
    required super.videoMinutes,
    super.video,
  });

  factory CultureTopicModel.fromJson(Json m) {
    List<Json> list(String key) => (m[key] as List? ?? const []).cast<Json>();
    return CultureTopicModel(
      id: m['id'] as String,
      title: m['title'] as String,
      category: m['category'] as String,
      summary: m['summary'] as String? ?? '',
      headline: m['headline'] as String? ?? '',
      readMinutes: (m['readMinutes'] as num?)?.toInt() ?? 5,
      history: m['history'] as String? ?? '',
      timelineTitle: m['timelineTitle'] as String? ?? 'Linimasa',
      timeline: [
        for (final p in list('timeline'))
          TimelinePoint(p['label'] as String, p['text'] as String),
      ],
      philosophy: [
        for (final p in list('philosophy'))
          PhilosophyPoint(
            p['symbol'] as String? ?? '◆',
            p['title'] as String,
            p['text'] as String,
          ),
      ],
      // Kunci foto bawaan (mis. "wayang") → aset; unggahan admin → URL.
      photos: [
        for (final key in (m['photos'] as List? ?? const []).cast<String>())
          ?Visuals.photo(key),
      ],
      videoMinutes: (m['videoMinutes'] as num?)?.toInt() ?? 0,
      video: _video(m['video']),
    );
  }

  /// `{url, type: file|youtube|link}` → [CultureVideo]; jenis tak dikenal
  /// dibuka di browser.
  static CultureVideo? _video(Object? json) {
    if (json is! Json || json['url'] is! String) return null;
    final type = CultureVideoType.values.asNameMap()[json['type']];
    return CultureVideo(json['url'] as String, type ?? CultureVideoType.link);
  }
}
