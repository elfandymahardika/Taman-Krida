import 'package:flutter/foundation.dart';

import '../../domain/usecases/admin_simulation_usecases.dart';
import 'auth_controller.dart';

/// Mode demo: tombol simulasi keputusan admin dashboard.
class AdminSimulationController extends ChangeNotifier {
  AdminSimulationController({required this._simulate, required this._auth});

  final SimulateAdminDecisionUseCase _simulate;
  final AuthController _auth;

  /// `true` hanya pada mode demo (tanpa server).
  bool get isAvailable => _simulate.isAvailable;

  Future<void> approveRental(String code) =>
      _decide(AdminDecision.approveRental, code);

  Future<void> rejectRental(String code) =>
      _decide(AdminDecision.rejectRental, code);

  /// Kode sewa atau kode booking tiket dinyatakan lunas.
  Future<void> confirmPayment(String code) =>
      _decide(AdminDecision.confirmPayment, code);

  Future<void> _decide(AdminDecision decision, String code) async {
    if (!isAvailable) return;
    await _simulate(decision, code);
    // Keputusan admin terbawa ke tiket, sewa, dan notifikasi akun.
    await _auth.refreshAccount();
  }
}
