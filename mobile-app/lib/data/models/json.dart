/// Objek JSON dari API.
typedef Json = Map<String, dynamic>;

DateTime parseDate(Object? value) => DateTime.parse(value as String).toLocal();

DateTime? parseDateOrNull(Object? value) =>
    value == null ? null : parseDate(value);
