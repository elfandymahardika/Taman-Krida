import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../state/app_state.dart';
import '../../routes/app_routes.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/load_status.dart';
import '../../widgets/interactive/chip_filter.dart';
import '../../widgets/interactive/chip_filter_bar.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/event_card.dart';
import 'widgets/event_filter_sheet.dart';

/// Kalender acara budaya (node 1:427 "mobile-kalender-acara").
class EventCalendarScreen extends StatefulWidget {
  const EventCalendarScreen({super.key});

  @override
  State<EventCalendarScreen> createState() => _EventCalendarScreenState();
}

class _EventCalendarScreenState extends State<EventCalendarScreen> {
  /// Bulan awal = bulan "hari ini" server (diisi saat layar pertama dibuka).
  DateTime? _month;
  String _category = 'Semua';
  EventRange _range = EventRange.month;

  DateTime get month => _month ?? DateTime(2026, 6);

  void _shiftMonth(int delta) {
    setState(() {
      _month = DateTime(month.year, month.month + delta);
      if (_range == EventRange.week) _range = EventRange.month;
    });
  }

  Future<void> _openFilterSheet() async {
    final picked = await showEventFilterSheet(context, current: _range);
    if (picked == null || !mounted) return;
    setState(() {
      _range = picked;
      if (picked == EventRange.week) {
        final today = AppStateScope.read(context).today;
        _month = DateTime(today.year, today.month);
      }
    });
    showAppToast(context, 'Filter diterapkan: ${picked.label}.');
  }

  bool _inRange(DateTime date, DateTime today) {
    switch (_range) {
      case EventRange.month:
        return date.year == month.year && date.month == month.month;
      case EventRange.weekend:
        return date.year == month.year &&
            date.month == month.month &&
            date.weekday >= DateTime.saturday;
      case EventRange.week:
        final monday = today.subtract(Duration(days: today.weekday - 1));
        return !date.isBefore(monday) &&
            date.isBefore(monday.add(const Duration(days: 7)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    if (_month == null && state.catalogState == LoadState.ready) {
      _month = DateTime(state.today.year, state.today.month);
    }
    final categories = state.eventCategories;
    final events = state.events.where((event) {
      final matchCategory =
          _category == categories.first || event.category == _category;
      return _inRange(event.date, state.today) && matchCategory;
    }).toList();
    final loaded = state.catalogState == LoadState.ready;
    final period = _range == EventRange.week
        ? 'pekan ini'
        : Formatters.monthYear(month);

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
                  Formatters.monthYear(month),
                  style: AppText.playfair(16),
                ),
              ),
              const SizedBox(width: 8),
              _MonthButton(symbol: '›', onTap: () => _shiftMonth(1)),
              const Spacer(),
              ChipFilter(
                label: _range == EventRange.month
                    ? 'Filter'
                    : 'Filter · ${_range.label}',
                active: true,
                onTap: _openFilterSheet,
              ),
            ],
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.only(top: 12),
          child: ChipFilterBar(
            options: categories,
            selected: _category,
            onSelected: (category) => setState(() => _category = category),
          ),
        ),
        ContentSection(
          child: !loaded
              ? LoadStatus.catalog(state)
              : events.isEmpty
              ? _EmptyState(period: period)
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
  const _EmptyState({required this.period});

  final String period;

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
            'Tidak ada agenda untuk filter ini pada $period. '
            'Coba bulan, rentang, atau kategori lain.',
            textAlign: TextAlign.center,
            style: AppText.poppins(12, color: AppColors.muted),
          ),
        ],
      ),
    );
  }
}
