import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/dummy/dummy_data.dart';
import '../../data/models/facility.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/section_card.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/rental_stepper.dart';

/// Sewa langkah 1: pilih venue (node 157:1054 "mobile-sewa-pilih-venue").
class RentalVenueScreen extends StatefulWidget {
  const RentalVenueScreen({super.key, this.initialFacilityId});

  /// Diisi saat dibuka dari denah ("Ajukan Sewa Venue Ini").
  final String? initialFacilityId;

  @override
  State<RentalVenueScreen> createState() => _RentalVenueScreenState();
}

class _RentalVenueScreenState extends State<RentalVenueScreen> {
  final _venues = DummyData.facilities.where((f) => f.isRentable).toList();
  Facility? _selected;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final id = widget.initialFacilityId;
    _selected = id != null
        ? _venues.firstWhere((f) => f.id == id)
        : AppStateScope.read(context).rentalDraft.facility;
  }

  void _continue() {
    final venue = _selected;
    if (venue == null) {
      showAppToast(context, 'Pilih salah satu venue terlebih dahulu.');
      return;
    }
    AppStateScope.read(context).selectRentalVenue(venue);
    Navigator.of(context).pushNamed(AppRoutes.rentalSchedule);
  }

  @override
  Widget build(BuildContext context) {
    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Beranda / Sewa Gedung',
          title: 'Sewa Fasilitas TKBJ',
          subtitle:
              'Pilih venue, cek jadwal, lalu ajukan izin sewa resmi untuk '
              'kegiatan seni Anda.',
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        const RentalStepper(current: 1),
        ContentSection(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Pilih Venue Fasilitas', style: AppText.playfair(18)),
              const SizedBox(height: 10),
              for (final venue in _venues) ...[
                _VenueCard(
                  facility: venue,
                  selected: venue.id == _selected?.id,
                  onTap: () => setState(() => _selected = venue),
                ),
                const SizedBox(height: 10),
              ],
              const SizedBox(height: 10),
              const NoticeBanner(
                color: AppColors.maroon,
                message:
                    'Ketuk salah satu venue untuk melihat jadwal ketersediaan. '
                    'Pengajuan akan diverifikasi admin maks. 1×24 jam.',
              ),
              const SizedBox(height: 20),
              AppButton(
                label: 'Cek Jadwal Ketersediaan →',
                onPressed: _continue,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _VenueCard extends StatelessWidget {
  const _VenueCard({
    required this.facility,
    required this.selected,
    required this.onTap,
  });

  final Facility facility;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: selected,
      inMutuallyExclusiveGroup: true,
      child: Material(
        color: selected ? const Color(0x0D7A2E2E) : AppColors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
            color: selected ? AppColors.maroon : AppColors.border,
            width: selected ? 1.5 : 1,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  width: 18,
                  height: 18,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.white,
                    border: Border.all(
                      color: selected ? AppColors.maroon : AppColors.border,
                      width: 1.5,
                    ),
                  ),
                  child: selected
                      ? Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.maroon,
                            shape: BoxShape.circle,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        facility.name,
                        style: AppText.poppins(14, weight: FontWeight.w600),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        facility.rentalCapacityLabel ?? facility.capacityLabel,
                        style: AppText.poppins(12, color: AppColors.muted),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${Formatters.rupiahShort(facility.ratePerHour!)} / Jam',
                        style: AppText.poppins(
                          13,
                          weight: FontWeight.w700,
                          color: AppColors.maroon,
                        ),
                      ),
                    ],
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
