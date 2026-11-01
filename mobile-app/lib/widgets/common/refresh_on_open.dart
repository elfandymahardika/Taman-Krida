import 'package:flutter/material.dart';

import '../../state/app_state.dart';

/// Memuat ulang data akun dari server saat layar dibuka, agar keputusan
/// admin terbaru (lunas, disetujui, ditolak) langsung terlihat.
class RefreshOnOpen extends StatefulWidget {
  const RefreshOnOpen({super.key, required this.child});

  final Widget child;

  @override
  State<RefreshOnOpen> createState() => _RefreshOnOpenState();
}

class _RefreshOnOpenState extends State<RefreshOnOpen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) AppStateScope.read(context).refreshAccount();
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
