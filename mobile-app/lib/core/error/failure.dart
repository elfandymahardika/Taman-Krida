/// Jenis kegagalan yang perlu dibedakan oleh Controller.
enum FailureType {
  /// Server tidak bisa dihubungi atau tidak merespons.
  network,

  /// Sesi login tidak berlaku (401).
  unauthorized,

  /// Data yang dikirim ditolak (400/422), biasanya disertai pesan per kolom.
  validation,

  /// Data tidak ditemukan (404).
  notFound,

  /// Bentrok dengan keadaan server, mis. slot sudah diambil (409).
  conflict,

  /// Kesalahan lain di server.
  server,
}

/// Kegagalan yang dilempar Repository ke layer domain & presentation.
///
/// Repository menerjemahkan error teknis dari Data Source (mis.
/// `ApiException` HTTP) menjadi [Failure], sehingga Page & Controller tidak
/// bergantung pada detail jaringan.
class Failure implements Exception {
  const Failure(this.type, this.message, [this.fields = const {}]);

  final FailureType type;
  final String message;

  /// Pesan per kolom formulir (kunci = nama kolom).
  final Map<String, String> fields;

  bool get isUnauthorized => type == FailureType.unauthorized;

  /// Pesan untuk toast: pesan kolom pertama bila ada (lebih spesifik).
  String get displayMessage => fields.isEmpty ? message : fields.values.first;

  @override
  String toString() => 'Failure(${type.name}): $message';
}
