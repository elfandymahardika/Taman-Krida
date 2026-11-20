import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/breakpoints.dart';
import '../../controllers/controllers.dart';
import '../common/app_feedback.dart';

/// Kerangka layar ala aplikasi mobile: app bar maroon yang menempel di atas
/// (tombol kembali bila bisa kembali), header berjudul besar yang ikut
/// tergulir, isi halaman, dan tarik-untuk-segarkan. Judul pindah ke app bar
/// setelah header tergulir keluar.
class TkbjScaffold extends StatefulWidget {
  const TkbjScaffold({
    super.key,
    required this.children,
    this.title,
    this.subtitle,
    this.header,
    this.toolbarTitle,
    this.headerGradient = AppGradients.pageHeader,
    this.actions = const [],
    this.bottomBar,
    this.onRefresh,
  });

  final List<Widget> children;

  /// Judul layar: besar di header, lalu kecil di app bar saat digulir.
  final String? title;
  final String? subtitle;

  /// Isi header kustom (mis. sapaan di beranda) pengganti judul + subjudul.
  final Widget? header;

  /// Judul app bar yang selalu tampil (mis. logo di beranda).
  final Widget? toolbarTitle;
  final Gradient headerGradient;
  final List<Widget> actions;

  /// Area aksi yang menempel di bawah layar (mis. total + tombol lanjut).
  final Widget? bottomBar;

  /// Tarik untuk segarkan. Bawaan: muat ulang data publik & data akun.
  final Future<void> Function()? onRefresh;

  @override
  State<TkbjScaffold> createState() => _TkbjScaffoldState();
}

class _TkbjScaffoldState extends State<TkbjScaffold> {
  /// Jarak gulir saat judul besar dianggap sudah tertutup app bar.
  static const _collapseOffset = 40.0;

  bool _collapsed = false;

  bool get _hasHeader => widget.header != null || widget.title != null;

  bool _onScroll(ScrollNotification notification) {
    if (notification.depth == 0 && notification.metrics.axis == Axis.vertical) {
      final collapsed = notification.metrics.pixels > _collapseOffset;
      if (collapsed != _collapsed) setState(() => _collapsed = collapsed);
    }
    return false;
  }

  Future<void> _refresh() async {
    final onRefresh = widget.onRefresh;
    if (onRefresh != null) return onRefresh();
    // Tarik untuk segarkan: data publik lalu data milik akun.
    final catalogController = context.read<CatalogController>();
    final authController = context.read<AuthController>();
    final error = await catalogController.refresh();
    if (error == null) await authController.refreshAccount();
    if (error != null && mounted) showAppToast(context, error);
  }

  @override
  Widget build(BuildContext context) {
    final canPop = ModalRoute.of(context)?.canPop ?? false;
    final padding = MediaQuery.paddingOf(context);
    final title = widget.title;
    final showToolbarTitle = _collapsed || !_hasHeader;

    return Scaffold(
      backgroundColor: AppColors.cream,
      body: NotificationListener<ScrollNotification>(
        onNotification: _onScroll,
        child: RefreshIndicator(
          onRefresh: _refresh,
          color: AppColors.maroon,
          edgeOffset: kToolbarHeight + padding.top,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            slivers: [
              SliverAppBar(
                pinned: true,
                automaticallyImplyLeading: false,
                leading: canPop
                    ? IconButton(
                        tooltip: 'Kembali',
                        icon: const Icon(Icons.arrow_back_ios_new_rounded),
                        iconSize: 20,
                        onPressed: () => Navigator.of(context).maybePop(),
                      )
                    : null,
                titleSpacing: canPop ? 0 : 20,
                title:
                    widget.toolbarTitle ??
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: showToolbarTitle && title != null
                          ? Text(
                              title,
                              key: const ValueKey('toolbar-title'),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.poppins(
                                16,
                                weight: FontWeight.w600,
                                color: AppColors.white,
                              ),
                            )
                          : const SizedBox.shrink(),
                    ),
                actions: [...widget.actions, const SizedBox(width: 8)],
                backgroundColor: AppColors.maroon,
                foregroundColor: AppColors.white,
                surfaceTintColor: Colors.transparent,
                elevation: 0,
                scrolledUnderElevation: 3,
                shadowColor: AppColors.maroonDark,
                flexibleSpace: DecoratedBox(
                  decoration: BoxDecoration(gradient: widget.headerGradient),
                  child: const SizedBox.expand(),
                ),
                systemOverlayStyle: SystemUiOverlayStyle.light.copyWith(
                  statusBarColor: Colors.transparent,
                ),
              ),
              if (_hasHeader)
                SliverToBoxAdapter(
                  child: _LargeHeader(
                    gradient: widget.headerGradient,
                    child:
                        widget.header ??
                        _TitleBlock(title: title!, subtitle: widget.subtitle),
                  ),
                ),
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: widget.children,
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 24 + (widget.bottomBar == null ? padding.bottom : 0),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: widget.bottomBar == null
          ? null
          : _StickyBottomBar(child: widget.bottomBar!),
    );
  }
}

/// Lanjutan app bar bergradien dengan sudut bawah membulat.
class _LargeHeader extends StatelessWidget {
  const _LargeHeader({required this.gradient, required this.child});

  final Gradient gradient;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            maxWidth: Breakpoints.maxContentWidth,
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            child: child,
          ),
        ),
      ),
    );
  }
}

class _TitleBlock extends StatelessWidget {
  const _TitleBlock({required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppText.playfair(26, color: AppColors.white)),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: AppText.poppins(13, color: AppColors.blush, height: 1.5),
          ),
        ],
      ],
    );
  }
}

/// Panel putih yang menempel di bawah layar berisi aksi utama.
class _StickyBottomBar extends StatelessWidget {
  const _StickyBottomBar({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: AppColors.navShadow,
            offset: Offset(0, -4),
            blurRadius: 16,
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        minimum: const EdgeInsets.fromLTRB(16, 14, 16, 14),
        child: Align(
          heightFactor: 1,
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              maxWidth: Breakpoints.maxContentWidth,
            ),
            // Tinggi panel mengikuti isinya, bukan seluruh layar.
            child: IntrinsicHeight(child: child),
          ),
        ),
      ),
    );
  }
}
