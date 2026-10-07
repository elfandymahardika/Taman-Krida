/// Format angka dan tanggal Bahasa Indonesia tanpa package tambahan.
abstract final class Formatters {
  static const _monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', //
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  static const _dayNames = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu',
  ];

  /// 35000 -> "Rp 35.000"
  static String rupiah(int amount) {
    final digits = amount.abs().toString();
    final buffer = StringBuffer();
    for (var i = 0; i < digits.length; i++) {
      final fromEnd = digits.length - i;
      buffer.write(digits[i]);
      if (fromEnd > 1 && fromEnd % 3 == 1) buffer.write('.');
    }
    return '${amount < 0 ? '-' : ''}Rp ${buffer.toString()}';
  }

  static String twoDigits(int value) => value.toString().padLeft(2, '0');

  static String monthName(int month) => _monthNames[month - 1];

  static String monthShort(int month) => _monthNames[month - 1].substring(0, 3);

  /// "Juni 2026"
  static String monthYear(DateTime date) =>
      '${monthName(date.month)} ${date.year}';

  /// "12 Juni 2026"
  static String longDate(DateTime date) =>
      '${twoDigits(date.day)} ${monthName(date.month)} ${date.year}';

  /// "Rabu, 03 Juni 2026"
  static String fullDate(DateTime date) =>
      '${_dayNames[date.weekday - 1]}, ${longDate(date)}';

  /// "03 Jun 2026"
  static String shortDate(DateTime date) =>
      '${twoDigits(date.day)} ${monthShort(date.month)} ${date.year}';

  /// 8 -> "08:00"
  static String hour(int hour) => '${twoDigits(hour)}:00';

  /// "Budi Santoso" -> "BS"
  static String initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    return parts.take(2).map((p) => p[0].toUpperCase()).join();
  }
}
