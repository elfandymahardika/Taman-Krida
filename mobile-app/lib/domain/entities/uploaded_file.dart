import 'dart:typed_data';

import '../../core/utils/formatters.dart';

/// Batas ukuran berkas unggahan (sama dengan Multer di backend).
const maxUploadBytes = 5 * 1024 * 1024;

/// Berkas yang dipilih pengguna (dokumen sewa / bukti transfer).
/// [bytes] berisi isi berkas yang dikirim ke server.
class UploadedFile {
  const UploadedFile({
    required this.fileName,
    required this.sizeLabel,
    required this.type,
    this.bytes,
    this.mimeType,
  });

  /// Berkas dari pemilih file: label ukuran & jenis dihitung dari isinya.
  factory UploadedFile.fromBytes(String fileName, Uint8List bytes) {
    final ext = fileName.split('.').last.toLowerCase();
    final mime = switch (ext) {
      'pdf' => 'application/pdf',
      'png' => 'image/png',
      'webp' => 'image/webp',
      _ => 'image/jpeg',
    };
    return UploadedFile(
      fileName: fileName,
      sizeLabel: Formatters.fileSize(bytes.length),
      type: ext == 'jpeg' ? 'JPG' : ext.toUpperCase(),
      bytes: bytes,
      mimeType: mime,
    );
  }

  final String fileName;
  final String sizeLabel;

  /// "PDF" atau "JPG".
  final String type;
  final Uint8List? bytes;
  final String? mimeType;
}
