import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../controllers/controllers.dart';
import '../account/account_screen.dart';
import '../account/guest_account_screen.dart';
import '../events/event_calendar_screen.dart';
import '../home/home_screen.dart';
import '../menu/menu_screen.dart';
import '../tickets/ticket_list_screen.dart';

/// Tab pada bottom navigation.
enum ShellTab {
  home('Beranda', Icons.home_outlined, Icons.home_rounded),
  events('Acara', Icons.event_note_outlined, Icons.event_note_rounded),
  tickets(
    'Tiket',
    Icons.confirmation_number_outlined,
    Icons.confirmation_number_rounded,
  ),
  explore('Jelajah', Icons.explore_outlined, Icons.explore_rounded),
  account('Akun', Icons.person_outline_rounded, Icons.person_rounded);

  const ShellTab(this.label, this.icon, this.selectedIcon);

  final String label;
  final IconData icon;
  final IconData selectedIcon;
}

/// Menyimpan tab aktif. Dipasang di atas [MaterialApp] agar layar yang
/// dibuka di atas beranda bisa kembali ke tab tertentu.
class ShellScope extends InheritedNotifier<ValueNotifier<ShellTab>> {
  const ShellScope({
    super.key,
    required ValueNotifier<ShellTab> controller,
    required super.child,
  }) : super(notifier: controller);

  static ValueNotifier<ShellTab> of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ShellScope>()!.notifier!;

  /// Tanpa berlangganan perubahan (untuk callback).
  static ValueNotifier<ShellTab>? read(BuildContext context) =>
      context.getInheritedWidgetOfExactType<ShellScope>()?.notifier;
}

/// Layar utama: lima tab dengan bottom navigation. Tab baru dibangun saat
/// pertama kali dibuka, lalu state-nya dipertahankan.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  final _visited = <ShellTab>{};

  Widget _screenFor(ShellTab tab, bool isLoggedIn) => switch (tab) {
    ShellTab.home => const HomeScreen(),
    ShellTab.events => const EventCalendarScreen(),
    ShellTab.tickets => const TicketListScreen(),
    ShellTab.explore => const MenuScreen(),
    ShellTab.account =>
      isLoggedIn ? const AccountScreen() : const GuestAccountScreen(),
  };

  @override
  Widget build(BuildContext context) {
    final controller = ShellScope.of(context);
    final ticketController = context.watch<TicketController>();
    final notificationController = context.watch<NotificationController>();
    final authController = context.watch<AuthController>();
    final current = controller.value;
    _visited.add(current);

    final cartCount = ticketController.cartLines.fold(
      0,
      (sum, l) => sum + l.quantity,
    );
    final badges = {
      ShellTab.tickets: cartCount,
      ShellTab.account: notificationController.unreadCount,
    };

    return PopScope(
      // Tombol kembali Android di tab lain → kembali ke Beranda dulu.
      canPop: current == ShellTab.home,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) controller.value = ShellTab.home;
      },
      child: Scaffold(
        body: IndexedStack(
          index: current.index,
          children: [
            for (final tab in ShellTab.values)
              _visited.contains(tab)
                  ? _screenFor(tab, authController.isLoggedIn)
                  : const SizedBox.shrink(),
          ],
        ),
        bottomNavigationBar: DecoratedBox(
          decoration: const BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: AppColors.navShadow,
                offset: Offset(0, -2),
                blurRadius: 12,
              ),
            ],
          ),
          child: NavigationBar(
            selectedIndex: current.index,
            onDestinationSelected: (index) {
              HapticFeedback.selectionClick();
              controller.value = ShellTab.values[index];
            },
            destinations: [
              for (final tab in ShellTab.values)
                NavigationDestination(
                  tooltip: tab.label,
                  label: tab.label,
                  icon: _BadgeIcon(icon: tab.icon, count: badges[tab] ?? 0),
                  selectedIcon: _BadgeIcon(
                    icon: tab.selectedIcon,
                    count: badges[tab] ?? 0,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BadgeIcon extends StatelessWidget {
  const _BadgeIcon({required this.icon, required this.count});

  final IconData icon;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Badge.count(
      count: count,
      isLabelVisible: count > 0,
      backgroundColor: AppColors.gold,
      textColor: AppColors.maroonDark,
      child: Icon(icon),
    );
  }
}
