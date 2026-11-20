import '../../domain/entities/uploaded_file.dart';
import '../../domain/repositories/file_repository.dart';
import '../datasources/local/file_picker_data_source.dart';

class FileRepositoryImpl implements FileRepository {
  const FileRepositoryImpl(this._local);

  final FilePickerDataSource _local;

  @override
  Future<UploadedFile?> pickFile({required bool imagesOnly}) =>
      _local.pick(imagesOnly: imagesOnly);
}
