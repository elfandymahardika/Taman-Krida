import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/file_pick.dart';
import '../../data/api/api_client.dart';
import '../../data/models/rental_request.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/form/app_checkbox.dart';
import '../../widgets/form/upload_field.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/missing_step_notice.dart';
import 'widgets/rental_stepper.dart';

/// Sewa langkah 4: unggah berkas (node 157:1434) + overlay pengajuan
/// terkirim (node 157:2716).
class RentalDocumentsScreen extends StatefulWidget {
  const RentalDocumentsScreen({super.key});

  @override
  State<RentalDocumentsScreen> createState() => _RentalDocumentsScreenState();
}

class _RentalDocumentsScreenState extends State<RentalDocumentsScreen> {
  bool _agreed = false;
  bool _submitted = false;
  bool _busy = false;

  /// Pengajuan yang baru dikirim (draft sudah dikosongkan oleh state).
  RentalRequest? _sent;

  Future<void> _pick(RentalDocument doc) async {
    final state = AppStateScope.read(context);
    final file = await state.pickFile(imagesOnly: false);
    if (file == null || !mounted) return;
    if ((file.bytes?.length ?? 0) > maxUploadBytes) {
      showAppToast(context, 'Ukuran ${doc.label} melebihi 5 MB.');
      return;
    }
    state.attachRentalDocument(doc.key, file);
    showAppToast(context, '${doc.label} siap dikirim.');
  }

  Future<void> _submit() async {
    if (_busy) return;
    setState(() => _submitted = true);
    final state = AppStateScope.read(context);
    final missing = RentalDocument.all
        .where((doc) => !state.rentalDraft.documents.containsKey(doc.key))
        .toList();
    if (missing.isNotEmpty) {
      showAppToast(context, 'Unggah ${missing.first.label} terlebih dahulu.');
      return;
    }
    if (!_agreed) return;
    setState(() => _busy = true);
    try {
      final request = await state.submitRental();
      if (!mounted) return;
      setState(() => _sent = request);
      _showSubmitted(request);
    } on ApiException catch (e) {
      if (mounted) showAppToast(context, e.displayMessage);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showSubmitted(RentalRequest request) {
    showAppBottomSheet<void>(
      context,
      builder: (sheetContext) => SheetMessage(
        symbol: '✓',
        symbolColor: AppColors.success,
        symbolBackground: const Color(0x263A9D4F),
        title: 'Pengajuan Terkirim',
        message:
            'Pengajuan sewa gedung ${request.code} telah diterima. Petugas TKBJ '
            'akan menghubungi Anda dalam 1×24 jam kerja.',
        actions: [
          AppButton(
            label: 'Lihat Status Pengajuan',
            onPressed: () {
              Navigator.of(sheetContext).pop();
              AppRoutes.openFromHome(
                context,
                AppRoutes.rentalStatus,
                arguments: request.code,
              );
            },
          ),
          AppButton.outline(
            label: 'Tutup',
            onPressed: () {
              Navigator.of(sheetContext).pop();
              AppRoutes.goHome(context);
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final draft = AppStateScope.of(context).rentalDraft;
    final ready = draft.facility != null && draft.activityName.isNotEmpty;

    return TkbjScaffold(
      children: [
        const PageHeader(
          breadcrumb: 'Sewa Gedung / Unggah Berkas',
          title: 'Unggah Berkas',
          subtitle:
              'Lampirkan dokumen pendukung agar pengajuan dapat diverifikasi '
              'admin.',
        ),
        const RentalStepper(current: 4),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: _sent != null
              ? _SentNotice(request: _sent!)
              : !ready
              ? const MissingStepNotice(
                  message: 'Isi formulir kegiatan terlebih dahulu.',
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Dokumen Pendukung', style: AppText.playfair(18)),
                    const SizedBox(height: 4),
                    Text(
                      'Format PDF/JPG, ukuran maksimal 5 MB per berkas.',
                      style: AppText.poppins(12, color: AppColors.muted),
                    ),
                    for (final doc in RentalDocument.all) ...[
                      const SizedBox(height: 16),
                      UploadField(
                        label: doc.label,
                        file: draft.documents[doc.key],
                        hasError:
                            _submitted && !draft.documents.containsKey(doc.key),
                        onPick: () => _pick(doc),
                      ),
                    ],
                    const SizedBox(height: 16),
                    LabeledCheckbox(
                      value: _agreed,
                      onChanged: (v) => setState(() => _agreed = v),
                      errorText: _submitted && !_agreed
                          ? 'Centang pernyataan untuk melanjutkan.'
                          : null,
                      label: Text(
                        'Saya menyatakan data dan dokumen yang diunggah adalah '
                        'benar dan dapat dipertanggungjawabkan.',
                        style: AppText.poppins(
                          11,
                          color: AppColors.muted,
                          height: 16 / 11,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      label: _busy ? 'Mengirim…' : 'Kirim Pengajuan',
                      onPressed: _busy ? null : _submit,
                    ),
                    const SizedBox(height: 10),
                    AppButton.outline(
                      label: '← Kembali ke Formulir',
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
        ),
      ],
    );
  }
}

class _SentNotice extends StatelessWidget {
  const _SentNotice({required this.request});

  final RentalRequest request;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Pengajuan ${request.code} terkirim',
          style: AppText.playfair(20, color: AppColors.maroon),
        ),
        const SizedBox(height: 16),
        AppButton(
          label: 'Lihat Status Pengajuan',
          onPressed: () => AppRoutes.openFromHome(
            context,
            AppRoutes.rentalStatus,
            arguments: request.code,
          ),
        ),
      ],
    );
  }
}
