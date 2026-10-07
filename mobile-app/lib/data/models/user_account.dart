/// Akun pengunjung (simulasi, tanpa backend).
class UserAccount {
  const UserAccount({
    required this.name,
    required this.email,
    required this.phone,
    required this.password,
    required this.memberSince,
    this.savedEvents = 0,
  });

  final String name;
  final String email;
  final String phone;
  final String password;
  final int memberSince;
  final int savedEvents;

  UserAccount copyWith({String? name, String? email, String? phone}) {
    return UserAccount(
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      password: password,
      memberSince: memberSince,
      savedEvents: savedEvents,
    );
  }
}
