import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/facility.dart';
import '../../data/models/rental_request.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/section_card.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/availability_calendar.dart';
import 'widgets/missing_step_notice.dart';
import 'widgets/rental_stepper.dart';

/// Sewa langkah 2: cek jadwal (node 157:1137) + overlay jadwal tidak
/// tersedia (node 157:1323).
class RentalScheduleScreen extends StatefulWidget {
  const RentalScheduleScreen({super.key});

  @override
  State<RentalScheduleScreen> createState() => _RentalScheduleScreenState();
}

class _RentalScheduleScreenState extends State<RentalScheduleScreen> {
  late DateTime _month;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final start =
        AppStateScope.read(context).rentalDraft.date ?? DateTime.now();
    _month = DateTime(start.year, start.month);
  }

  DayStatus _statusOf(AppState state, Facility facility, DateTime day) {
    if (state.isDatePast(day)) return DayStatus.past;
    return state.isDateFull(facility, day)
        ? DayStatus.full
        : DayStatus.available;
  }

  void _onDayTap(AppState state, Facility facility, DateTime day) {
    if (state.isDateFull(facility, day)) {
      _showUnavailable(facility);
      return;
    }
    state.selectRentalDate(day);
    showAppToast(context, 'Tanggal dipilih — lihat slot waktu di bawah.');
  }

  void _onSlotTap(AppState state, Facility facility, RentalSlot slot) {
    final date = state.rentalDraft.date!;
    if (state.isSlotTaken(facility, date, slot)) {
      showAppToast(context, 'Slot ini sudah penuh, pilih slot lain.');
      return;
    }
    state.selectRentalSlot(slot);
  }

  void _showUnavailable(Facility facility) {
    showAppBottomSheet<void>(
      context,
      builder: (sheetContext) => SheetMessage(
        symbol: '📅',
        title: 'Jadwal tidak tersedia',
        message:
            'Tanggal ini sudah terisi agenda lain di ${facility.name}. '
            'Silakan pilih tanggal lain atau ganti venue.',
        actions: [
          AppButton(
            label: 'Pilih Tanggal Lain',
            onPressed: () => Navigator.of(sheetContext).pop(),
          ),
          AppButton.outline(
            label: 'Ganti Venue',
            onPressed: () {
              Navigator.of(sheetContext).pop();
              Navigator.of(context).pop();
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final draft = state.rentalDraft;
    final facility = draft.facility;
    final navigator = Navigator.of(context);

    return TkbjScaffold(
      children: [
        const PageHeader(
          breadcrumb: 'Sewa Gedung / Cek Jadwal',
          title: 'Cek Jadwal Venue',
          subtitle:
              'Pilih tanggal yang tersedia. Tanggal merah sudah terisi agenda '
              'lain.',
        ),
        const RentalStepper(current: 2),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: facility == null
              ? const MissingStepNotice(message: 'Pilih venue terlebih dahulu.')
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _SelectedVenue(
                      facility: facility,
                      onChange: () => navigator.pop(),
                    ),
                    const SizedBox(height: 16),
                    AvailabilityCalendar(
                      month: _month,
                      selected: draft.date,
                      statusOf: (day) => _statusOf(state, facility, day),
                      onDayTap: (day) => _onDayTap(state, facility, day),
                      onMonthChanged: (delta) => setState(
                        () => _month = DateTime(
                          _month.year,
                          _month.month + delta,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (draft.date == null)
                      Text(
                        'Pilih tanggal untuk melihat slot waktu.',
                        style: AppText.poppins(12, color: AppColors.muted),
                      )
                    else ...[
                      Text(
                        'Slot Waktu · ${Formatters.longDate(draft.date!)}',
                        style: AppText.poppins(14, weight: FontWeight.w600),
                      ),
                      for (final slot in RentalSlot.values) ...[
                        const SizedBox(height: 8),
                        _SlotTile(
                          slot: slot,
                          taken: state.isSlotTaken(facility, draft.date!, slot),
                          selected: draft.slot == slot,
                          onTap: () => _onSlotTap(state, facility, slot),
                        ),
                      ],
                    ],
                    if (draft.slot != null) ...[
                      const SizedBox(height: 16),
                      const NoticeBanner(
                        leading: '✓',
                        message:
                            'Jadwal tersedia! Lanjutkan untuk mengisi formulir '
                            'kegiatan.',
                      ),
                    ],
                    const SizedBox(height: 16),
                    AppButton(
                      label: 'Lanjut Isi Formulir →',
                      onPressed: () {
                        if (draft.slot == null) {
                          showAppToast(
                            context,
                            'Pilih tanggal dan slot waktu terlebih dahulu.',
                          );
                          return;
                        }
                        navigator.pushNamed(AppRoutes.rentalForm);
                      },
                    ),
                    const SizedBox(height: 10),
                    AppButton.outline(
                      label: '← Ganti Venue',
                      onPressed: () => navigator.pop(),
                    ),
                  ],
                ),
        ),
      ],
    );
  }
}

class _SelectedVenue extends StatelessWidget {
  const _SelectedVenue({required this.facility, required this.onChange});

  final Facility facility;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Venue dipilih',
                    style: AppText.poppins(11, color: AppColors.muted),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    facility.name,
                    style: AppText.poppins(15, weight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${Formatters.rupiahShort(facility.ratePerHour!)} / jam · '
                    '${facility.seatCount} kursi',
                    style: AppText.poppins(11, color: AppColors.muted),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            OutlinedButton(
              onPressed: onChange,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.maroon,
                side: const BorderSide(color: AppColors.maroon),
                padding: const EdgeInsets.symmetric(horizontal: 13),
                minimumSize: const Size(0, 32),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
                textStyle: AppText.poppins(12, weight: FontWeight.w600),
              ),
              child: const Text('Ganti'),
            ),
          ],
        ),
      ],
    );
  }
}

class _SlotTile extends StatelessWidget {
  const _SlotTile({
    required this.slot,
    required this.taken,
    required this.selected,
    required this.onTap,
  });

  final RentalSlot slot;
  final bool taken;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final (String status, Color color) = selected
        ? ('Dipilih', AppColors.maroon)
        : taken
        ? ('Penuh', AppColors.error)
        : ('Tersedia', AppColors.success);

    return Semantics(
      button: true,
      selected: selected,
      child: Material(
        color: selected
            ? const Color(0x0D7A2E2E)
            : taken
            ? AppColors.cream
            : AppColors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(
            color: selected ? AppColors.maroon : AppColors.border,
            width: selected ? 1.5 : 1,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    slot.label,
                    style: AppText.poppins(
                      12,
                      weight: FontWeight.w500,
                      color: taken && !selected
                          ? AppColors.muted
                          : AppColors.ink,
                    ),
                  ),
                ),
                Text(
                  status,
                  style: AppText.poppins(
                    11,
                    weight: FontWeight.w600,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
