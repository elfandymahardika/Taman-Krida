import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/validators.dart';
import '../../data/dummy/dummy_data.dart';
import '../../data/models/facility.dart';
import '../../data/models/rental_request.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/form/labeled_text_field.dart';
import '../../widgets/form/picker_field.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/rental_summary_card.dart';

/// Formulir kegiatan sewa gedung (node 1:1270 "mobile-sewa-formulir").
class RentalFormScreen extends StatefulWidget {
  const RentalFormScreen({super.key, this.initialFacilityId});

  final String? initialFacilityId;

  @override
  State<RentalFormScreen> createState() => _RentalFormScreenState();
}

class _RentalFormScreenState extends State<RentalFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _activityController = TextEditingController();
  final _applicantController = TextEditingController();
  final _contactController = TextEditingController();

  final _rentableFacilities = DummyData.facilities
      .where((f) => f.isRentable)
      .toList();

  Facility? _facility;
  DateTime? _date;
  int? _startHour;
  int? _duration;

  @override
  void initState() {
    super.initState();
    final initialId = widget.initialFacilityId;
    if (initialId != null) {
      _facility = _rentableFacilities.firstWhere((f) => f.id == initialId);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final user = AppStateScope.read(context).currentUser;
    if (user != null && _applicantController.text.isEmpty) {
      _applicantController.text = user.name;
      _contactController.text = user.phone;
    }
  }

  @override
  void dispose() {
    _activityController.dispose();
    _applicantController.dispose();
    _contactController.dispose();
    super.dispose();
  }

  String? _validateDate(DateTime? date) {
    if (date == null) return 'Tanggal pelaksanaan wajib dipilih.';
    final facility = _facility;
    if (facility != null &&
        AppStateScope.read(context).isVenueBooked(facility, date)) {
      return '${facility.shortName} sudah terisi pada tanggal ini. '
          'Pilih tanggal lain.';
    }
    return null;
  }

  String? _validateDuration(int? duration) {
    if (duration == null) return 'Durasi wajib dipilih.';
    final start = _startHour;
    if (start != null && start + duration > DummyData.rentalClosingHour) {
      return 'Melewati jam operasional (tutup '
          '${Formatters.hour(DummyData.rentalClosingHour)}).';
    }
    return null;
  }

  Future<DateTime?> _pickDate(BuildContext context, DateTime? current) {
    final today = DateUtils.dateOnly(DateTime.now());
    return showDatePicker(
      context: context,
      initialDate: current ?? today.add(const Duration(days: 3)),
      firstDate: today,
      lastDate: today.add(const Duration(days: 365)),
      helpText: 'Pilih tanggal kegiatan',
    );
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) {
      showAppToast(context, 'Periksa kembali data yang belum valid.');
      return;
    }
    final request = AppStateScope.read(context).submitRental(
      facility: _facility!,
      activityName: _activityController.text,
      date: _date!,
      startHour: _startHour!,
      durationHours: _duration!,
      applicantName: _applicantController.text,
      contact: _contactController.text,
    );
    _showSubmitted(request);
  }

  void _showSubmitted(RentalRequest request) {
    showAppBottomSheet<void>(
      context,
      builder: (sheetContext) => SheetMessage(
        symbol: '✓',
        symbolColor: AppColors.success,
        symbolBackground: const Color(0x263A9D4F),
        title: 'Pengajuan Terkirim!',
        message:
            'Kode pengajuan ${request.code} untuk ${request.facility.shortName} '
            'pada ${Formatters.longDate(request.date)}. Admin TKBJ akan '
            'memverifikasi dalam 1×24 jam.',
        actions: [
          AppButton(
            label: 'Lihat Riwayat Sewa',
            onPressed: () {
              Navigator.of(sheetContext).pop();
              Navigator.of(context)
                  .pushReplacementNamed(AppRoutes.rentalHistory);
            },
          ),
          AppButton.outline(
            label: 'Kembali ke Beranda',
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
    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Sewa Gedung / Formulir',
          title: 'Formulir Kegiatan',
          subtitle:
              'Lengkapi data kegiatan untuk venue dan tanggal yang ingin '
              'Anda sewa.',
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Data Kegiatan', style: AppText.playfair(18)),
                const SizedBox(height: 14),
                PickerField<Facility>(
                  label: 'Venue',
                  hint: 'Pilih venue yang akan disewa',
                  initialValue: _facility,
                  display: (f) => f.name,
                  validator: (f) => f == null ? 'Venue wajib dipilih.' : null,
                  onPick: (context, current) => showOptionSheet(
                    context,
                    title: 'Pilih Venue',
                    options: _rentableFacilities,
                    selected: current,
                    labelOf: (f) => f.name,
                    subtitleOf: (f) =>
                        '${f.capacityLabel} · '
                        '${Formatters.rupiah(f.ratePerHour!)}/jam',
                  ),
                  onChanged: (f) => setState(() => _facility = f),
                ),
                const SizedBox(height: 14),
                LabeledTextField(
                  label: 'Nama Kegiatan',
                  controller: _activityController,
                  hint: 'Contoh: Festival Tari Topeng Malangan 2026',
                  validator: (v) =>
                      Validators.name(v, fieldName: 'Nama kegiatan'),
                ),
                const SizedBox(height: 14),
                PickerField<DateTime>(
                  label: 'Tanggal Pelaksanaan',
                  hint: 'Pilih tanggal',
                  display: Formatters.longDate,
                  validator: _validateDate,
                  onPick: _pickDate,
                  onChanged: (d) => setState(() => _date = d),
                ),
                const SizedBox(height: 14),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: PickerField<int>(
                        label: 'Jam Mulai',
                        hint: 'Pilih jam',
                        display: Formatters.hour,
                        validator: (h) =>
                            h == null ? 'Jam mulai wajib dipilih.' : null,
                        onPick: (context, current) => showOptionSheet(
                          context,
                          title: 'Jam Mulai',
                          options: DummyData.rentalStartHours,
                          selected: current,
                          labelOf: (h) => '${Formatters.hour(h)} WIB',
                        ),
                        onChanged: (h) => setState(() => _startHour = h),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: PickerField<int>(
                        label: 'Estimasi Durasi (Jam)',
                        hint: 'Pilih durasi',
                        display: (d) => '$d Jam',
                        validator: _validateDuration,
                        onPick: (context, current) => showOptionSheet(
                          context,
                          title: 'Estimasi Durasi',
                          options: List.generate(8, (i) => i + 1),
                          selected: current,
                          labelOf: (d) => '$d Jam',
                        ),
                        onChanged: (d) => setState(() => _duration = d),
                      ),
                    ),
                  ],
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
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9+\- ]')),
                  ],
                  validator: Validators.phone,
                ),
                const SizedBox(height: 20),
                RentalSummaryCard(
                  facility: _facility,
                  date: _date,
                  startHour: _startHour,
                  durationHours: _duration,
                ),
                const SizedBox(height: 20),
                AppButton(label: 'Kirim Pengajuan Sewa →', onPressed: _submit),
                const SizedBox(height: 10),
                AppButton.outline(
                  label: '← Kembali',
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
