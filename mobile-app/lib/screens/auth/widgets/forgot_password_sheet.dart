import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/validators.dart';
import '../../../widgets/common/app_button.dart';
import '../../../widgets/common/app_feedback.dart';
import '../../../widgets/form/labeled_text_field.dart';

/// Overlay "Lupa Kata Sandi?" (node 157:2762).
Future<void> showForgotPasswordSheet(
  BuildContext context, {
  String initialEmail = '',
}) {
  return showAppBottomSheet<void>(
    context,
    builder: (sheetContext) => Padding(
      // Naik mengikuti keyboard agar field tidak tertutup.
      padding: EdgeInsets.only(
        bottom: MediaQuery.viewInsetsOf(sheetContext).bottom,
      ),
      child: _ForgotPasswordForm(
        initialEmail: initialEmail,
        onSent: () {
          Navigator.of(sheetContext).pop();
          showAppToast(context, 'Tautan reset kata sandi terkirim ke email.');
        },
        onCancel: () => Navigator.of(sheetContext).pop(),
      ),
    ),
  );
}

class _ForgotPasswordForm extends StatefulWidget {
  const _ForgotPasswordForm({
    required this.initialEmail,
    required this.onSent,
    required this.onCancel,
  });

  final String initialEmail;
  final VoidCallback onSent;
  final VoidCallback onCancel;

  @override
  State<_ForgotPasswordForm> createState() => _ForgotPasswordFormState();
}

class _ForgotPasswordFormState extends State<_ForgotPasswordForm> {
  final _formKey = GlobalKey<FormState>();
  late final _emailController = TextEditingController(
    text: widget.initialEmail,
  );

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Lupa Kata Sandi?',
            textAlign: TextAlign.center,
            style: AppText.playfair(20),
          ),
          const SizedBox(height: 16),
          Text(
            'Masukkan email akun TKBJ Anda. Kami akan mengirim tautan untuk '
            'membuat kata sandi baru.',
            textAlign: TextAlign.center,
            style: AppText.poppins(12, color: AppColors.muted),
          ),
          const SizedBox(height: 16),
          LabeledTextField(
            label: 'Alamat Email',
            controller: _emailController,
            hint: 'budi.santoso@email.com',
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            validator: Validators.email,
          ),
          const SizedBox(height: 16),
          AppButton(
            label: 'Kirim Tautan Reset',
            onPressed: () {
              if (_formKey.currentState!.validate()) widget.onSent();
            },
          ),
          const SizedBox(height: 16),
          AppButton.outline(label: 'Batal', onPressed: widget.onCancel),
        ],
      ),
    );
  }
}
