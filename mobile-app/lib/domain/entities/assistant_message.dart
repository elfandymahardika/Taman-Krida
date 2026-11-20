/// Jenis tombol di bawah jawaban Tanya Krida. Sama dengan LINK_KINDS di
/// backend/mobile-app (src/lib/assistantTools.ts).
enum AssistantLinkKind {
  event('acara'),
  rental('sewa'),
  community('komunitas'),
  calendar('kalender'),
  myTickets('tiket_saya'),
  gallery('galeri'),
  education('edukasi'),
  profile('profil');

  const AssistantLinkKind(this.apiName);

  final String apiName;

  static AssistantLinkKind? fromApi(String? name) {
    for (final kind in values) {
      if (kind.apiName == name) return kind;
    }
    return null;
  }
}

/// Tombol pintasan ke layar aplikasi yang disarankan asisten.
class AssistantLink {
  const AssistantLink({required this.kind, required this.label, this.id});

  final AssistantLinkKind kind;
  final String label;

  /// Id acara / komunitas / venue (kosong untuk layar umum).
  final String? id;
}

/// Siapa pengirim pesan di percakapan.
enum ChatRole { user, assistant }

/// Satu gelembung percakapan Tanya Krida.
class AssistantMessage {
  const AssistantMessage({
    required this.role,
    required this.text,
    this.links = const [],
    this.suggestions = const [],
    this.isError = false,
  });

  const AssistantMessage.user(this.text)
    : role = ChatRole.user,
      links = const [],
      suggestions = const [],
      isError = false;

  final ChatRole role;
  final String text;
  final List<AssistantLink> links;

  /// Pertanyaan lanjutan yang bisa langsung diketuk.
  final List<String> suggestions;

  /// Pesan gagal (server/AI tidak bisa dihubungi): tidak dikirim ulang
  /// sebagai riwayat dan bisa dicoba lagi.
  final bool isError;

  bool get isUser => role == ChatRole.user;
}
