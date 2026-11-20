import 'package:flutter/foundation.dart';

import '../../domain/entities/uploaded_file.dart';
import '../../domain/usecases/file_usecases.dart';

/// Memilih berkas dari perangkat (dokumen sewa, bukti transfer).
class UploadController extends ChangeNotifier {
  UploadController({required this._pickFile});

  final PickFileUseCase _pickFile;

  /// `null` bila pengguna membatalkan.
  Future<UploadedFile?> pickFile({required bool imagesOnly}) =>
      _pickFile(imagesOnly: imagesOnly);
}
