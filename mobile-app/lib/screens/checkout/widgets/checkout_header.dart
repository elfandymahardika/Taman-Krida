import 'package:flutter/material.dart';

import '../../../widgets/interactive/step_tracker.dart';
import '../../../widgets/layout/page_header.dart';

/// Header + indikator langkah yang sama di semua layar checkout.
class CheckoutHeader extends StatelessWidget {
  const CheckoutHeader({
    super.key,
    required this.step,
    required this.breadcrumb,
    required this.title,
    required this.subtitle,
  });

  final int step;
  final String breadcrumb;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PageHeader(breadcrumb: breadcrumb, title: title, subtitle: subtitle),
        StepTracker(current: step),
      ],
    );
  }
}
