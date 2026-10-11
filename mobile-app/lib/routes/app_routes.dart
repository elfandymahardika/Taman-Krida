import 'package:flutter/material.dart';

import '../screens/account/account_screen.dart';
import '../screens/account/edit_profile_screen.dart';
import '../screens/account/my_tickets_screen.dart';
import '../screens/account/notifications_screen.dart';
import '../screens/account/rental_history_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/checkout/checkout_buyer_screen.dart';
import '../screens/checkout/checkout_confirm_screen.dart';
import '../screens/checkout/checkout_payment_screen.dart';
import '../screens/checkout/checkout_success_screen.dart';
import '../screens/community/community_detail_screen.dart';
import '../screens/community/community_directory_screen.dart';
import '../screens/community/community_register_screen.dart';
import '../screens/education/education_detail_screen.dart';
import '../screens/education/education_screen.dart';
import '../screens/events/event_calendar_screen.dart';
import '../screens/events/event_detail_screen.dart';
import '../screens/gallery/gallery_detail_screen.dart';
import '../screens/gallery/gallery_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/menu/menu_screen.dart';
import '../screens/profile/profile_map_screen.dart';
import '../screens/rental/rental_documents_screen.dart';
import '../screens/rental/rental_form_screen.dart';
import '../screens/rental/rental_payment_screen.dart';
import '../screens/rental/rental_receipt_screen.dart';
import '../screens/rental/rental_rejected_screen.dart';
import '../screens/rental/rental_schedule_screen.dart';
import '../screens/rental/rental_status_screen.dart';
import '../screens/rental/rental_venue_screen.dart';
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

  // Sewa gedung: 5 langkah + hasil verifikasi.
  static const rental = '/sewa-gedung';
  static const rentalSchedule = '/sewa-gedung/jadwal';
  static const rentalForm = '/sewa-gedung/formulir';
  static const rentalDocuments = '/sewa-gedung/berkas';
  static const rentalStatus = '/sewa-gedung/status';
  static const rentalRejected = '/sewa-gedung/ditolak';
  static const rentalPayment = '/sewa-gedung/pembayaran';
  static const rentalReceipt = '/sewa-gedung/bukti';

  static const gallery = '/galeri';
  static const galleryDetail = '/galeri/detail';
  static const communities = '/komunitas';
  static const communityDetail = '/komunitas/detail';
  static const communityRegister = '/komunitas/daftar';
  static const education = '/edukasi';
  static const educationDetail = '/edukasi/detail';

  static const account = '/akun';
  static const myTickets = '/akun/tiket';
  static const rentalHistory = '/akun/riwayat-sewa';
  static const editProfile = '/akun/edit-profil';
  static const notifications = '/akun/notifikasi';

  /// Rute yang hanya bisa dibuka setelah login.
  static const _protected = {
    account,
    myTickets,
    rentalHistory,
    editProfile,
    notifications,
  };

  /// Kembali ke beranda dan menutup semua layar di atasnya.
  static void goHome(BuildContext context) {
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  /// Membuka layar [route] di atas beranda (menutup layar lain).
  static void openFromHome(
    BuildContext context,
    String route, {
    Object? arguments,
  }) {
    Navigator.of(context)
        .pushNamedAndRemoveUntil(route, (r) => r.isFirst, arguments: arguments);
  }
}

/// Argumen untuk halaman login/daftar: rute tujuan setelah berhasil masuk.
class AuthArgs {
  const AuthArgs({this.redirectTo, this.redirectArgs});

  final String? redirectTo;
  final Object? redirectArgs;
}

/// Argumen detail edukasi: materi dan tab awal (0 Sejarah, 1 Filosofi,
/// 2 Foto/Video).
class EducationArgs {
  const EducationArgs(this.topicId, {this.initialTab = 0});

  final String topicId;
  final int initialTab;
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
      AppRoutes.rental => RentalVenueScreen(initialFacilityId: args as String?),
      AppRoutes.rentalSchedule => const RentalScheduleScreen(),
      AppRoutes.rentalForm => const RentalFormScreen(),
      AppRoutes.rentalDocuments => const RentalDocumentsScreen(),
      AppRoutes.rentalStatus => RentalStatusScreen(code: args! as String),
      AppRoutes.rentalRejected => RentalRejectedScreen(code: args! as String),
      AppRoutes.rentalPayment => RentalPaymentScreen(code: args! as String),
      AppRoutes.rentalReceipt => RentalReceiptScreen(code: args! as String),
      AppRoutes.gallery => const GalleryScreen(),
      AppRoutes.galleryDetail => GalleryDetailScreen(itemId: args! as String),
      AppRoutes.communities => const CommunityDirectoryScreen(),
      AppRoutes.communityDetail => CommunityDetailScreen(
        communityId: args! as String,
      ),
      AppRoutes.communityRegister => const CommunityRegisterScreen(),
      AppRoutes.education => const EducationScreen(),
      AppRoutes.educationDetail => EducationDetailScreen(
        args: args! as EducationArgs,
      ),
      AppRoutes.account => const AccountScreen(),
      AppRoutes.myTickets => const MyTicketsScreen(),
      AppRoutes.rentalHistory => const RentalHistoryScreen(),
      AppRoutes.editProfile => const EditProfileScreen(),
      AppRoutes.notifications => const NotificationsScreen(),
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
