import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_feedback.dart';

/// Buka tautan di aplikasi lain (YouTube, browser). Menampilkan pesan bila
/// tidak ada aplikasi yang bisa membukanya.
Future<void> openExternal(BuildContext context, String url) async {
  final uri = Uri.tryParse(url);
  final opened =
      uri != null &&
      await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      ).catchError((_) => false);
  if (!opened && context.mounted) {
    showAppToast(context, 'Tautan video tidak dapat dibuka di perangkat ini.');
  }
}
