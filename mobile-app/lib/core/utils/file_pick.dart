import 'package:file_picker/file_picker.dart';

import '../../data/models/rental_request.dart';

/// Membuka pemilih berkas. `null` = dibatalkan pengguna.
/// Bisa diganti di test (lihat `AppState.pickFile`).
typedef FilePick = Future<UploadedFile?> Function({required bool imagesOnly});

/// Batas ukuran berkas di server (sama dengan Multer di backend).
const maxUploadBytes = 5 * 1024 * 1024;

/// Pemilih berkas bawaan perangkat: JPG/PNG/WEBP, plus PDF untuk dokumen.
Future<UploadedFile?> pickWithSystemPicker({required bool imagesOnly}) async {
  final files = await FilePicker.pickFiles(
    type: FileType.custom,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', if (!imagesOnly) 'pdf'],
  );
  if (files.isEmpty) return null;
  final file = files.single;
  return UploadedFile.fromBytes(file.name, await file.readAsBytes());
}
