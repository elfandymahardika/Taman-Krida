import '../entities/uploaded_file.dart';
import '../repositories/file_repository.dart';

class PickFileUseCase {
  const PickFileUseCase(this._repository);

  final FileRepository _repository;

  Future<UploadedFile?> call({required bool imagesOnly}) =>
      _repository.pickFile(imagesOnly: imagesOnly);
}
