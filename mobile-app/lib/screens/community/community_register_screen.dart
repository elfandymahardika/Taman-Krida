import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/validators.dart';
import '../../data/dummy/community_data.dart';
import '../../data/models/community.dart';
import '../../data/models/rental_request.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/form/app_checkbox.dart';
import '../../widgets/form/labeled_text_field.dart';
import '../../widgets/form/upload_field.dart';
import '../../widgets/interactive/chip_filter.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';

/// Form daftarkan komunitas (node 157:2209) + overlay pendaftaran
/// terkirim (node 157:2281).
class CommunityRegisterScreen extends StatefulWidget {
  const CommunityRegisterScreen({super.key});

  @override
  State<CommunityRegisterScreen> createState() =>
      _CommunityRegisterScreenState();
}

class _CommunityRegisterScreenState extends State<CommunityRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _leaderController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _descriptionController = TextEditingController();
  String? _category;
  UploadedFile? _photo;
  bool _agreed = false;
  bool _submitted = false;

  @override
  void dispose() {
    _nameController.dispose();
    _leaderController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _pickPhoto() {
    setState(
      () => _photo = const UploadedFile(
        fileName: 'foto_kegiatan.jpg',
        sizeLabel: '1,4 MB',
        type: 'JPG',
      ),
    );
    showAppToast(context, 'Contoh prototype: foto dipilih dari galeri.');
  }

  void _submit() {
    setState(() => _submitted = true);
    final fieldsValid = _formKey.currentState!.validate();
    if (!fieldsValid || _category == null || _photo == null || !_agreed) {
      showAppToast(context, 'Lengkapi semua data yang ditandai merah.');
      return;
    }
    AppStateScope.read(context).registerCommunity(
      CommunityRegistration(
        name: _nameController.text.trim(),
        category: _category!,
        leader: _leaderController.text.trim(),
        phone: _phoneController.text.trim(),
        address: _addressController.text.trim(),
        description: _descriptionController.text.trim(),
        submittedAt: DateTime.now(),
      ),
    );
    _showSubmitted();
  }

  void _showSubmitted() {
    showAppBottomSheet<void>(
      context,
      builder: (sheetContext) => SheetMessage(
        symbol: '✓',
        symbolColor: AppColors.success,
        symbolBackground: const Color(0x263A9D4F),
        title: 'Pendaftaran Terkirim',
        message:
            'Data komunitas Anda akan diverifikasi admin TKBJ dalam 1–3 hari '
            'kerja. Hasilnya dikirim lewat notifikasi & WhatsApp.',
        actions: [
          AppButton(
            label: 'Kembali ke Direktori',
            onPressed: () {
              Navigator.of(sheetContext).pop();
              Navigator.of(context).pop();
            },
          ),
          AppButton.outline(
            label: 'Lihat Notifikasi',
            onPressed: () {
              Navigator.of(sheetContext).pop();
              Navigator.of(context)
                  .pushReplacementNamed(AppRoutes.notifications);
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return TkbjScaffold(
      children: [
        const PageHeader(
          breadcrumb: 'Direktori / Daftarkan Komunitas',
          title: 'Daftarkan Komunitas',
          subtitle:
              'Tampilkan sanggar atau komunitas seni Anda di direktori TKBJ.',
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LabeledTextField(
                  label: 'Nama Komunitas / Sanggar',
                  controller: _nameController,
                  hint: 'Contoh: Sanggar Tari Mekar Sari',
                  validator: (v) =>
                      Validators.name(v, fieldName: 'Nama komunitas'),
                ),
                const SizedBox(height: 16),
                _CategoryPicker(
                  selected: _category,
                  showError: _submitted && _category == null,
                  onSelected: (c) => setState(() => _category = c),
                ),
                const SizedBox(height: 16),
                LabeledTextField(
                  label: 'Nama Ketua / Penanggung Jawab',
                  controller: _leaderController,
                  hint: 'Contoh: Ibu Sri Wahyuni',
                  validator: (v) => Validators.name(v, fieldName: 'Nama ketua'),
                ),
                const SizedBox(height: 16),
                LabeledTextField(
                  label: 'No. WhatsApp',
                  controller: _phoneController,
                  hint: '08xx-xxxx-xxxx',
                  keyboardType: TextInputType.phone,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9+\- ]')),
                  ],
                  validator: Validators.phone,
                ),
                const SizedBox(height: 16),
                LabeledTextField(
                  label: 'Alamat Sekretariat',
                  controller: _addressController,
                  hint: 'Kota/Kabupaten di Jawa Timur',
                  validator: (v) => Validators.name(v, fieldName: 'Alamat'),
                ),
                const SizedBox(height: 16),
                LabeledTextField(
                  label: 'Deskripsi Singkat',
                  controller: _descriptionController,
                  hint:
                      'Ceritakan sejarah, kegiatan rutin, dan prestasi '
                      'komunitas Anda…',
                  maxLines: 5,
                  keyboardType: TextInputType.multiline,
                  textInputAction: TextInputAction.newline,
                  validator: (v) {
                    final empty = Validators.required(v, 'Deskripsi');
                    if (empty != null) return empty;
                    return v!.trim().length < 20
                        ? 'Deskripsi minimal 20 karakter.'
                        : null;
                  },
                ),
                const SizedBox(height: 16),
                UploadField(
                  label: 'Foto Kegiatan',
                  file: _photo,
                  hint: 'Ketuk untuk memilih foto · JPG/PNG maks. 5 MB',
                  hasError: _submitted && _photo == null,
                  onPick: _pickPhoto,
                ),
                const SizedBox(height: 16),
                LabeledCheckbox(
                  value: _agreed,
                  onChanged: (v) => setState(() => _agreed = v),
                  errorText: _submitted && !_agreed
                      ? 'Persetujuan wajib dicentang.'
                      : null,
                  label: Text(
                    'Saya setuju data komunitas ditampilkan di direktori '
                    'publik TKBJ.',
                    style: AppText.poppins(
                      11,
                      color: AppColors.muted,
                      height: 16 / 11,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                AppButton(label: 'Kirim Pendaftaran', onPressed: _submit),
                const SizedBox(height: 10),
                AppButton.outline(
                  label: '← Kembali ke Direktori',
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

class _CategoryPicker extends StatelessWidget {
  const _CategoryPicker({
    required this.selected,
    required this.showError,
    required this.onSelected,
  });

  final String? selected;
  final bool showError;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Kategori Kesenian',
          style: AppText.poppins(13, weight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final category in CommunityData.registerCategories)
              ChipFilter(
                label: category,
                active: category == selected,
                onTap: () => onSelected(category),
              ),
          ],
        ),
        if (showError) ...[
          const SizedBox(height: 6),
          Text(
            'Pilih salah satu kategori.',
            style: AppText.poppins(11, color: AppColors.error),
          ),
        ],
      ],
    );
  }
}
