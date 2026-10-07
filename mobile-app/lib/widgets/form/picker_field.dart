import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import 'labeled_text_field.dart';

/// Input yang tampil seperti text field tetapi membuka pemilih
/// (tanggal, daftar pilihan) saat ditekan. Mendukung validasi form.
class PickerField<T> extends FormField<T> {
  PickerField({
    super.key,
    required String label,
    required String hint,
    required String Function(T value) display,
    required Future<T?> Function(BuildContext context, T? current) onPick,
    super.initialValue,
    super.validator,
    ValueChanged<T>? onChanged,
  }) : super(
         autovalidateMode: AutovalidateMode.onUserInteraction,
         builder: (state) {
           final value = state.value;
           final hasError = state.hasError;
           return FieldLabel(
             label: label,
             child: Column(
               crossAxisAlignment: CrossAxisAlignment.start,
               children: [
                 Material(
                   color: AppColors.white,
                   shape: RoundedRectangleBorder(
                     borderRadius: BorderRadius.circular(8),
                     side: BorderSide(
                       color: hasError ? AppColors.error : AppColors.border,
                       width: 1.5,
                     ),
                   ),
                   clipBehavior: Clip.antiAlias,
                   child: InkWell(
                     onTap: () async {
                       final picked = await onPick(state.context, value);
                       if (picked == null) return;
                       state.didChange(picked);
                       onChanged?.call(picked);
                     },
                     child: Padding(
                       padding: const EdgeInsets.symmetric(
                         horizontal: 16,
                         vertical: 12,
                       ),
                       child: Row(
                         children: [
                           Expanded(
                             child: Text(
                               value == null ? hint : display(value),
                               style: AppText.poppins(
                                 13,
                                 color: value == null
                                     ? AppColors.muted
                                     : AppColors.ink,
                               ),
                             ),
                           ),
                           Text(
                             '▾',
                             style: AppText.poppins(
                               12,
                               color: AppColors.maroon,
                             ),
                           ),
                         ],
                       ),
                     ),
                   ),
                 ),
                 if (hasError) ...[
                   const SizedBox(height: 6),
                   Padding(
                     padding: const EdgeInsets.symmetric(horizontal: 12),
                     child: Text(
                       state.errorText!,
                       style: AppText.poppins(11, color: AppColors.error),
                     ),
                   ),
                 ],
               ],
             ),
           );
         },
       );
}

/// Bottom sheet daftar pilihan sederhana untuk [PickerField].
Future<T?> showOptionSheet<T>(
  BuildContext context, {
  required String title,
  required List<T> options,
  required String Function(T option) labelOf,
  String Function(T option)? subtitleOf,
  bool Function(T option)? isEnabled,
  T? selected,
}) {
  return showModalBottomSheet<T>(
    context: context,
    useSafeArea: true,
    isScrollControlled: true,
    backgroundColor: AppColors.white,
    barrierColor: AppColors.backdrop,
    constraints: const BoxConstraints(maxWidth: 560),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (sheetContext) => ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(sheetContext).height * 0.7,
      ),
      child: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        children: [
          Text(title, style: AppText.playfair(18)),
          const SizedBox(height: 12),
          for (final option in options)
            _OptionTile(
              label: labelOf(option),
              subtitle: subtitleOf?.call(option),
              selected: option == selected,
              enabled: isEnabled?.call(option) ?? true,
              onTap: () => Navigator.of(sheetContext).pop(option),
            ),
        ],
      ),
    ),
  );
}

class _OptionTile extends StatelessWidget {
  const _OptionTile({
    required this.label,
    required this.selected,
    required this.enabled,
    required this.onTap,
    this.subtitle,
  });

  final String label;
  final String? subtitle;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.45,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: AppText.poppins(
                        14,
                        weight: selected ? FontWeight.w700 : FontWeight.w500,
                        color: selected ? AppColors.maroon : AppColors.ink,
                      ),
                    ),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: AppText.poppins(11, color: AppColors.muted),
                      ),
                  ],
                ),
              ),
              if (selected)
                Text('✓', style: AppText.poppins(14, color: AppColors.maroon)),
            ],
          ),
        ),
      ),
    );
  }
}
