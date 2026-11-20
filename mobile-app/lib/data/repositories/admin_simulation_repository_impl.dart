import '../../domain/repositories/admin_simulation_repository.dart';
import '../datasources/demo/demo_data_source.dart';
import 'guard.dart';

/// Mode demo: keputusan admin diterapkan langsung ke [DemoDataSource].
class DemoAdminSimulationRepository implements AdminSimulationRepository {
  const DemoAdminSimulationRepository(this._demo);

  final DemoDataSource _demo;

  @override
  bool get isAvailable => true;

  @override
  Future<void> decide(AdminDecision decision, String code) => guard(() async {
    switch (decision) {
      case AdminDecision.approveRental:
        _demo.approveRental(code);
      case AdminDecision.rejectRental:
        _demo.rejectRental(code);
      case AdminDecision.confirmPayment:
        _demo.confirmPayment(code);
    }
  });
}

/// Mode API: keputusan diambil admin lewat dashboard, bukan dari aplikasi.
class UnavailableAdminSimulationRepository
    implements AdminSimulationRepository {
  const UnavailableAdminSimulationRepository();

  @override
  bool get isAvailable => false;

  @override
  Future<void> decide(AdminDecision decision, String code) async {}
}
