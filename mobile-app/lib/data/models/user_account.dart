/// Akun pengunjung yang sedang masuk.
class UserAccount {
  const UserAccount({
    required this.name,
    required this.email,
    required this.phone,
    required this.memberSince,
    this.city = '',
  });

  final String name;
  final String email;
  final String phone;
  final int memberSince;
  final String city;

  UserAccount copyWith({
    String? name,
    String? email,
    String? phone,
    String? city,
  }) {
    return UserAccount(
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      memberSince: memberSince,
      city: city ?? this.city,
    );
  }
}
