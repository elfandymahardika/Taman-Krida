import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../domain/entities/app_notification.dart';
import '../../../domain/entities/rental_request.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/load_status.dart';
import '../../widgets/common/refresh_on_open.dart';
import '../../widgets/common/pill_badge.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';

/// Notifikasi akun (node 157:3189 "mobile-notifikasi").
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  void _open(BuildContext context, AppNotification notification) {
    final notificationController = context.read<NotificationController>();
    final rentalController = context.read<RentalController>();
    final ticketController = context.read<TicketController>();
    notificationController.markRead(notification.id);
    final navigator = Navigator.of(context);
    switch (notification.target) {
      case NotificationTarget.rental:
        final rental = rentalController.findRental(notification.targetId ?? '');
        if (rental == null) {
          navigator.pushNamed(AppRoutes.rentalHistory);
          return;
        }
        navigator.pushNamed(switch (rental.status) {
          RentalStatus.approved when rental.isVerifyingPayment =>
            AppRoutes.rentalStatus,
          RentalStatus.approved => AppRoutes.rentalPayment,
          RentalStatus.paid => AppRoutes.rentalReceipt,
          RentalStatus.rejected => AppRoutes.rentalRejected,
          RentalStatus.pending => AppRoutes.rentalStatus,
        }, arguments: rental.code);
      case NotificationTarget.event:
        navigator.pushNamed(
          AppRoutes.eventDetail,
          arguments: notification.targetId,
        );
      case NotificationTarget.tickets:
        final order = ticketController.findOrder(notification.targetId ?? '');
        if (order == null) {
          navigator.pushNamed(AppRoutes.myTickets);
        } else {
          navigator.pushNamed(
            AppRoutes.checkoutSuccess,
            arguments: order.bookingCode,
          );
        }
      case NotificationTarget.communities:
        navigator.pushNamed(AppRoutes.communities);
      case NotificationTarget.calendar:
        navigator.pushNamed(AppRoutes.calendar);
    }
  }

  @override
  Widget build(BuildContext context) {
    final notificationController = context.watch<NotificationController>();
    final authController = context.watch<AuthController>();
    final notifications = notificationController.notifications;
    final unread = notificationController.unreadCount;

    return RefreshOnOpen(
      child: TkbjScaffold(
        title: 'Notifikasi',
        subtitle: 'Kabar terbaru dari pengelola TKBJ untuk akun Anda.',
        children: [
          ContentSection(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text('Terbaru', style: AppText.playfair(18)),
                    ),
                    if (unread > 0)
                      PillBadge(
                        '$unread baru',
                        fontSize: 10,
                        color: AppColors.white,
                        background: AppColors.maroon,
                        weight: FontWeight.w600,
                      ),
                  ],
                ),
                if (notifications.isEmpty) ...[
                  const SizedBox(height: 16),
                  LoadStatus(
                    loading: authController.accountLoading,
                    error: authController.accountLoading
                        ? null
                        : 'Belum ada notifikasi.',
                  ),
                ],
                for (final notification in notifications) ...[
                  const SizedBox(height: 16),
                  _NotificationCard(
                    notification: notification,
                    onTap: () => _open(context, notification),
                  ),
                ],
                const SizedBox(height: 16),
                AppButton.outline(
                  label: 'Tandai Semua Sudah Dibaca',
                  onPressed: unread == 0
                      ? null
                      : () {
                          notificationController.markAllRead();
                          showAppToast(
                            context,
                            'Semua notifikasi ditandai sudah dibaca.',
                          );
                        },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(15),
      borderColor: notification.read ? AppColors.divider : AppColors.border,
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.maroonTint,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(notification.symbol, style: AppText.poppins(14)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  notification.title,
                  style: AppText.poppins(
                    14,
                    weight: notification.read
                        ? FontWeight.w500
                        : FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  notification.body,
                  style: AppText.poppins(12, color: AppColors.muted),
                ),
                const SizedBox(height: 3),
                Text(
                  Formatters.relative(notification.createdAt),
                  style: AppText.poppins(10, color: AppColors.muted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 8,
            height: 8,
            margin: const EdgeInsets.only(top: 6),
            decoration: BoxDecoration(
              color: notification.read ? Colors.transparent : AppColors.maroon,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }
}
