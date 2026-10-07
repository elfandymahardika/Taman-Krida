import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/validators.dart';
import '../../data/models/ticket_order.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/form/labeled_text_field.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/checkout_header.dart';
import 'widgets/empty_cart_notice.dart';
import 'widgets/order_summary_card.dart';

/// Checkout langkah 1: isi data pemesan (node 1:681).
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

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_prefilled) return;
    _prefilled = true;
    // Isi otomatis dari data sebelumnya atau akun yang sedang login.
    final state = AppStateScope.read(context);
    final buyer = state.buyer;
    final user = state.currentUser;
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

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    AppStateScope.read(context).saveBuyer(
      BuyerInfo(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
      ),
    );
    Navigator.of(context).pushNamed(AppRoutes.checkoutPayment);
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);

    return TkbjScaffold(
      children: [
        const CheckoutHeader(
          step: 1,
          breadcrumb: 'Tiket / Pembayaran',
          title: 'Proses Pembayaran',
          subtitle:
              'Selesaikan pemesanan tiket pertunjukan Anda dengan mengisi data '
              'pemesan resmi di bawah ini.',
        ),
        ContentSection(
          child: state.isCartEmpty
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
                        lines: state.cartLines,
                        total: state.cartTotal,
                      ),
                      const SizedBox(height: 20),
                      AppButton(
                        label: 'Lanjutkan Pembayaran →',
                        fontSize: 13,
                        onPressed: _submit,
                      ),
                      const SizedBox(height: 10),
                      AppButton.outline(
                        label: '← Kembali ke Tiket',
                        fontSize: 13,
                        borderWidth: 1.5,
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}
