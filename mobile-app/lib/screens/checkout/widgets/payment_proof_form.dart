import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/file_pick.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/api/api_client.dart';
import '../../../data/models/rental_request.dart';
import '../../../data/models/ticket_order.dart';
import '../../../state/app_state.dart';
import '../../../widgets/common/app_button.dart';
import '../../../widgets/common/app_feedback.dart';
import '../../../widgets/common/section_card.dart';
import '../../../widgets/form/labeled_text_field.dart';
import '../../../widgets/form/upload_field.dart';
import 'payment_option_tile.dart';

/// Kirim bukti pembayaran: metode, berkas bukti (foto/PDF), dan nama
/// pengirim. Setelah terkirim, status menjadi "Sedang diverifikasi" sampai
/// Admin Keuangan di dashboard menyatakan lunas.
class PaymentProofForm extends StatefulWidget {
  const PaymentProofForm({
    super.key,
    required this.amount,
    required this.onSubmit,
    this.initialMethod = PaymentMethod.qris,
    this.showMethods = true,
    this.submitLabel = 'Kirim Bukti Pembayaran',
  });

  final int amount;
  final PaymentMethod initialMethod;

  /// `false` bila metode sudah dipilih di langkah sebelumnya.
  final bool showMethods;
  final String submitLabel;

  /// Melempar [ApiException] bila ditolak server; pesannya ditampilkan.
  final Future<void> Function(
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  )
  onSubmit;

  @override
  State<PaymentProofForm> createState() => _PaymentProofFormState();
}

class _PaymentProofFormState extends State<PaymentProofForm> {
  late PaymentMethod _method = widget.initialMethod;
  final _senderController = TextEditingController();
  UploadedFile? _proof;
  bool _submitted = false;
  bool _busy = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_senderController.text.isEmpty) {
      _senderController.text =
          AppStateScope.read(context).currentUser?.name ?? '';
    }
  }

  @override
  void dispose() {
    _senderController.dispose();
    super.dispose();
  }

  Future<void> _pick() async {
    final file = await AppStateScope.read(context).pickFile(imagesOnly: false);
    if (file == null || !mounted) return;
    if ((file.bytes?.length ?? 0) > maxUploadBytes) {
      showAppToast(context, 'Ukuran berkas melebihi 5 MB.');
      return;
    }
    setState(() => _proof = file);
  }

  Future<void> _submit() async {
    setState(() => _submitted = true);
    final proof = _proof;
    if (proof == null) {
      showAppToast(context, 'Unggah bukti pembayaran terlebih dahulu.');
      return;
    }
    setState(() => _busy = true);
    try {
      await widget.onSubmit(_method, proof, _senderController.text.trim());
    } on ApiException catch (e) {
      if (mounted) showAppToast(context, e.displayMessage);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.showMethods) ...[
          Text(
            'Pilih Metode Pembayaran Resmi',
            style: AppText.playfair(20, color: AppColors.maroon),
          ),
          const SizedBox(height: 16),
          for (final method in PaymentMethod.values) ...[
            PaymentOptionTile(
              method: method,
              selected: _method == method,
              onTap: () => setState(() => _method = method),
            ),
            const SizedBox(height: 12),
          ],
          const SizedBox(height: 4),
        ],
        SectionCard(
          title: 'Tujuan Pembayaran',
          children: [
            Text(
              'Bayar ${Formatters.rupiah(widget.amount)} via '
              '${_method.shortLabel} ke rekening resmi TKBJ: '
              '${state.bankName} ${state.bankAccount}.',
              style: AppText.poppins(12, color: AppColors.muted, height: 1.5),
            ),
          ],
        ),
        const SizedBox(height: 16),
        UploadField(
          label: 'Bukti Pembayaran',
          file: _proof,
          hint: 'Foto/screenshot atau PDF bukti bayar · maks. 5 MB',
          hasError: _submitted && _proof == null,
          onPick: _pick,
        ),
        const SizedBox(height: 16),
        LabeledTextField(
          label: 'Nama Pengirim / Pemilik Rekening',
          controller: _senderController,
          hint: 'Sesuai nama di bukti transfer',
          textInputAction: TextInputAction.done,
        ),
        const SizedBox(height: 12),
        const NoticeBanner(
          color: AppColors.gold,
          message:
              'Admin Keuangan TKBJ akan mencocokkan bukti dengan tagihan. '
              'Status berubah menjadi Lunas setelah diverifikasi.',
        ),
        const SizedBox(height: 16),
        AppButton(
          label: _busy ? 'Mengirim…' : widget.submitLabel,
          fontSize: 13,
          onPressed: _busy ? null : _submit,
        ),
      ],
    );
  }
}
