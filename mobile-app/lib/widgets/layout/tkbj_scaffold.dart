import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import 'tkbj_footer.dart';
import 'tkbj_navbar.dart';

/// Kerangka halaman: navbar tetap di atas, isi + footer dapat di-scroll.
/// Semua isi berada di dalam scroll view sehingga tidak terjadi overflow
/// di ponsel kecil maupun saat orientasi landscape.
class TkbjScaffold extends StatelessWidget {
  const TkbjScaffold({
    super.key,
    required this.children,
    this.showFooter = true,
    this.navbarTrailing,
  });

  final List<Widget> children;
  final bool showFooter;
  final Widget? navbarTrailing;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
      ),
      child: Scaffold(
        backgroundColor: AppColors.cream,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              TkbjNavbar(trailing: navbarTrailing),
              Expanded(
                child: SingleChildScrollView(
                  keyboardDismissBehavior:
                      ScrollViewKeyboardDismissBehavior.onDrag,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      ...children,
                      if (showFooter)
                        const TkbjFooter()
                      else
                        SizedBox(height: MediaQuery.paddingOf(context).bottom),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
