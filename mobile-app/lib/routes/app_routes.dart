import 'package:flutter/material.dart';

import '../screens/account/account_screen.dart';
import '../screens/account/edit_profile_screen.dart';
import '../screens/account/my_tickets_screen.dart';
import '../screens/account/rental_history_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/checkout/checkout_buyer_screen.dart';
import '../screens/checkout/checkout_confirm_screen.dart';
import '../screens/checkout/checkout_payment_screen.dart';
import '../screens/checkout/checkout_success_screen.dart';
import '../screens/coming_soon/coming_soon_screen.dart';
import '../screens/events/event_calendar_screen.dart';
import '../screens/events/event_detail_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/menu/menu_screen.dart';
import '../screens/profile/profile_map_screen.dart';
import '../screens/rental/rental_form_screen.dart';
import '../screens/tickets/ticket_list_screen.dart';
import '../state/app_state.dart';

/// Nama rute semua layar.
abstract final class AppRoutes {
  static const home = '/';
  static const menu = '/menu';
  static const login = '/masuk';
  static const register = '/daftar';
  static const profile = '/profil-denah';
  static const calendar = '/kalender';
  static const eventDetail = '/kalender/detail';
  static const tickets = '/tiket';
  static const checkoutBuyer = '/tiket/pembayaran/data';
  static const checkoutPayment = '/tiket/pembayaran/metode';
  static const checkoutConfirm = '/tiket/pembayaran/konfirmasi';
  static const checkoutSuccess = '/tiket/pembayaran/berhasil';
  static const rental = '/sewa-gedung';
  static const account = '/akun';
  static const myTickets = '/akun/tiket';
  static const rentalHistory = '/akun/riwayat-sewa';
  static const editProfile = '/akun/edit-profil';
  static const comingSoon = '/segera-hadir';

  /// Rute yang hanya bisa dibuka setelah login.
  static const _protected = {account, myTickets, rentalHistory, editProfile};

  /// Kembali ke beranda dan menutup semua layar di atasnya.
  static void goHome(BuildContext context) {
    Navigator.of(context).popUntil((route) => route.isFirst);
  }
}

/// Argumen untuk halaman login/daftar: rute tujuan setelah berhasil masuk.
class AuthArgs {
  const AuthArgs({this.redirectTo, this.redirectArgs});

  final String? redirectTo;
  final Object? redirectArgs;
}

class AppRouter {
  AppRouter(this.state);

  final AppState state;

  Route<dynamic> onGenerateRoute(RouteSettings settings) {
    final name = settings.name ?? AppRoutes.home;

    if (AppRoutes._protected.contains(name) && !state.isLoggedIn) {
      return _page(
        LoginScreen(
          args: AuthArgs(redirectTo: name, redirectArgs: settings.arguments),
        ),
        RouteSettings(name: AppRoutes.login, arguments: settings.arguments),
      );
    }

    final args = settings.arguments;
    final Widget screen = switch (name) {
      AppRoutes.home => const HomeScreen(),
      AppRoutes.menu => const MenuScreen(),
      AppRoutes.login => LoginScreen(args: args is AuthArgs ? args : null),
      AppRoutes.register => RegisterScreen(
        args: args is AuthArgs ? args : null,
      ),
      AppRoutes.profile => const ProfileMapScreen(),
      AppRoutes.calendar => const EventCalendarScreen(),
      AppRoutes.eventDetail => EventDetailScreen(eventId: args! as String),
      AppRoutes.tickets => const TicketListScreen(),
      AppRoutes.checkoutBuyer => const CheckoutBuyerScreen(),
      AppRoutes.checkoutPayment => const CheckoutPaymentScreen(),
      AppRoutes.checkoutConfirm => const CheckoutConfirmScreen(),
      AppRoutes.checkoutSuccess => CheckoutSuccessScreen(
        bookingCode: args! as String,
      ),
      AppRoutes.rental => RentalFormScreen(initialFacilityId: args as String?),
      AppRoutes.account => const AccountScreen(),
      AppRoutes.myTickets => const MyTicketsScreen(),
      AppRoutes.rentalHistory => const RentalHistoryScreen(),
      AppRoutes.editProfile => const EditProfileScreen(),
      AppRoutes.comingSoon => ComingSoonScreen(title: args! as String),
      _ => const HomeScreen(),
    };

    return _page(screen, settings, fullscreenDialog: name == AppRoutes.menu);
  }

  Route<dynamic> _page(
    Widget screen,
    RouteSettings settings, {
    bool fullscreenDialog = false,
  }) {
    return MaterialPageRoute(
      builder: (_) => screen,
      settings: settings,
      fullscreenDialog: fullscreenDialog,
    );
  }
}
