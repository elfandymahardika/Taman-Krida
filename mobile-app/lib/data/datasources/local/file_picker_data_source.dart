import 'package:file_picker/file_picker.dart';

import '../../../domain/entities/uploaded_file.dart';

/// Membuka pemilih berkas. `null` = dibatalkan pengguna.
/// Bisa diganti di test dengan pemilih palsu.
typedef FilePick = Future<UploadedFile?> Function({required bool imagesOnly});

/// Sumber berkas dari perangkat (dokumen sewa, bukti transfer).
abstract interface class FilePickerDataSource {
  Future<UploadedFile?> pick({required bool imagesOnly});
}

/// Pemilih berkas bawaan perangkat: JPG/PNG/WEBP, plus PDF untuk dokumen.
/// [pick] bisa diganti (test memakai berkas palsu).
class FilePickerDataSourceImpl implements FilePickerDataSource {
  const FilePickerDataSourceImpl([this._pick = pickWithSystemPicker]);

  final FilePick _pick;

  @override
  Future<UploadedFile?> pick({required bool imagesOnly}) =>
      _pick(imagesOnly: imagesOnly);
}

Future<UploadedFile?> pickWithSystemPicker({required bool imagesOnly}) async {
  final files = await FilePicker.pickFiles(
    type: FileType.custom,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', if (!imagesOnly) 'pdf'],
  );
  if (files.isEmpty) return null;
  final file = files.single;
  return UploadedFile.fromBytes(file.name, await file.readAsBytes());
}
