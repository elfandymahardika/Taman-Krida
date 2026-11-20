import '../entities/user_account.dart';
import '../repositories/auth_repository.dart';

class RestoreSessionUseCase {
  const RestoreSessionUseCase(this._repository);

  final AuthRepository _repository;

  Future<UserAccount?> call() => _repository.restoreSession();
}

class LoginUseCase {
  const LoginUseCase(this._repository);

  final AuthRepository _repository;

  Future<UserAccount> call(String email, String password) =>
      _repository.login(email.trim(), password);
}

class RegisterUseCase {
  const RegisterUseCase(this._repository);

  final AuthRepository _repository;

  Future<UserAccount> call({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) => _repository.register(
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    password: password,
  );
}

class UpdateProfileUseCase {
  const UpdateProfileUseCase(this._repository);

  final AuthRepository _repository;

  Future<UserAccount> call({
    required String name,
    required String email,
    required String phone,
    required String city,
  }) => _repository.updateProfile(
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    city: city.trim(),
  );
}

class LogoutUseCase {
  const LogoutUseCase(this._repository);

  final AuthRepository _repository;

  Future<void> call() => _repository.logout();
}
