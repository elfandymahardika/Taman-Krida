import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'routes/app_routes.dart';
import 'state/app_state.dart';

class TkbjApp extends StatefulWidget {
  const TkbjApp({super.key, this.state});

  /// Bisa diisi dari test agar state dapat diperiksa.
  final AppState? state;

  @override
  State<TkbjApp> createState() => _TkbjAppState();
}

class _TkbjAppState extends State<TkbjApp> {
  late final AppState _state = widget.state ?? AppState();
  late final AppRouter _router = AppRouter(_state);

  @override
  Widget build(BuildContext context) {
    return AppStateScope(
      state: _state,
      child: MaterialApp(
        title: 'TKBJ Mobile',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        initialRoute: AppRoutes.home,
        onGenerateRoute: _router.onGenerateRoute,
      ),
    );
  }
}
