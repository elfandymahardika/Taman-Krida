import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/app_notification.dart';
import '../../data/models/rental_request.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/pill_badge.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';

/// Notifikasi akun (node 157:3189 "mobile-notifikasi").
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  void _open(BuildContext context, AppNotification notification) {
    final state = AppStateScope.read(context);
    state.markNotificationRead(notification.id);
    final navigator = Navigator.of(context);
    switch (notification.target) {
      case NotificationTarget.rental:
        final rental = state.findRental(notification.targetId ?? '');
        if (rental == null) {
          navigator.pushNamed(AppRoutes.rentalHistory);
          return;
        }
        navigator.pushNamed(switch (rental.status) {
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
        navigator.pushNamed(AppRoutes.myTickets);
      case NotificationTarget.communities:
        navigator.pushNamed(AppRoutes.communities);
      case NotificationTarget.calendar:
        navigator.pushNamed(AppRoutes.calendar);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final notifications = state.notifications;
    final unread = state.unreadCount;
    final navigator = Navigator.of(context);

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Akun Saya / Notifikasi',
          title: 'Notifikasi',
          subtitle: 'Kabar terbaru dari pengelola TKBJ untuk akun Anda.',
          onBreadcrumbTap: () => navigator.pop(),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(child: Text('Terbaru', style: AppText.playfair(18))),
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
                        state.markAllNotificationsRead();
                        showAppToast(
                          context,
                          'Semua notifikasi ditandai sudah dibaca.',
                        );
                      },
              ),
              const SizedBox(height: 16),
              AppButton.outline(
                label: '← Kembali ke Akun',
                onPressed: () =>
                    AppRoutes.openFromHome(context, AppRoutes.account),
              ),
            ],
          ),
        ),
      ],
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
