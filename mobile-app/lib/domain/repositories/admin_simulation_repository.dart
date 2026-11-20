/// Keputusan admin dashboard yang bisa disimulasikan pada mode demo.
enum AdminDecision { approveRental, rejectRental, confirmPayment }

/// Kontrak simulasi keputusan admin. Hanya tersedia pada mode demo (tanpa
/// server); pada mode API keputusan diambil admin lewat dashboard.
abstract interface class AdminSimulationRepository {
  bool get isAvailable;

  /// [code] = kode sewa, atau kode booking tiket untuk [AdminDecision.confirmPayment].
  Future<void> decide(AdminDecision decision, String code);
}
