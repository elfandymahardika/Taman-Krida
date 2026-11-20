import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../domain/entities/rental_request.dart';

/// Warna lencana status sewa. Ada di layer presentation agar entity
/// [RentalStatus] tetap Dart murni (tanpa `Color`).
extension RentalStatusStyle on RentalStatus {
  Color get color => switch (this) {
    RentalStatus.pending => AppColors.gold,
    RentalStatus.approved || RentalStatus.paid => AppColors.success,
    RentalStatus.rejected => AppColors.error,
  };

  Color get background => switch (this) {
    RentalStatus.pending => AppColors.goldTint,
    RentalStatus.approved || RentalStatus.paid => const Color(0x263A9D4F),
    RentalStatus.rejected => const Color(0x1AB3261E),
  };
}
