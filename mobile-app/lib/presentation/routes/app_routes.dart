import 'package:flutter/material.dart';

import '../pages/account/account_screen.dart';
import '../pages/account/edit_profile_screen.dart';
import '../pages/account/my_tickets_screen.dart';
import '../pages/account/notifications_screen.dart';
import '../pages/account/rental_history_screen.dart';
import '../pages/assistant/assistant_screen.dart';
import '../pages/auth/login_screen.dart';
import '../pages/auth/register_screen.dart';
import '../pages/checkout/checkout_buyer_screen.dart';
import '../pages/checkout/checkout_confirm_screen.dart';
import '../pages/checkout/checkout_payment_screen.dart';
import '../pages/checkout/checkout_success_screen.dart';
import '../pages/community/community_detail_screen.dart';
import '../pages/community/community_directory_screen.dart';
import '../pages/community/community_register_screen.dart';
import '../pages/education/education_detail_screen.dart';
import '../pages/education/education_screen.dart';
import '../pages/education/video_player_screen.dart';
import '../pages/home/news_detail_screen.dart';
import '../widgets/common/open_external.dart';
import '../pages/events/event_calendar_screen.dart';
import '../pages/events/event_detail_screen.dart';
import '../pages/gallery/gallery_detail_screen.dart';
import '../pages/gallery/gallery_screen.dart';
import '../pages/menu/menu_screen.dart';
import '../pages/profile/profile_map_screen.dart';
import '../pages/rental/rental_documents_screen.dart';
import '../pages/rental/rental_form_screen.dart';
import '../pages/rental/rental_payment_screen.dart';
import '../pages/rental/rental_receipt_screen.dart';
import '../pages/rental/rental_rejected_screen.dart';
import '../pages/rental/rental_schedule_screen.dart';
import '../pages/rental/rental_status_screen.dart';
import '../pages/rental/rental_venue_screen.dart';
import '../pages/shell/main_shell.dart';
import '../pages/tickets/ticket_list_screen.dart';
import '../controllers/auth_controller.dart';

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
  static const videoPlayer = '/edukasi/video';
  static const newsDetail = '/kabar';

  /// Tanya Krida (asisten AI), terbuka tanpa login.
  static const assistant = '/tanya-krida';

  static const account = '/akun';
  static const myTickets = '/akun/tiket';
  static const rentalHistory = '/akun/riwayat-sewa';
  static const editProfile = '/akun/edit-profil';
  static const notifications = '/akun/notifikasi';

  /// Rute yang hanya bisa dibuka setelah login (data milik akun, atau aksi
  /// yang dikirim ke server atas nama akun).
  static const _protected = {
    checkoutBuyer,
    checkoutPayment,
    checkoutConfirm,
    checkoutSuccess,
    rentalForm,
    rentalDocuments,
    rentalStatus,
    rentalRejected,
    rentalPayment,
    rentalReceipt,
    communityRegister,
    account,
    myTickets,
    rentalHistory,
    editProfile,
    notifications,
  };

  /// Rute yang punya tab sendiri di bottom navigation.
  static const _tabs = {
    home: ShellTab.home,
    calendar: ShellTab.events,
    tickets: ShellTab.tickets,
    menu: ShellTab.explore,
    account: ShellTab.account,
  };

  /// Kembali ke tab Beranda dan menutup semua layar di atasnya.
  static void goHome(BuildContext context) => openTab(context, ShellTab.home);

  /// Pindah ke [tab] dan menutup semua layar di atas beranda.
  static void openTab(BuildContext context, ShellTab tab) {
    ShellScope.read(context)?.value = tab;
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  /// Membuka [route]: pindah tab bila rute itu punya tab, selain itu
  /// didorong di atas layar sekarang.
  static void open(BuildContext context, String route, {Object? arguments}) {
    final tab = _tabs[route];
    if (tab != null && arguments == null) {
      openTab(context, tab);
    } else {
      Navigator.of(context).pushNamed(route, arguments: arguments);
    }
  }

  /// Tautan dari konten dashboard: "https://…" dibuka di browser, "/…"
  /// diarahkan ke layar aplikasi yang sepadan (mis. "/agenda" → Kalender).
  /// Mengembalikan false bila tautan tidak dikenali.
  static bool openLink(BuildContext context, String link) {
    if (link.startsWith('https://') || link.startsWith('http://')) {
      openExternal(context, link);
      return true;
    }
    final first = link.split('?').first.split('/').where((p) => p.isNotEmpty);
    final route = switch (first.isEmpty ? '' : first.first) {
      '' => home,
      'agenda' || 'acara' || 'kalender' => calendar,
      'tiket' => tickets,
      'sewa' || 'sewa-gedung' => rental,
      'galeri' => gallery,
      'komunitas' => communities,
      'edukasi' => education,
      'profil' || 'profil-denah' || 'denah' => profile,
      'tanya-krida' => assistant,
      _ => null,
    };
    if (route == null) return false;
    open(context, route);
    return true;
  }

  /// Setelah masuk/daftar: lanjut ke rute tujuan, atau ke tab Akun.
  static void afterSignIn(BuildContext context, AuthArgs? args) {
    final redirectTo = args?.redirectTo;
    if (redirectTo == null) {
      openTab(context, ShellTab.account);
    } else {
      Navigator.of(context)
          .pushReplacementNamed(redirectTo, arguments: args?.redirectArgs);
    }
  }

  /// Membuka layar [route] di atas beranda (menutup layar lain).
  static void openFromHome(
    BuildContext context,
    String route, {
    Object? arguments,
  }) {
    final tab = _tabs[route];
    if (tab != null && arguments == null) {
      openTab(context, tab);
      return;
    }
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
  AppRouter(this.auth);

  /// Rute akun dialihkan ke halaman Masuk bila belum login.
  final AuthController auth;

  Route<dynamic> onGenerateRoute(RouteSettings settings) {
    final name = settings.name ?? AppRoutes.home;

    if (AppRoutes._protected.contains(name) && !auth.isLoggedIn) {
      return _page(
        LoginScreen(
          args: AuthArgs(redirectTo: name, redirectArgs: settings.arguments),
        ),
        RouteSettings(name: AppRoutes.login, arguments: settings.arguments),
      );
    }

    final args = settings.arguments;
    final Widget screen = switch (name) {
      AppRoutes.home => const MainShell(),
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
      AppRoutes.videoPlayer => VideoPlayerScreen(args: args! as VideoArgs),
      AppRoutes.newsDetail => NewsDetailScreen(newsId: args! as String),
      AppRoutes.assistant => const AssistantScreen(),
      AppRoutes.account => const AccountScreen(),
      AppRoutes.myTickets => const MyTicketsScreen(),
      AppRoutes.rentalHistory => const RentalHistoryScreen(),
      AppRoutes.editProfile => const EditProfileScreen(),
      AppRoutes.notifications => const NotificationsScreen(),
      _ => const MainShell(),
    };

    return _page(screen, settings);
  }

  Route<dynamic> _page(Widget screen, RouteSettings settings) {
    return MaterialPageRoute(builder: (_) => screen, settings: settings);
  }
}
