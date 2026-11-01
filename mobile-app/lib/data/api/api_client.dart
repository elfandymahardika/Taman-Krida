import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../models/rental_request.dart';

/// Alamat API mobile (backend/mobile-app).
///
/// Bisa diganti saat menjalankan aplikasi, mis. untuk HP sungguhan / Ngrok:
/// `flutter run --dart-define=API_URL=http://192.168.1.10:5001/api`.
/// Bawaan: emulator Android memakai 10.0.2.2 (= localhost laptop).
String defaultApiUrl() {
  const fromEnv = String.fromEnvironment('API_URL');
  if (fromEnv.isNotEmpty) return fromEnv;
  final isAndroid = !kIsWeb && defaultTargetPlatform == TargetPlatform.android;
  return isAndroid ? 'http://10.0.2.2:5001/api' : 'http://localhost:5001/api';
}

/// Error dari API: status HTTP, pesan, dan pesan per kolom formulir.
class ApiException implements Exception {
  const ApiException(this.status, this.message, [this.fields = const {}]);

  /// 0 = server tidak bisa dihubungi.
  final int status;
  final String message;
  final Map<String, String> fields;

  bool get isUnauthorized => status == 401;

  /// Pesan untuk toast: pesan kolom pertama bila ada (lebih spesifik).
  String get displayMessage => fields.isEmpty ? message : fields.values.first;

  @override
  String toString() => 'ApiException($status): $message';
}

/// Pembungkus `package:http`: JSON, token Bearer, multipart, dan error.
class ApiClient {
  ApiClient({String? baseUrl, http.Client? client})
    : baseUrl = baseUrl ?? defaultApiUrl(),
      _http = client ?? http.Client();

  final String baseUrl;
  final http.Client _http;

  /// Token login pengunjung; dikirim sebagai `Authorization: Bearer`.
  String? token;

  static const _timeout = Duration(seconds: 20);

  Uri _uri(String path, [Map<String, String>? query]) {
    final uri = Uri.parse('$baseUrl$path');
    return query == null ? uri : uri.replace(queryParameters: query);
  }

  Map<String, String> get _headers => {
    'accept': 'application/json',
    if (token != null) 'authorization': 'Bearer $token',
  };

  Future<dynamic> get(String path, {Map<String, String>? query}) =>
      _send(() => _http.get(_uri(path, query), headers: _headers));

  Future<dynamic> post(String path, [Object? body]) => _send(
    () => _http.post(
      _uri(path),
      headers: {..._headers, 'content-type': 'application/json'},
      body: body == null ? null : jsonEncode(body),
    ),
  );

  Future<dynamic> put(String path, Object body) => _send(
    () => _http.put(
      _uri(path),
      headers: {..._headers, 'content-type': 'application/json'},
      body: jsonEncode(body),
    ),
  );

  /// POST multipart/form-data: kolom teks + berkas (nama field → berkas).
  Future<dynamic> postMultipart(
    String path, {
    required Map<String, String> fields,
    required Map<String, UploadedFile> files,
  }) {
    return _send(() async {
      final request = http.MultipartRequest('POST', _uri(path))
        ..headers.addAll(_headers)
        ..fields.addAll(fields);
      for (final entry in files.entries) {
        final file = entry.value;
        request.files.add(
          http.MultipartFile.fromBytes(
            entry.key,
            file.bytes ?? Uint8List(0),
            filename: file.fileName,
            contentType: MediaType.parse(
              file.mimeType ?? 'application/octet-stream',
            ),
          ),
        );
      }
      return http.Response.fromStream(await _http.send(request));
    });
  }

  Future<dynamic> _send(Future<http.Response> Function() call) async {
    final http.Response response;
    try {
      response = await call().timeout(_timeout);
    } on TimeoutException {
      throw const ApiException(
        0,
        'Server tidak merespons. Periksa koneksi lalu coba lagi.',
      );
    } on Exception {
      throw const ApiException(
        0,
        'Tidak dapat terhubung ke server TKBJ. Pastikan internet aktif dan '
        'server menyala.',
      );
    }

    final body = response.body.isEmpty
        ? null
        : _tryDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode >= 200 && response.statusCode < 300) return body;

    final map = body is Map<String, dynamic> ? body : const {};
    final fields = map['fields'] is Map
        ? (map['fields'] as Map).map((k, v) => MapEntry('$k', '$v'))
        : const <String, String>{};
    throw ApiException(
      response.statusCode,
      map['error'] as String? ?? 'Terjadi kesalahan (${response.statusCode}).',
      fields,
    );
  }

  static dynamic _tryDecode(String text) {
    try {
      return jsonDecode(text);
    } on FormatException {
      return null;
    }
  }
}
