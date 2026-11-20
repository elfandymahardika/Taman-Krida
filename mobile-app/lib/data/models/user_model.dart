import '../../domain/entities/user_account.dart';
import 'json.dart';

/// Akun pengunjung dari API (`user` pada respons login/daftar/me).
class UserModel extends UserAccount {
  const UserModel({
    required super.name,
    required super.email,
    required super.phone,
    required super.memberSince,
    super.city,
  });

  factory UserModel.fromJson(Json json) => UserModel(
    name: json['name'] as String,
    email: json['email'] as String,
    phone: json['phone'] as String,
    city: json['city'] as String? ?? '',
    memberSince: json['memberSince'] as int,
  );
}

/// Hasil login/daftar: token sesi + akun.
class AuthSessionModel {
  const AuthSessionModel({required this.token, required this.user});

  factory AuthSessionModel.fromJson(Json json) => AuthSessionModel(
    token: json['token'] as String,
    user: UserModel.fromJson(json['user'] as Json),
  );

  final String token;
  final UserAccount user;
}
