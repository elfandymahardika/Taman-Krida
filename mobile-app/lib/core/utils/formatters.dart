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

  /// "06 Okt 2026 · 14:20 WIB"
  static String dateTime(DateTime date) =>
      '${shortDate(date)} · ${twoDigits(date.hour)}:${twoDigits(date.minute)} '
      'WIB';

  /// 3500000 -> "Rp 3,5 jt"
  static String rupiahShort(int amount) {
    if (amount < 1000000) return rupiah(amount);
    final millions = amount / 1000000;
    final text = millions == millions.roundToDouble()
        ? millions.toStringAsFixed(0)
        : millions.toStringAsFixed(1).replaceAll('.', ',');
    return 'Rp $text jt';
  }

  /// Waktu relatif untuk notifikasi: "Baru saja", "2 jam lalu", "Kemarin".
  static String relative(DateTime time, {DateTime? now}) {
    final diff = (now ?? DateTime.now()).difference(time);
    if (diff.inMinutes < 1) return 'Baru saja';
    if (diff.inHours < 1) return '${diff.inMinutes} menit lalu';
    if (diff.inDays < 1) return '${diff.inHours} jam lalu';
    if (diff.inDays == 1) return 'Kemarin';
    if (diff.inDays < 7) return '${diff.inDays} hari lalu';
    return shortDate(time);
  }

  /// Nama hari singkat Senin-pertama: 1 -> "Sen".
  static String weekdayShort(int weekday) =>
      _dayNames[weekday - 1].substring(0, 3);

  /// "Budi Santoso" -> "BS"
  static String initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    return parts.take(2).map((p) => p[0].toUpperCase()).join();
  }
}
