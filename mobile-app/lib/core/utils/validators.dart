/// Validasi form sederhana. Setiap fungsi mengembalikan pesan error,
/// atau `null` jika input valid (sesuai kontrak `FormFieldValidator`).
abstract final class Validators {
  static final _emailPattern = RegExp(r'^[\w.+-]+@[\w-]+(\.[\w-]+)+$');
  static final _phonePattern = RegExp(r'^(08|\+628|628)\d{8,11}$');

  static String? required(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName wajib diisi.';
    }
    return null;
  }

  static String? name(String? value, {String fieldName = 'Nama'}) {
    final empty = required(value, fieldName);
    if (empty != null) return empty;
    if (value!.trim().length < 3) return '$fieldName minimal 3 karakter.';
    return null;
  }

  static String? email(String? value) {
    final empty = required(value, 'Alamat email');
    if (empty != null) return empty;
    if (!_emailPattern.hasMatch(value!.trim())) {
      return 'Format email tidak valid, contoh: nama@email.com';
    }
    return null;
  }

  static String? phone(String? value) {
    final empty = required(value, 'Nomor telepon');
    if (empty != null) return empty;
    final normalized = value!.replaceAll(RegExp(r'[\s-]'), '');
    if (!_phonePattern.hasMatch(normalized)) {
      return 'Nomor tidak valid. Gunakan format 08xxxxxxxxxx (10–13 digit).';
    }
    return null;
  }

  static String? password(String? value, {int minLength = 8}) {
    final empty = required(value, 'Kata sandi');
    if (empty != null) return empty;
    if (value!.length < minLength) {
      return 'Kata sandi minimal $minLength karakter.';
    }
    return null;
  }
}
