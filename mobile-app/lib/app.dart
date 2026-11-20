import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'injection.dart';
import 'presentation/routes/app_routes.dart';
import 'presentation/controllers/controllers.dart';
import 'presentation/pages/shell/main_shell.dart';

class TkbjApp extends StatefulWidget {
  const TkbjApp({super.key, this.container});

  /// Bisa diisi dari test (mode demo / Controller yang sudah disiapkan).
  final AppContainer? container;

  @override
  State<TkbjApp> createState() => _TkbjAppState();
}

class _TkbjAppState extends State<TkbjApp> {
  late final AppContainer _app =
      widget.container ?? AppContainer.fromEnvironment();
  late final AppRouter _router = AppRouter(_app.auth);
  final _tab = ValueNotifier(ShellTab.home);

  @override
  void initState() {
    super.initState();
    // Muat data dari server (atau data contoh) & pulihkan sesi login.
    _app.init();
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Widget child = ShellScope(
      controller: _tab,
      child: MaterialApp(
        title: 'TKBJ Mobile',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        initialRoute: AppRoutes.home,
        onGenerateRoute: _router.onGenerateRoute,
      ),
    );
    // Setiap Controller tersedia untuk semua Page di bawahnya.
    child = ControllerProvider(controller: _app.upload, child: child);
    child = ControllerProvider(controller: _app.education, child: child);
    child = ControllerProvider(controller: _app.admin, child: child);
    child = ControllerProvider(controller: _app.assistant, child: child);
    child = ControllerProvider(controller: _app.notification, child: child);
    child = ControllerProvider(controller: _app.community, child: child);
    child = ControllerProvider(controller: _app.rental, child: child);
    child = ControllerProvider(controller: _app.ticket, child: child);
    child = ControllerProvider(controller: _app.auth, child: child);
    return ControllerProvider(controller: _app.catalog, child: child);
  }
}
