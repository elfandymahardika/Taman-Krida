import '../../../domain/entities/rental_request.dart';
import '../../../domain/entities/ticket_order.dart';
import '../../models/json.dart';
import '../../models/ticket_order_model.dart';
import 'api_client.dart';

/// Sumber data pesanan tiket milik akun.
abstract interface class TicketRemoteDataSource {
  Future<List<TicketOrder>> bookings();
  Future<TicketOrder> checkout(List<CartLine> lines, BuyerInfo buyer);
  Future<TicketOrder> payBooking(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  );
}

class TicketRemoteDataSourceImpl implements TicketRemoteDataSource {
  TicketRemoteDataSourceImpl(this._api);

  final ApiClient _api;

  @override
  Future<List<TicketOrder>> bookings() async {
    final list = await _api.get('/tickets') as List;
    return list.cast<Json>().map(TicketOrderModel.fromJson).toList();
  }

  @override
  Future<TicketOrder> checkout(List<CartLine> lines, BuyerInfo buyer) async =>
      TicketOrderModel.fromJson(
        await _api.post(
          '/tickets/checkout',
          TicketOrderModel.checkoutJson(lines, buyer),
        ) as Json,
      );

  @override
  Future<TicketOrder> payBooking(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async => TicketOrderModel.fromJson(
    await _api.postMultipart(
      '/tickets/$code/payment',
      fields: {'method': method.shortLabel, 'sender': sender},
      files: {'file': proof},
    ) as Json,
  );
}
