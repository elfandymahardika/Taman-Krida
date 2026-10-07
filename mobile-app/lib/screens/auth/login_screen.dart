import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/validators.dart';
import '../../data/dummy/dummy_data.dart';
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

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    setState(() => _loginError = null);
    if (!_formKey.currentState!.validate()) return;

    final error = AppStateScope.read(context)
        .login(_emailController.text, _passwordController.text);
    if (error != null) {
      setState(() => _loginError = error);
      return;
    }

    final state = AppStateScope.read(context);
    showAppToast(context, 'Selamat datang, ${state.currentUser!.name}!');
    Navigator.of(context).pushReplacementNamed(
      widget.args?.redirectTo ?? AppRoutes.account,
      arguments: widget.args?.redirectArgs,
    );
  }

  void _fillDemoAccount() {
    _emailController.text = DummyData.demoAccount.email;
    _passwordController.text = DummyData.demoAccount.password;
    setState(() => _loginError = null);
  }

  @override
  Widget build(BuildContext context) {
    return TkbjScaffold(
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
                          onTap: () => showAppToast(
                            context,
                            'Tautan reset kata sandi terkirim ke email.',
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
                      label: 'Masuk ke Akun',
                      fontSize: 13,
                      onPressed: _submit,
                    ),
                    const SizedBox(height: 12),
                    _DemoAccountHint(onUse: _fillDemoAccount),
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

/// Info akun demo agar penguji bisa langsung mencoba login simulasi.
class _DemoAccountHint extends StatelessWidget {
  const _DemoAccountHint({required this.onUse});

  final VoidCallback onUse;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.goldTint,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Akun demo: ${DummyData.demoAccount.email} · '
              '${DummyData.demoAccount.password}',
              style: AppText.poppins(11, weight: FontWeight.w500),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onUse,
            child: Text(
              'Pakai',
              style: AppText.poppins(
                12,
                weight: FontWeight.w700,
                color: AppColors.maroon,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
