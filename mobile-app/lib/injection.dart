import 'data/datasources/demo/demo_data_source.dart';
import 'data/datasources/local/file_picker_data_source.dart';
import 'data/datasources/local/session_local_data_source.dart';
import 'data/datasources/remote/api_client.dart';
import 'data/datasources/remote/assistant_remote_data_source.dart';
import 'data/datasources/remote/auth_remote_data_source.dart';
import 'data/datasources/remote/catalog_remote_data_source.dart';
import 'data/datasources/remote/community_remote_data_source.dart';
import 'data/datasources/remote/culture_remote_data_source.dart';
import 'data/datasources/remote/facility_cache.dart';
import 'data/datasources/remote/notification_remote_data_source.dart';
import 'data/datasources/remote/rental_remote_data_source.dart';
import 'data/datasources/remote/ticket_remote_data_source.dart';
import 'data/repositories/admin_simulation_repository_impl.dart';
import 'data/repositories/assistant_repository_impl.dart';
import 'data/repositories/auth_repository_impl.dart';
import 'data/repositories/catalog_repository_impl.dart';
import 'data/repositories/community_repository_impl.dart';
import 'data/repositories/culture_repository_impl.dart';
import 'data/repositories/file_repository_impl.dart';
import 'data/repositories/notification_repository_impl.dart';
import 'data/repositories/rental_repository_impl.dart';
import 'data/repositories/ticket_repository_impl.dart';
import 'domain/repositories/admin_simulation_repository.dart';
import 'domain/usecases/admin_simulation_usecases.dart';
import 'domain/usecases/assistant_usecases.dart';
import 'domain/usecases/auth_usecases.dart';
import 'domain/usecases/catalog_usecases.dart';
import 'domain/usecases/community_usecases.dart';
import 'domain/usecases/culture_usecases.dart';
import 'domain/usecases/file_usecases.dart';
import 'domain/usecases/notification_usecases.dart';
import 'domain/usecases/rental_usecases.dart';
import 'domain/usecases/ticket_usecases.dart';
import 'presentation/controllers/controllers.dart';

/// Composition root (dependency injection): satu-satunya tempat yang
/// mengenal semua layer. Merakit
///
///   Data Source → Repository → Use Case → Controller
///
/// lalu Controller disediakan ke Page lewat `ControllerProvider` di `app.dart`.
class AppContainer {
  AppContainer._({
    required CatalogRemoteDataSource catalogSource,
    required AuthRemoteDataSource authSource,
    required TicketRemoteDataSource ticketSource,
    required RentalRemoteDataSource rentalSource,
    required CommunityRemoteDataSource communitySource,
    required CultureRemoteDataSource cultureSource,
    required NotificationRemoteDataSource notificationSource,
    required AssistantRemoteDataSource assistantSource,
    required SessionLocalDataSource sessionSource,
    required AdminSimulationRepository adminSimulation,
    FilePick? pickFile,
  }) {
    // Repository (layer data) — implementasi kontrak domain.
    final catalogRepo = CatalogRepositoryImpl(catalogSource);
    final authRepo = AuthRepositoryImpl(authSource, sessionSource);
    final ticketRepo = TicketRepositoryImpl(ticketSource);
    final rentalRepo = RentalRepositoryImpl(rentalSource);
    final communityRepo = CommunityRepositoryImpl(communitySource);
    final notificationRepo = NotificationRepositoryImpl(notificationSource);
    final assistantRepo = AssistantRepositoryImpl(assistantSource);
    final cultureRepo = CultureRepositoryImpl(cultureSource);
    final fileRepo = FileRepositoryImpl(
      FilePickerDataSourceImpl(pickFile ?? pickWithSystemPicker),
    );

    // Controller (layer presentation) — hanya mengenal use case (domain).
    catalog = CatalogController(
      getCatalog: GetCatalogUseCase(catalogRepo),
      getEvents: GetEventsUseCase(catalogRepo),
    );
    notification = NotificationController(
      getNotifications: GetNotificationsUseCase(notificationRepo),
      markRead: MarkNotificationReadUseCase(notificationRepo),
      markAllRead: MarkAllNotificationsReadUseCase(notificationRepo),
    );
    ticket = TicketController(
      getBookings: GetBookingsUseCase(ticketRepo),
      checkout: CheckoutUseCase(ticketRepo),
      payBooking: PayBookingUseCase(ticketRepo),
      catalog: catalog,
      notifications: notification,
    );
    rental = RentalController(
      getRentals: GetRentalsUseCase(rentalRepo),
      submitRental: SubmitRentalUseCase(rentalRepo),
      payRental: PayRentalUseCase(rentalRepo),
      getAvailability: GetAvailabilityUseCase(rentalRepo),
      catalog: catalog,
      notifications: notification,
      currentUser: () => auth.currentUser,
    );
    community = CommunityController(
      getMyCommunities: GetMyCommunitiesUseCase(communityRepo),
      registerCommunity: RegisterCommunityUseCase(communityRepo),
      notifications: notification,
    );
    auth = AuthController(
      restoreSession: RestoreSessionUseCase(authRepo),
      login: LoginUseCase(authRepo),
      register: RegisterUseCase(authRepo),
      updateProfile: UpdateProfileUseCase(authRepo),
      logout: LogoutUseCase(authRepo),
      notifications: notification,
      accountData: [ticket, rental, community],
    );
    admin = AdminSimulationController(
      simulate: SimulateAdminDecisionUseCase(adminSimulation),
      auth: auth,
    );
    assistant = AssistantController(
      askAssistant: AskAssistantUseCase(assistantRepo),
    );
    education = EducationController(
      getTopics: GetCultureTopicsUseCase(cultureRepo),
    );
    upload = UploadController(pickFile: PickFileUseCase(fileRepo));
  }

  /// Sesuai cara menjalankan aplikasi:
  /// `--dart-define=DEMO_MODE=true` → data contoh tanpa server.
  factory AppContainer.fromEnvironment() =>
      const bool.fromEnvironment('DEMO_MODE')
      ? AppContainer.demo()
      : AppContainer.api();

  /// Data dari API mobile (backend/mobile-app).
  factory AppContainer.api({ApiClient? client, FilePick? pickFile}) {
    final api = client ?? ApiClient();
    final facilities = FacilityCache();
    return AppContainer._(
      catalogSource: CatalogRemoteDataSourceImpl(api, facilities),
      authSource: AuthRemoteDataSourceImpl(api),
      ticketSource: TicketRemoteDataSourceImpl(api),
      rentalSource: RentalRemoteDataSourceImpl(api, facilities),
      communitySource: CommunityRemoteDataSourceImpl(api),
      cultureSource: CultureRemoteDataSourceImpl(api),
      notificationSource: NotificationRemoteDataSourceImpl(api),
      assistantSource: AssistantRemoteDataSourceImpl(api),
      sessionSource: SessionLocalDataSourceImpl(),
      adminSimulation: const UnavailableAdminSimulationRepository(),
      pickFile: pickFile,
    );
  }

  /// Data contoh di memori tanpa server (test & presentasi offline).
  factory AppContainer.demo({DemoDataSource? source, FilePick? pickFile}) {
    final demo = source ?? DemoDataSource();
    return AppContainer._(
      catalogSource: demo,
      authSource: demo,
      ticketSource: demo,
      rentalSource: demo,
      communitySource: demo,
      cultureSource: demo,
      notificationSource: demo,
      assistantSource: demo,
      sessionSource: InMemorySessionLocalDataSource(),
      adminSimulation: DemoAdminSimulationRepository(demo),
      pickFile: pickFile,
    );
  }

  late final CatalogController catalog;
  late final AuthController auth;
  late final TicketController ticket;
  late final RentalController rental;
  late final CommunityController community;
  late final NotificationController notification;
  late final AssistantController assistant;
  late final AdminSimulationController admin;
  late final EducationController education;
  late final UploadController upload;

  Future<void>? _init;

  /// Muat data publik (katalog & materi edukasi) lalu pulihkan sesi login.
  /// Aman dipanggil berulang.
  Future<void> init() => _init ??= () async {
    await Future.wait([catalog.load(), education.load()]);
    await auth.restoreSession();
  }();
}
