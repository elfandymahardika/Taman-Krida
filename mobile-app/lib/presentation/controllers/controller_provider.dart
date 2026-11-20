import 'package:flutter/widgets.dart';

/// Menyediakan Controller [T] ke widget di bawahnya. Widget yang memanggil
/// `context.watch<T>()` di-rebuild saat Controller memanggil
/// `notifyListeners()`.
class ControllerProvider<T extends ChangeNotifier>
    extends InheritedNotifier<T> {
  const ControllerProvider({
    super.key,
    required T controller,
    required super.child,
  }) : super(notifier: controller);
}

extension ControllerContext on BuildContext {
  /// Controller [T] + berlangganan perubahannya (dipakai di `build`).
  T watch<T extends ChangeNotifier>() {
    final provider =
        dependOnInheritedWidgetOfExactType<ControllerProvider<T>>();
    assert(provider != null, 'ControllerProvider<$T> tidak ditemukan.');
    return provider!.notifier!;
  }

  /// Controller [T] tanpa berlangganan (dipakai di callback tombol).
  T read<T extends ChangeNotifier>() {
    final provider = getInheritedWidgetOfExactType<ControllerProvider<T>>();
    assert(provider != null, 'ControllerProvider<$T> tidak ditemukan.');
    return provider!.notifier!;
  }
}
