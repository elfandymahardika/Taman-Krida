import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/validators.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/form/labeled_text_field.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';

/// Edit profil pengguna (nama, email, WhatsApp).
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _phoneController = TextEditingController();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final user = AppStateScope.read(context).currentUser;
    if (user != null && _nameController.text.isEmpty) {
      _nameController.text = user.name;
      _emailController.text = user.email;
      _phoneController.text = user.phone;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    final error = AppStateScope.read(context).updateProfile(
      name: _nameController.text,
      email: _emailController.text,
      phone: _phoneController.text,
    );
    if (error != null) {
      showAppToast(context, error);
      return;
    }
    showAppToast(context, 'Profil berhasil diperbarui.');
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Akun Saya / Edit Profil',
          title: 'Edit Profil',
          subtitle: 'Perbarui data diri untuk pemesanan tiket dan sewa.',
          onBreadcrumbTap: () => Navigator.of(context).pop(),
        ),
        ContentSection(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Data Diri',
                  style: AppText.playfair(20, color: AppColors.maroon),
                ),
                const SizedBox(height: 16),
                LabeledTextField(
                  label: 'Nama Lengkap',
                  controller: _nameController,
                  validator: (v) =>
                      Validators.name(v, fieldName: 'Nama lengkap'),
                ),
                const SizedBox(height: 14),
                LabeledTextField(
                  label: 'Alamat Email',
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  validator: Validators.email,
                ),
                const SizedBox(height: 14),
                LabeledTextField(
                  label: 'No. Telepon / WhatsApp',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.done,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9+]')),
                  ],
                  validator: Validators.phone,
                ),
                const SizedBox(height: 20),
                AppButton(label: 'Simpan Perubahan', onPressed: _save),
                const SizedBox(height: 10),
                AppButton.outline(
                  label: 'Batal',
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
