import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
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
  late final TextEditingController _cityController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _phoneController = TextEditingController();
    _cityController = TextEditingController();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final user = AppStateScope.read(context).currentUser;
    if (user != null && _nameController.text.isEmpty) {
      _nameController.text = user.name;
      _emailController.text = user.email;
      _phoneController.text = user.phone;
      _cityController.text = user.city;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    final error = AppStateScope.read(context).updateProfile(
      name: _nameController.text,
      email: _emailController.text,
      phone: _phoneController.text,
      city: _cityController.text,
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
          subtitle:
              'Perbarui data diri yang dipakai untuk tiket dan pengajuan sewa.',
          onBreadcrumbTap: () => Navigator.of(context).pop(),
        ),
        ContentSection(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _AvatarEditor(name: _nameController.text),
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
                  label: 'No. WhatsApp',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9+]')),
                  ],
                  validator: Validators.phone,
                ),
                const SizedBox(height: 14),
                LabeledTextField(
                  label: 'Kota',
                  controller: _cityController,
                  hint: 'Contoh: Malang',
                  textInputAction: TextInputAction.done,
                  validator: (v) => Validators.required(v, 'Kota'),
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

class _AvatarEditor extends StatelessWidget {
  const _AvatarEditor({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            color: AppColors.maroon,
            shape: BoxShape.circle,
          ),
          child: Text(
            Formatters.initials(name),
            style: AppText.playfair(22, color: AppColors.white),
          ),
        ),
        const SizedBox(height: 10),
        OutlinedButton(
          onPressed: () => showAppToast(
            context,
            'Contoh prototype: pilih foto dari galeri.',
          ),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.maroon,
            side: const BorderSide(color: AppColors.border),
            minimumSize: const Size(0, 32),
            padding: const EdgeInsets.symmetric(horizontal: 13),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(6),
            ),
            textStyle: AppText.poppins(12, weight: FontWeight.w600),
          ),
          child: const Text('Ubah Foto'),
        ),
      ],
    );
  }
}
