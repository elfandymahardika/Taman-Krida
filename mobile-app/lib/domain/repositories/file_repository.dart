import '../entities/uploaded_file.dart';

/// Kontrak pemilihan berkas dari perangkat (dokumen sewa, bukti transfer).
abstract interface class FileRepository {
  /// `null` bila pengguna membatalkan.
  Future<UploadedFile?> pickFile({required bool imagesOnly});
}
