import '../../domain/entities/rental_request.dart';
import '../../domain/entities/ticket_order.dart';
import '../../domain/repositories/ticket_repository.dart';
import '../datasources/remote/ticket_remote_data_source.dart';
import 'guard.dart';

class TicketRepositoryImpl implements TicketRepository {
  const TicketRepositoryImpl(this._remote);

  final TicketRemoteDataSource _remote;

  @override
  Future<List<TicketOrder>> getBookings() => guard(_remote.bookings);

  @override
  Future<TicketOrder> checkout(List<CartLine> lines, BuyerInfo buyer) =>
      guard(() => _remote.checkout(lines, buyer));

  @override
  Future<TicketOrder> payBooking(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) => guard(() => _remote.payBooking(code, method, proof, sender));
}
