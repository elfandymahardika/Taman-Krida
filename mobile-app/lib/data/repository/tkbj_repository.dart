import '../models/app_notification.dart';
import '../models/community.dart';
import '../models/cultural_event.dart';
import '../models/facility.dart';
import '../models/gallery_item.dart';
import '../models/rental_request.dart';
import '../models/ticket_order.dart';
import '../models/user_account.dart';
import 'api_repository.dart';
import 'demo_repository.dart';

/// Pilihan & aturan dari server (GET /api/meta).
class AppMeta {
  const AppMeta({
    required this.today,
    required this.eventCategories,
    required this.communityCategories,
    required this.maxTicketsPerEvent,
    required this.payDeadlineHours,
    required this.bank,
    required this.account,
  });

  /// "Hari ini" versi server (data contoh memakai tanggal tetap).
  final DateTime today;

  /// Termasuk "Semua" di urutan pertama, untuk chip filter.
  final List<String> eventCategories;
  final List<String> communityCategories;
  final int maxTicketsPerEvent;
  final int payDeadlineHours;
  final String bank;
  final String account;
}

/// Ketersediaan slot per tanggal ("2026-10-02") untuk satu venue & bulan.
typedef Availability = Map<String, Map<RentalSlot, SlotState>>;

/// Sumber data aplikasi. [ApiRepository] memanggil backend/mobile-app;
/// [DemoRepository] memakai data contoh di memori (test & mode offline).
abstract class TkbjRepository {
  /// Repository sesuai cara menjalankan aplikasi:
  /// `--dart-define=DEMO_MODE=true` → data contoh tanpa server.
  factory TkbjRepository.fromEnvironment() =>
      const bool.fromEnvironment('DEMO_MODE')
      ? DemoRepository()
      : ApiRepository();

  /// Data publik.
  Future<AppMeta> meta();
  Future<List<CulturalEvent>> events();
  Future<List<Facility>> facilities();
  Future<List<Community>> communities();
  Future<List<GalleryItem>> gallery();
  Future<Availability> availability(Facility facility, DateTime month);

  /// Akun. [restoreSession] memakai token tersimpan dari login sebelumnya.
  Future<UserAccount?> restoreSession();
  Future<UserAccount> login(String email, String password);
  Future<UserAccount> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  });
  Future<void> logout();
  Future<UserAccount> updateProfile({
    required String name,
    required String email,
    required String phone,
    required String city,
  });

  /// Tiket: checkout membuat pesanan "Menunggu bayar"; bukti transfer
  /// membuatnya "Sedang diverifikasi" sampai admin menyatakan lunas.
  Future<List<TicketOrder>> bookings();
  Future<TicketOrder> checkout(List<CartLine> lines, BuyerInfo buyer);
  Future<TicketOrder> payBooking(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  );

  /// Sewa gedung.
  Future<List<RentalRequest>> rentals();
  Future<RentalRequest> submitRental(RentalDraft draft);
  Future<RentalRequest> payRental(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  );

  /// Komunitas.
  Future<CommunityRegistration> registerCommunity(
    CommunityRegistration registration,
  );
  Future<List<CommunityRegistration>> myCommunities();

  /// Notifikasi akun.
  Future<List<AppNotification>> notifications();
  Future<void> markNotificationRead(String id);
  Future<void> markAllNotificationsRead();
}
