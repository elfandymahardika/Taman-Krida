import '../../domain/entities/ticket_order.dart';
import 'cultural_event_model.dart';
import 'json.dart';

/// Pesanan tiket (satu kode booking) dari /api/tickets.
class TicketOrderModel extends TicketOrder {
  const TicketOrderModel({
    required super.bookingCode,
    required super.buyer,
    required super.lines,
    required super.createdAt,
    super.status,
    super.method,
    super.paidAt,
    super.payBefore,
  });

  factory TicketOrderModel.fromJson(Json j) {
    final buyer = j['buyer'] as Json;
    return TicketOrderModel(
      bookingCode: j['code'] as String,
      buyer: BuyerInfo(
        name: buyer['name'] as String,
        email: buyer['email'] as String,
        phone: buyer['phone'] as String,
      ),
      lines: [
        for (final l in (j['lines'] as List).cast<Json>())
          CartLine(
            event: CulturalEventModel.fromTicketLine(l),
            quantity: l['qty'] as int,
            orderId: l['orderId'] as String,
            ticketCodes: (l['ticketCodes'] as List).cast(),
            note: l['note'] as String?,
          ),
      ],
      createdAt: parseDate(j['createdAt']),
      status: PaymentStatus.fromApi(j['payment'] as String?),
      method: PaymentMethod.fromLabel(j['method'] as String?),
      paidAt: parseDateOrNull(j['paidAt']),
      payBefore: parseDateOrNull(j['payBefore']),
    );
  }

  /// Body POST /api/tickets/checkout.
  static Json checkoutJson(List<CartLine> lines, BuyerInfo buyer) => {
    'items': [
      for (final line in lines)
        {'eventId': line.event.id, 'qty': line.quantity},
    ],
    'buyer': {'name': buyer.name, 'email': buyer.email, 'phone': buyer.phone},
  };
}
