import '../repositories/admin_simulation_repository.dart';

export '../repositories/admin_simulation_repository.dart' show AdminDecision;

/// Mode demo: meniru keputusan admin dashboard (setujui/tolak sewa,
/// nyatakan pembayaran lunas).
class SimulateAdminDecisionUseCase {
  const SimulateAdminDecisionUseCase(this._repository);

  final AdminSimulationRepository _repository;

  bool get isAvailable => _repository.isAvailable;

  Future<void> call(AdminDecision decision, String code) =>
      _repository.decide(decision, code);
}
