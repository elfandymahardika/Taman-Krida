import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/validators.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/form/app_checkbox.dart';
import '../../widgets/form/labeled_text_field.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/auth_card.dart';
import 'widgets/password_toggle.dart';

/// Halaman daftar akun baru (node 1:273 "mobile-daftar-akun").
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, this.args});

  final AuthArgs? args;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _agreed = false;
  bool _obscure = true;
  bool _submitted = false;
  String? _registerError;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    setState(() {
      _submitted = true;
      _registerError = null;
    });
    final fieldsValid = _formKey.currentState!.validate();
    if (!fieldsValid || !_agreed) return;

    final error = AppStateScope.read(context).register(
      name: _nameController.text,
      email: _emailController.text,
      phone: _phoneController.text,
      password: _passwordController.text,
    );
    if (error != null) {
      setState(() => _registerError = error);
      return;
    }

    showAppToast(context, 'Akun berhasil dibuat. Selamat bergabung!');
    Navigator.of(context).pushReplacementNamed(
      widget.args?.redirectTo ?? AppRoutes.account,
      arguments: widget.args?.redirectArgs,
    );
  }

  @override
  Widget build(BuildContext context) {
    return TkbjScaffold(
      children: [
        ContentSection(
          padding: const EdgeInsets.all(20),
          child: AuthCard(
            isLogin: false,
            onSwitchTab: () => Navigator.of(context)
                .pushReplacementNamed(AppRoutes.login, arguments: widget.args),
            footerQuestion: 'Sudah memiliki akun?',
            footerAction: 'Masuk di sini',
            form: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_registerError != null) ...[
                    FormErrorBanner(_registerError!),
                    const SizedBox(height: 14),
                  ],
                  LabeledTextField(
                    label: 'Nama Lengkap',
                    controller: _nameController,
                    hint: 'Masukkan nama lengkap Anda',
                    keyboardType: TextInputType.name,
                    validator: (v) =>
                        Validators.name(v, fieldName: 'Nama lengkap'),
                  ),
                  const SizedBox(height: 14),
                  LabeledTextField(
                    label: 'Alamat Email',
                    controller: _emailController,
                    hint: 'Masukkan alamat email aktif',
                    keyboardType: TextInputType.emailAddress,
                    validator: Validators.email,
                  ),
                  const SizedBox(height: 14),
                  LabeledTextField(
                    label: 'No. Telepon / WhatsApp',
                    controller: _phoneController,
                    hint: 'Contoh: 081234567890',
                    keyboardType: TextInputType.phone,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9+]')),
                    ],
                    validator: Validators.phone,
                  ),
                  const SizedBox(height: 14),
                  LabeledTextField(
                    label: 'Kata Sandi Baru',
                    controller: _passwordController,
                    hint: 'Buat kata sandi minimal 8 karakter',
                    obscureText: _obscure,
                    textInputAction: TextInputAction.done,
                    validator: Validators.password,
                    suffix: PasswordToggle(
                      obscure: _obscure,
                      onToggle: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: LabeledCheckbox(
                      value: _agreed,
                      onChanged: (v) => setState(() => _agreed = v),
                      errorText: _submitted && !_agreed
                          ? 'Anda perlu menyetujui ketentuan layanan.'
                          : null,
                      label: Text(
                        'Saya menyetujui Ketentuan Layanan & Kebijakan Privasi '
                        'pengelolaan pariwisata Disbudpar Provinsi Jawa Timur.',
                        style: AppText.poppins(
                          11,
                          color: AppColors.muted,
                          height: 16 / 11,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  AppButton(
                    label: 'Daftar Akun Baru',
                    fontSize: 13,
                    onPressed: _submit,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
