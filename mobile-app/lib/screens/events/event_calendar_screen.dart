import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/dummy/dummy_data.dart';
import '../../routes/app_routes.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/form/picker_field.dart';
import '../../widgets/interactive/chip_filter.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/event_card.dart';

/// Kalender acara budaya (node 1:427 "mobile-kalender-acara").
class EventCalendarScreen extends StatefulWidget {
  const EventCalendarScreen({super.key});

  @override
  State<EventCalendarScreen> createState() => _EventCalendarScreenState();
}

class _EventCalendarScreenState extends State<EventCalendarScreen> {
  /// Bulan awal mengikuti desain: Juni 2026.
  DateTime _month = DateTime(2026, 6);
  String _category = DummyData.eventCategories.first;

  void _shiftMonth(int delta) {
    setState(() => _month = DateTime(_month.year, _month.month + delta));
  }

  Future<void> _openFilterSheet() async {
    final picked = await showOptionSheet<String>(
      context,
      title: 'Filter Kategori Acara',
      options: DummyData.eventCategories,
      labelOf: (c) => c,
      selected: _category,
    );
    if (picked == null || !mounted) return;
    setState(() => _category = picked);
    showAppToast(context, 'Filter diterapkan: $picked');
  }

  @override
  Widget build(BuildContext context) {
    final events = DummyData.events.where((event) {
      final sameMonth =
          event.date.year == _month.year && event.date.month == _month.month;
      final matchCategory =
          _category == DummyData.eventCategories.first ||
          event.category == _category;
      return sameMonth && matchCategory;
    }).toList();

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Beranda / Kalender Acara',
          title: 'Kalender Acara Budaya',
          subtitle:
              'Pantau seluruh rangkaian agenda pertunjukan tradisi dan seni '
              'pameran budaya.',
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          color: AppColors.white,
          border: const Border(bottom: BorderSide(color: AppColors.divider)),
          child: Row(
            children: [
              _MonthButton(symbol: '‹', onTap: () => _shiftMonth(-1)),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  Formatters.monthYear(_month),
                  style: AppText.playfair(16),
                ),
              ),
              const SizedBox(width: 8),
              _MonthButton(symbol: '›', onTap: () => _shiftMonth(1)),
              const Spacer(),
              ChipFilter(
                label: 'Filter',
                active: true,
                onTap: _openFilterSheet,
              ),
            ],
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.only(top: 12),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                for (final category in DummyData.eventCategories) ...[
                  ChipFilter(
                    label: category,
                    active: category == _category,
                    onTap: () => setState(() => _category = category),
                  ),
                  const SizedBox(width: 8),
                ],
              ],
            ),
          ),
        ),
        ContentSection(
          child: events.isEmpty
              ? _EmptyState(month: _month)
              : ResponsiveGrid(
                  children: [
                    for (final event in events)
                      EventCard(
                        event: event,
                        onTap: () => Navigator.of(
                          context,
                        ).pushNamed(AppRoutes.eventDetail, arguments: event.id),
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}

class _MonthButton extends StatelessWidget {
  const _MonthButton({required this.symbol, required this.onTap});

  final String symbol;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.cream,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(6),
        side: const BorderSide(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Text(
            symbol,
            style: AppText.poppins(
              14,
              weight: FontWeight.w600,
              color: AppColors.maroon,
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.month});

  final DateTime month;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: [
          Text('Belum ada acara', style: AppText.playfair(18)),
          const SizedBox(height: 6),
          Text(
            'Tidak ada agenda untuk kategori ini pada '
            '${Formatters.monthYear(month)}. Coba bulan atau kategori lain.',
            textAlign: TextAlign.center,
            style: AppText.poppins(12, color: AppColors.muted),
          ),
        ],
      ),
    );
  }
}
