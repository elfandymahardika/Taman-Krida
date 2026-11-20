import '../../../domain/entities/culture_topic.dart';
import 'culture_data.dart';

/// Materi Edukasi Budaya yang dibundel di aplikasi (tidak dari server).
abstract interface class CultureLocalDataSource {
  List<CultureTopic> topics();
  List<String> categories();
}

class CultureLocalDataSourceImpl implements CultureLocalDataSource {
  const CultureLocalDataSourceImpl();

  @override
  List<CultureTopic> topics() => CultureData.topics;

  @override
  List<String> categories() => CultureData.categories;
}
