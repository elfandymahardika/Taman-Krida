import '../../domain/entities/app_meta.dart';
import '../../domain/entities/facility.dart';
import '../../domain/entities/rental_request.dart';
import '../../domain/entities/ticket_order.dart';
import '../../domain/repositories/rental_repository.dart';
import '../datasources/remote/rental_remote_data_source.dart';
import 'guard.dart';

class RentalRepositoryImpl implements RentalRepository {
  const RentalRepositoryImpl(this._remote);

  final RentalRemoteDataSource _remote;

  @override
  Future<Availability> getAvailability(Facility facility, DateTime month) =>
      guard(() => _remote.availability(facility, month));

  @override
  Future<List<RentalRequest>> getRentals() => guard(_remote.rentals);

  @override
  Future<RentalRequest> submitRental(RentalDraft draft) =>
      guard(() => _remote.submitRental(draft));

  @override
  Future<RentalRequest> payRental(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) => guard(() => _remote.payRental(code, method, proof, sender));
}
