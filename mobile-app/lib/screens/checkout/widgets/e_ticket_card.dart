import 'package:flutter/material.dart';

import '../../../core/utils/formatters.dart';
import '../../../data/models/ticket_order.dart';
import '../../../widgets/common/receipt_card.dart';

/// Kartu "E-Tiket Resmi TKBJ" berisi data pesanan dan kode booking.
class ETicketCard extends StatelessWidget {
  const ETicketCard({super.key, required this.order});

  final TicketOrder order;

  @override
  Widget build(BuildContext context) {
    return ReceiptCard(
      title: 'E-Tiket Resmi TKBJ',
      rows: [
        ReceiptRow('Pemesan', order.buyer.name),
        ReceiptRow('Tanggal', Formatters.longDate(order.paidAt)),
        ReceiptRow('Item Pertunjukan', order.itemsSummary, stacked: true),
      ],
      codeLabel: 'Kode Booking E-Tiket Anda',
      code: order.bookingCode,
    );
  }
}
