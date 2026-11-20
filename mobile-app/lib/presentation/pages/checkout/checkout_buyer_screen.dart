import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/validators.dart';
import '../../../domain/entities/ticket_order.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/form/labeled_text_field.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import '../../widgets/interactive/step_tracker.dart';
import 'widgets/empty_cart_notice.dart';
import 'widgets/order_summary_card.dart';

/// Checkout langkah 1: isi data pemesan (node 1:681).
///
/// Keranjang tiket gratis langsung dipesan dari sini (tanpa langkah
/// pembayaran) dan e-tiket terbit di layar Status Pesanan.
class CheckoutBuyerScreen extends StatefulWidget {
  const CheckoutBuyerScreen({super.key});

  @override
  State<CheckoutBuyerScreen> createState() => _CheckoutBuyerScreenState();
}

class _CheckoutBuyerScreenState extends State<CheckoutBuyerScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _prefilled = false;
  bool _busy = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_prefilled) return;
    _prefilled = true;
    // Isi otomatis dari data sebelumnya atau akun yang sedang login.
    final ticketController = context.read<TicketController>();
    final authController = context.read<AuthController>();
    final buyer = ticketController.buyer;
    final user = authController.currentUser;
    _nameController.text = buyer?.name ?? user?.name ?? '';
    _emailController.text = buyer?.email ?? user?.email ?? '';
    _phoneController.text = buyer?.phone ?? user?.phone ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final ticketController = context.read<TicketController>();
    ticketController.saveBuyer(
      BuyerInfo(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
      ),
    );
    if (!ticketController.isCartFree) {
      Navigator.of(context).pushNamed(AppRoutes.checkoutPayment);
      return;
    }
    // Tiket gratis: pesanan langsung lunas, lewati pembayaran.
    setState(() => _busy = true);
    try {
      final order = await ticketController.placeOrder();
      if (!mounted) return;
      Navigator.of(context).pushNamedAndRemoveUntil(
        AppRoutes.checkoutSuccess,
        (route) => route.isFirst,
        arguments: order.bookingCode,
      );
    } on Failure catch (e) {
      if (mounted) showAppToast(context, e.displayMessage);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticketController = context.watch<TicketController>();
    final free = ticketController.isCartFree;

    return TkbjScaffold(
      title: free ? 'Ambil Tiket Gratis' : 'Proses Pembayaran',
      subtitle: free
          ? 'Isi data pemesan. Tiket gratis tidak perlu dibayar: e-tiket '
                'langsung terbit setelah Anda menekan tombol di bawah.'
          : 'Selesaikan pemesanan tiket pertunjukan Anda dengan mengisi data '
                'pemesan resmi di bawah ini.',
      children: [
        if (!free) const StepTracker(current: 1),
        ContentSection(
          child: ticketController.isCartEmpty
              ? const EmptyCartNotice()
              : Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Isi Data Pemesan',
                        style: AppText.playfair(20, color: AppColors.maroon),
                      ),
                      const SizedBox(height: 20),
                      LabeledTextField(
                        label: 'Nama Lengkap',
                        controller: _nameController,
                        hint: 'Nama sesuai identitas',
                        keyboardType: TextInputType.name,
                        validator: (v) =>
                            Validators.name(v, fieldName: 'Nama lengkap'),
                      ),
                      const SizedBox(height: 14),
                      LabeledTextField(
                        label: 'Alamat Email',
                        controller: _emailController,
                        hint: 'E-tiket dikirim ke email ini',
                        keyboardType: TextInputType.emailAddress,
                        validator: Validators.email,
                      ),
                      const SizedBox(height: 14),
                      LabeledTextField(
                        label: 'No. Telepon / WhatsApp',
                        controller: _phoneController,
                        hint: 'Contoh: 081234567890',
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.done,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[0-9+]')),
                        ],
                        validator: Validators.phone,
                      ),
                      const SizedBox(height: 20),
                      OrderSummaryCard(
                        lines: ticketController.cartLines,
                        total: ticketController.cartTotal,
                      ),
                      const SizedBox(height: 20),
                      AppButton(
                        label: _busy
                            ? 'Memproses…'
                            : free
                            ? 'Ambil Tiket Gratis →'
                            : 'Lanjutkan Pembayaran →',
                        fontSize: 13,
                        onPressed: _busy ? null : _submit,
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}
