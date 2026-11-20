import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/validators.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/form/app_checkbox.dart';
import '../../widgets/form/labeled_text_field.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/auth_card.dart';
import 'widgets/forgot_password_sheet.dart';
import 'widgets/password_toggle.dart';

/// Halaman masuk akun (node 1:215 "mobile-login").
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.args});

  final AuthArgs? args;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _rememberMe = true;
  bool _obscure = true;
  String? _loginError;
  bool _busy = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    setState(() => _loginError = null);
    if (!_formKey.currentState!.validate()) return;

    final authController = context.read<AuthController>();
    setState(() => _busy = true);
    final error = await authController.login(
      _emailController.text,
      _passwordController.text,
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (error != null) {
      setState(() => _loginError = error);
      return;
    }

    showAppToast(
      context,
      'Selamat datang, ${authController.currentUser!.name}!',
    );
    AppRoutes.afterSignIn(context, widget.args);
  }

  @override
  Widget build(BuildContext context) {
    return TkbjScaffold(
      title: 'Selamat Datang',
      subtitle:
          'Masuk untuk memesan tiket, mengajukan sewa gedung, dan lainnya.',
      children: [
        ContentSection(
          padding: const EdgeInsets.all(20),
          child: AuthCard(
            isLogin: true,
            onSwitchTab: () => Navigator.of(
              context,
            ).pushReplacementNamed(AppRoutes.register, arguments: widget.args),
            footerQuestion: 'Belum punya akun TKBJ?',
            footerAction: 'Daftar di sini',
            form: AutofillGroup(
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_loginError != null) ...[
                      FormErrorBanner(_loginError!),
                      const SizedBox(height: 16),
                    ],
                    LabeledTextField(
                      label: 'Alamat Email',
                      controller: _emailController,
                      hint: 'budi.santoso@email.com',
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      validator: Validators.email,
                    ),
                    const SizedBox(height: 16),
                    LabeledTextField(
                      label: 'Kata Sandi',
                      controller: _passwordController,
                      hint: 'Masukkan kata sandi',
                      obscureText: _obscure,
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.password],
                      onFieldSubmitted: (_) => _submit(),
                      validator: (value) =>
                          Validators.required(value, 'Kata sandi'),
                      suffix: PasswordToggle(
                        obscure: _obscure,
                        onToggle: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: LabeledCheckbox(
                            value: _rememberMe,
                            onChanged: (v) => setState(() => _rememberMe = v),
                            label: Text(
                              'Ingat saya',
                              style: AppText.poppins(12),
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => showForgotPasswordSheet(
                            context,
                            initialEmail: _emailController.text.trim(),
                          ),
                          child: Text(
                            'Lupa Kata Sandi?',
                            style: AppText.poppins(
                              12,
                              weight: FontWeight.w600,
                              color: AppColors.maroon,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      label: _busy ? 'Memproses…' : 'Masuk ke Akun',
                      fontSize: 13,
                      onPressed: _busy ? null : _submit,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
