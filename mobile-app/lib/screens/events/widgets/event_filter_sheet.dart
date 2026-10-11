import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../widgets/common/app_button.dart';
import '../../../widgets/common/app_feedback.dart';

/// Rentang waktu pada overlay "Filter Acara" (node 157:2703).
enum EventRange {
  month('Bulan ini'),
  week('Pekan ini'),
  weekend('Akhir pekan');

  const EventRange(this.label);

  final String label;
}

/// Menampilkan overlay filter. Mengembalikan rentang yang dipilih
/// ("Atur Ulang" mengembalikan [EventRange.month]); `null` jika ditutup.
Future<EventRange?> showEventFilterSheet(
  BuildContext context, {
  required EventRange current,
}) {
  return showAppBottomSheet<EventRange>(
    context,
    builder: (sheetContext) => _EventFilterBody(current: current),
  );
}

class _EventFilterBody extends StatefulWidget {
  const _EventFilterBody({required this.current});

  final EventRange current;

  @override
  State<_EventFilterBody> createState() => _EventFilterBodyState();
}

class _EventFilterBodyState extends State<_EventFilterBody> {
  late EventRange _selected = widget.current;

  @override
  Widget build(BuildContext context) {
    final navigator = Navigator.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Filter Acara', style: AppText.playfair(20)),
        const SizedBox(height: 8),
        Text(
          'Pilih rentang waktu acara yang ingin ditampilkan.',
          style: AppText.poppins(13, color: AppColors.muted),
        ),
        for (final range in EventRange.values) ...[
          const SizedBox(height: 14),
          _RangeOption(
            label: range.label,
            selected: range == _selected,
            onTap: () => setState(() => _selected = range),
          ),
        ],
        const SizedBox(height: 14),
        AppButton(
          label: 'Terapkan Filter',
          onPressed: () => navigator.pop(_selected),
        ),
        const SizedBox(height: 14),
        AppButton.outline(
          label: 'Atur Ulang',
          onPressed: () => navigator.pop(EventRange.month),
        ),
      ],
    );
  }
}

class _RangeOption extends StatelessWidget {
  const _RangeOption({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: selected,
      inMutuallyExclusiveGroup: true,
      child: Material(
        color: selected ? AppColors.maroonTint : AppColors.white,
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
          child: SizedBox(
            height: 50,
            child: Center(
              child: Text(
                label,
                style: AppText.poppins(
                  14,
                  weight: FontWeight.w600,
                  color: selected ? AppColors.maroon : AppColors.ink,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
