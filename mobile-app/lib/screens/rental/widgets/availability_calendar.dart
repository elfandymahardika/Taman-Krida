import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';

/// Status satu tanggal pada kalender ketersediaan.
enum DayStatus { available, full, past }

/// Kalender bulanan (Senin pertama) dengan status Tersedia / Penuh / Dipilih.
class AvailabilityCalendar extends StatelessWidget {
  const AvailabilityCalendar({
    super.key,
    required this.month,
    required this.selected,
    required this.statusOf,
    required this.onDayTap,
    required this.onMonthChanged,
  });

  /// Hari pertama bulan yang ditampilkan.
  final DateTime month;
  final DateTime? selected;
  final DayStatus Function(DateTime day) statusOf;
  final ValueChanged<DateTime> onDayTap;
  final ValueChanged<int> onMonthChanged;

  static const _gap = 8.0;

  @override
  Widget build(BuildContext context) {
    final daysInMonth = DateUtils.getDaysInMonth(month.year, month.month);
    final leadingBlanks = DateTime(month.year, month.month).weekday - 1;
    final cellCount = ((leadingBlanks + daysInMonth + 6) ~/ 7) * 7;

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              _MonthArrow(symbol: '‹', onTap: () => onMonthChanged(-1)),
              Expanded(
                child: Text(
                  Formatters.monthYear(month),
                  textAlign: TextAlign.center,
                  style: AppText.poppins(14, weight: FontWeight.w600),
                ),
              ),
              _MonthArrow(symbol: '›', onTap: () => onMonthChanged(1)),
            ],
          ),
          const SizedBox(height: 8),
          _week([
            for (var d = 1; d <= 7; d++)
              Text(
                Formatters.weekdayShort(d),
                textAlign: TextAlign.center,
                style: AppText.poppins(10, color: AppColors.muted),
              ),
          ]),
          for (var week = 0; week < cellCount ~/ 7; week++) ...[
            const SizedBox(height: _gap),
            _week([
              for (var i = week * 7; i < week * 7 + 7; i++)
                _buildCell(i - leadingBlanks + 1, daysInMonth),
            ]),
          ],
          const SizedBox(height: 12),
          const Wrap(
            spacing: 14,
            runSpacing: 6,
            children: [
              _Legend(label: 'Tersedia', fill: AppColors.white, border: true),
              _Legend(label: 'Penuh', fill: Color(0x1FB3261E)),
              _Legend(label: 'Dipilih', fill: AppColors.maroon),
            ],
          ),
        ],
      ),
    );
  }

  /// Satu baris 7 kolom dengan jarak seragam.
  Widget _week(List<Widget> cells) {
    return Row(
      children: [
        for (var i = 0; i < cells.length; i++) ...[
          if (i > 0) const SizedBox(width: _gap),
          Expanded(child: cells[i]),
        ],
      ],
    );
  }

  Widget _buildCell(int day, int daysInMonth) {
    if (day < 1 || day > daysInMonth) return const SizedBox(height: 40);
    final date = DateTime(month.year, month.month, day);
    final status = statusOf(date);
    final isSelected = selected != null && DateUtils.isSameDay(selected, date);

    final (Color background, Color text, Color? border) = isSelected
        ? (AppColors.maroon, AppColors.white, null)
        : switch (status) {
            DayStatus.available => (
              AppColors.white,
              AppColors.ink,
              AppColors.divider,
            ),
            DayStatus.full => (const Color(0x1FB3261E), AppColors.error, null),
            DayStatus.past => (
              AppColors.cream,
              AppColors.muted.withValues(alpha: 0.5),
              null,
            ),
          };

    return Semantics(
      button: status != DayStatus.past,
      selected: isSelected,
      label:
          '$day ${Formatters.monthName(month.month)}, '
          '${status == DayStatus.full ? 'penuh' : 'tersedia'}',
      child: GestureDetector(
        onTap: status == DayStatus.past ? null : () => onDayTap(date),
        child: Container(
          height: 40,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(8),
            border: border == null ? null : Border.all(color: border),
          ),
          child: Text(
            '$day',
            style: AppText.poppins(
              13,
              weight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: text,
            ),
          ),
        ),
      ),
    );
  }
}

class _MonthArrow extends StatelessWidget {
  const _MonthArrow({required this.symbol, required this.onTap});

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
        child: SizedBox(
          width: 27,
          height: 31,
          child: Center(
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
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend({required this.label, required this.fill, this.border = false});

  final String label;
  final Color fill;
  final bool border;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: fill,
            borderRadius: BorderRadius.circular(3),
            border: border ? Border.all(color: AppColors.border) : null,
          ),
        ),
        const SizedBox(width: 6),
        Text(label, style: AppText.poppins(10, color: AppColors.muted)),
      ],
    );
  }
}
