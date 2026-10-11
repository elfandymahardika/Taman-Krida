import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/validators.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/form/labeled_text_field.dart';
import '../../widgets/form/read_only_field.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/missing_step_notice.dart';
import 'widgets/rental_stepper.dart';
import 'widgets/rental_summary_card.dart';

/// Sewa langkah 3: formulir kegiatan (node 157:1335 "mobile-sewa-formulir").
class RentalFormScreen extends StatefulWidget {
  const RentalFormScreen({super.key});

  @override
  State<RentalFormScreen> createState() => _RentalFormScreenState();
}

class _RentalFormScreenState extends State<RentalFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _activityController = TextEditingController();
  final _applicantController = TextEditingController();
  final _contactController = TextEditingController();
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final state = AppStateScope.read(context);
    final draft = state.rentalDraft;
    final user = state.currentUser;
    _activityController.text = draft.activityName;
    _applicantController.text = draft.applicantName.isNotEmpty
        ? draft.applicantName
        : user?.name ?? '';
    _contactController.text = draft.contact.isNotEmpty
        ? draft.contact
        : user?.phone ?? '';
  }

  @override
  void dispose() {
    _activityController.dispose();
    _applicantController.dispose();
    _contactController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    AppStateScope.read(context).saveRentalForm(
      activityName: _activityController.text,
      applicantName: _applicantController.text,
      contact: _contactController.text,
    );
    Navigator.of(context).pushNamed(AppRoutes.rentalDocuments);
  }

  @override
  Widget build(BuildContext context) {
    final draft = AppStateScope.of(context).rentalDraft;
    final ready =
        draft.facility != null && draft.date != null && draft.slot != null;
    final navigator = Navigator.of(context);

    return TkbjScaffold(
      children: [
        const PageHeader(
          breadcrumb: 'Sewa Gedung / Formulir',
          title: 'Formulir Kegiatan',
          subtitle:
              'Lengkapi data kegiatan untuk venue dan tanggal yang telah '
              'tersedia.',
        ),
        const RentalStepper(current: 3),
        ContentSection(
          child: !ready
              ? const MissingStepNotice(
                  message:
                      'Pilih venue, tanggal, dan slot waktu terlebih dahulu.',
                )
              : Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Data Kegiatan', style: AppText.playfair(18)),
                      const SizedBox(height: 14),
                      LabeledTextField(
                        label: 'Nama Kegiatan',
                        controller: _activityController,
                        hint: 'Contoh: Festival Tari Topeng Malangan 2026',
                        validator: (v) =>
                            Validators.name(v, fieldName: 'Nama kegiatan'),
                      ),
                      const SizedBox(height: 14),
                      ReadOnlyField(
                        label: 'Tanggal Pelaksanaan',
                        value: Formatters.longDate(draft.date!),
                        onEdit: () => navigator.pop(),
                      ),
                      const SizedBox(height: 14),
                      ReadOnlyField(
                        label: 'Estimasi Durasi (Jam)',
                        value:
                            '${draft.slot!.hours} Jam '
                            '(${draft.slot!.shortLabel})',
                        onEdit: () => navigator.pop(),
                      ),
                      const SizedBox(height: 14),
                      LabeledTextField(
                        label: 'Nama Lengkap Pengaju',
                        controller: _applicantController,
                        hint: 'Nama pribadi atau lembaga',
                        validator: (v) =>
                            Validators.name(v, fieldName: 'Nama pengaju'),
                      ),
                      const SizedBox(height: 14),
                      LabeledTextField(
                        label: 'Nomor Kontak (WhatsApp)',
                        controller: _contactController,
                        hint: 'Contoh: 081234567890',
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.done,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(
                            RegExp(r'[0-9+\- ]'),
                          ),
                        ],
                        validator: Validators.phone,
                      ),
                      const SizedBox(height: 20),
                      RentalSummaryCard(
                        facility: draft.facility,
                        date: draft.date,
                        slot: draft.slot,
                        footer: [
                          const SizedBox(height: 2),
                          AppButton(
                            label: 'Lanjut Unggah Berkas →',
                            onPressed: _submit,
                          ),
                          AppButton.outline(
                            label: '← Kembali ke Cek Jadwal',
                            onPressed: () => navigator.pop(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}
