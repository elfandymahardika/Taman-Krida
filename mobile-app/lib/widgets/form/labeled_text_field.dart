import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_text_styles.dart';

/// Label tebal 13px + input bergaris #EADCC9, sesuai form pada desain.
class LabeledTextField extends StatelessWidget {
  const LabeledTextField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.validator,
    this.keyboardType,
    this.textInputAction = TextInputAction.next,
    this.obscureText = false,
    this.inputFormatters,
    this.autofillHints,
    this.suffix,
    this.onFieldSubmitted,
    this.maxLines = 1,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final FormFieldValidator<String>? validator;
  final TextInputType? keyboardType;
  final TextInputAction textInputAction;
  final bool obscureText;
  final List<TextInputFormatter>? inputFormatters;
  final Iterable<String>? autofillHints;
  final Widget? suffix;
  final ValueChanged<String>? onFieldSubmitted;

  /// Lebih dari 1 untuk isian panjang seperti deskripsi.
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return FieldLabel(
      label: label,
      child: TextFormField(
        controller: controller,
        validator: validator,
        keyboardType: keyboardType,
        textInputAction: textInputAction,
        obscureText: obscureText,
        inputFormatters: inputFormatters,
        autofillHints: autofillHints,
        onFieldSubmitted: onFieldSubmitted,
        maxLines: maxLines,
        minLines: maxLines > 1 ? 3 : null,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        style: AppText.poppins(13),
        decoration: InputDecoration(
          hintText: hint,
          suffixIcon: suffix,
          suffixIconConstraints: const BoxConstraints(minHeight: 20),
        ),
      ),
    );
  }
}

/// Membungkus input apa pun dengan label di atasnya (jarak 6px).
class FieldLabel extends StatelessWidget {
  const FieldLabel({super.key, required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(label, style: AppText.poppins(13, weight: FontWeight.w600)),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}
