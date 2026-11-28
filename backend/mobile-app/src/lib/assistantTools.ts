import { config } from '../config/env';
import { monthAvailability } from '../controllers/rentalController';
import { getSettings, maxTickets, payDeadlineHours, readKv } from '../models/adminModel';
import { findActiveCommunity, listActiveCommunities, toCommunity } from '../models/communityModel';
import { findPublishedEvent, listPublishedEvents, toEvent } from '../models/eventModel';
import { findFacilityById, listFacilities, listPublishedContents, rentalRateOf, toFacility } from '../models/infoModel';
import { CultureTopic, findPublishedCultureTopic, listPublishedCultureTopics, toCultureTopic } from '../models/cultureModel';
import { CULTURE_ENTRIES, CultureEntry, findCulture } from './cultureKnowledge';
import { COMMUNITY_CATEGORIES, EVENT_CATEGORIES, PAYMENT_METHODS, RENTAL_DOCUMENTS, RENTAL_SLOTS } from './catalog';
import { rupiah } from './format';
import { likePattern, where } from './http';
import { isDate } from './validate';

/*
 * Alat (tools) yang boleh dipakai asisten Tanya Krida. Semuanya HANYA MEMBACA data publik yang sama dengan
 * yang tampil di aplikasi (acara terpublikasi, fasilitas, komunitas aktif, pengaturan tiket). Tidak ada alat
 * yang membaca data akun atau mengubah database, jadi jawaban AI tidak bisa membocorkan atau merusak data.
 * Input dari model tetap divalidasi di sini sebelum dipakai di query.
 */

type Input = Record<string, unknown>;
/** Definisi alat untuk function calling Gemini: parameter berupa JSON Schema. */
export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}
type Tool = { definition: ToolSpec; run: (input: Input) => Promise<unknown> };

const textOf = (v: unknown, max = 60) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const dateOf = (v: unknown) => {
  const s = textOf(v, 10);
  return isDate(s) ? s : '';
};

/** Acara dalam bentuk ringkas untuk dibaca model (tanpa URL foto dsb.). */
const eventSummary = (e: ReturnType<typeof toEvent>) => ({
  id: e.id,
  nama: e.name,
  kategori: e.category,
  tanggal: e.date,
  jam: `${e.start}–${e.end} WIB`,
  lokasi: e.venue,
  penyelenggara: e.organizer,
  tiket: !e.ticketed
    ? 'Gratis, tanpa tiket (datang langsung)'
    : e.price === 0
      ? { harga: 'Gratis, ambil tiket di aplikasi (kuota terbatas, tanpa pembayaran)', sisa_kursi: e.remaining }
      : { harga: rupiah(e.price), sisa_kursi: e.remaining },
});

const cariAcara: Tool = {
  definition: {
    name: 'cari_acara',
    description:
      'Cari acara/pertunjukan terpublikasi di TKBJ. Pakai untuk pertanyaan jadwal, harga tiket, sisa kursi, atau ' +
      'acara kategori tertentu. Tanpa filter tanggal, hasilnya acara mulai hari ini. Maksimal 15 acara.',
    parameters: {
      type: 'object',
      properties: {
        dari: { type: 'string', description: 'Tanggal awal YYYY-MM-DD (opsional, bawaan hari ini).' },
        sampai: { type: 'string', description: 'Tanggal akhir YYYY-MM-DD (opsional).' },
        kategori: { type: 'string', enum: EVENT_CATEGORIES, description: 'Kategori acara (opsional).' },
        kata_kunci: { type: 'string', description: 'Kata dalam nama acara, penyelenggara, atau lokasi (opsional).' },
      },
      additionalProperties: false,
    },
  },
  run: async (input) => {
    const from = dateOf(input.dari) || config.today;
    const to = dateOf(input.sampai);
    const q = textOf(input.kata_kunci);
    const category = textOf(input.kategori);
    const pattern = likePattern(q);
    const filter = where([
      ['e.date >= ?', from],
      to && ['e.date <= ?', to],
      q && ['(e.name LIKE ? OR e.organizer LIKE ? OR e.venue LIKE ?)', pattern, pattern, pattern],
    ]);
    const rows = await listPublishedEvents(filter, payDeadlineHours(await getSettings()), 60);
    const events = rows.map(toEvent).filter((e) => !category || e.category === category);
    return { hari_ini: config.today, jumlah: events.length, acara: events.slice(0, 15).map(eventSummary) };
  },
};

const infoFasilitas: Tool = {
  definition: {
    name: 'info_fasilitas',
    description:
      'Daftar fasilitas/venue TKBJ: id, kapasitas, kegunaan, apakah bisa disewa, dan tarif sewa per pemakaian.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  run: async () => ({
    fasilitas: (await listFacilities()).map(toFacility).map((f) => ({
      id: f.id,
      nama: f.name,
      kapasitas: f.capacity ?? 'tidak ditentukan',
      kegunaan: f.purpose,
      bisa_disewa: f.rentable,
      tarif_sewa: f.rentalRate ? `${rupiah(f.rentalRate)} per pemakaian (satu slot)` : undefined,
    })),
  }),
};

const cekJadwalSewa: Tool = {
  definition: {
    name: 'cek_jadwal_sewa',
    description:
      'Cek ketersediaan slot sewa satu venue. Isi `tanggal` untuk satu hari, atau `bulan` (YYYY-MM) untuk daftar ' +
      'tanggal yang masih punya slot kosong. Slot: Pagi 08.00–12.00, Siang 13.00–17.00, Malam 18.00–22.00. ' +
      'Ambil id venue dari info_fasilitas.',
    parameters: {
      type: 'object',
      properties: {
        fasilitas_id: { type: 'string', description: 'Id venue, mis. "pendopo".' },
        tanggal: { type: 'string', description: 'YYYY-MM-DD (opsional).' },
        bulan: { type: 'string', description: 'YYYY-MM (opsional, bawaan bulan ini).' },
      },
      required: ['fasilitas_id'],
      additionalProperties: false,
    },
  },
  run: async (input) => {
    const facility = await findFacilityById(textOf(input.fasilitas_id, 40));
    if (!facility || rentalRateOf(facility) === null) return { error: 'Venue tidak ditemukan atau tidak bisa disewa. Cek id di info_fasilitas.' };
    const date = dateOf(input.tanggal);
    const month = date ? date.slice(0, 7) : /^\d{4}-(0[1-9]|1[0-2])$/.test(textOf(input.bulan, 7)) ? textOf(input.bulan, 7) : config.today.slice(0, 7);
    const days = await monthAvailability(facility.name, Number(month.slice(0, 4)), Number(month.slice(5, 7)));
    const label = (key: string) => RENTAL_SLOTS.find((s) => s.key === key)!.label;
    const describe = (slots: Record<string, string>) =>
      Object.fromEntries(Object.entries(slots).map(([k, v]) => [label(k), { available: 'kosong', full: 'terisi', past: 'sudah lewat' }[v]]));

    if (date) {
      const day = days.find((d) => d.date === date)!;
      return { venue: facility.name, tanggal: date, slot: describe(day.slots) };
    }
    const open = days.filter((d) => d.available);
    return {
      venue: facility.name,
      bulan: month,
      hari_ini: config.today,
      tanggal_dengan_slot_kosong: open.map((d) => ({
        tanggal: d.date,
        slot_kosong: Object.entries(d.slots).filter(([, v]) => v === 'available').map(([k]) => label(k)),
      })),
    };
  },
};

const cariKomunitas: Tool = {
  definition: {
    name: 'cari_komunitas',
    description: 'Cari komunitas/sanggar seni aktif di direktori TKBJ, bisa difilter kategori atau kata kunci.',
    parameters: {
      type: 'object',
      properties: {
        kategori: { type: 'string', enum: COMMUNITY_CATEGORIES, description: 'Kategori (opsional).' },
        kata_kunci: { type: 'string', description: 'Kata dalam nama atau kota komunitas (opsional).' },
      },
      additionalProperties: false,
    },
  },
  run: async (input) => {
    const category = textOf(input.kategori);
    const q = textOf(input.kata_kunci);
    const pattern = likePattern(q);
    const rows = await listActiveCommunities(
      where([category && ['category = ?', category], q && ['(name LIKE ? OR city LIKE ?)', pattern, pattern]]),
    );
    return {
      jumlah: rows.length,
      komunitas: rows.slice(0, 15).map(toCommunity).map((c) => ({
        id: c.id,
        nama: c.name,
        kategori: c.category,
        kota: c.city,
        anggota: c.members,
        ketua: c.leader,
        berdiri: c.since,
      })),
    };
  },
};

const infoLayanan: Tool = {
  definition: {
    name: 'info_layanan',
    description:
      'Profil & kontak TKBJ (alamat, jam buka, telepon) serta aturan layanan: cara pesan tiket, batas tiket, ' +
      'batas waktu bayar, kebijakan pembatalan, metode bayar, alur & berkas sewa gedung, dan 3 berita/pengumuman terbaru.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  run: async () => {
    const [settings, profile, news] = await Promise.all([getSettings(), readKv<Record<string, string>>('profile'), listPublishedContents('', 10)]);
    return {
      profil: profile ?? {},
      tiket: {
        alur: 'Pilih acara → tambah ke keranjang → isi data pemesan → bayar → unggah bukti transfer → admin memverifikasi → e-tiket aktif di menu Tiket Saya.',
        maksimal_per_acara: Math.min(maxTickets(settings), 4),
        batas_bayar_jam: payDeadlineHours(settings),
        pembatalan: settings.cancelPolicy,
        metode_bayar: PAYMENT_METHODS,
        rekening: `${settings.bank} ${settings.account}`,
      },
      sewa_gedung: {
        alur: 'Pilih venue → pilih tanggal & slot → isi formulir kegiatan → unggah 3 berkas → admin meninjau → bila disetujui bayar tagihan → bukti reservasi terbit.',
        berkas_wajib: RENTAL_DOCUMENTS.map((d) => d.label),
        slot: RENTAL_SLOTS.map((s) => `${s.label} ${s.start}–${s.end}`),
        catatan: 'Tarif per pemakaian, ditagihkan setelah admin menyetujui. Pengajuan paling lambat 1 tahun ke depan.',
      },
      komunitas: 'Komunitas bisa mendaftar lewat menu Direktori Komunitas → Daftarkan Komunitas (perlu login), lalu ditinjau admin.',
      berita_terbaru: news
        .filter((c) => c.type !== 'Banner beranda')
        .slice(0, 3)
        .map((c) => ({ judul: c.title, jenis: c.type, ringkasan: c.summary })),
    };
  },
};

/** Materi dashboard → bentuk entri pengetahuan (linimasa & makna jadi kalimat). */
const topicFields = (t: CultureTopic) => {
  const topic = toCultureTopic(t);
  return {
    judul: topic.title,
    ringkasan: topic.headline,
    sejarah: topic.history,
    linimasa: topic.timeline.map((p) => `${p.label}: ${p.text}`),
    makna: topic.philosophy.map((p) => `${p.title}: ${p.text}`),
  };
};

/**
 * Basis pengetahuan budaya terkini: entri statis (cultureKnowledge.ts) yang isinya ditimpa materi Edukasi
 * terpublikasi dari database, ditambah materi dashboard yang belum punya entri statis. Entri yang materinya
 * belum/tidak lagi terbit tetap dipakai sebagai pengetahuan, tetapi tanpa `idMateri` (tanpa tombol "Baca materi").
 */
export async function cultureEntries(): Promise<CultureEntry[]> {
  const topics = await listPublishedCultureTopics();
  const byId = new Map(topics.map((t) => [t.id, t]));
  const known = CULTURE_ENTRIES.map((e) => {
    const topic = e.idMateri ? byId.get(e.idMateri) : undefined;
    return topic ? { ...e, ...topicFields(topic) } : { ...e, idMateri: undefined };
  });
  const extra = topics
    .filter((t) => !CULTURE_ENTRIES.some((e) => e.idMateri === t.id))
    .map((t) => ({ id: t.id, idMateri: t.id, kategori: t.category, kataKunci: [t.title.toLowerCase()], ...topicFields(t) }));
  return [...known, ...extra];
}

const materiBudaya: Tool = {
  definition: {
    name: 'materi_budaya',
    description:
      'Materi resmi aplikasi tentang Taman Krida Budaya Jawa Timur dan kesenian Jawa Timur: sejarah, linimasa, dan ' +
      'makna/filosofi (mis. TKBJ, Tari Remo, Tari Topeng Malangan, Gandrung, Beskalan, Jaranan & Reog, Ludruk, ' +
      'Ketoprak, Wayang Kulit, Gamelan, Arsitektur Joglo). Pakai SEBELUM menjelaskan sejarah atau makna kesenian.',
    parameters: {
      type: 'object',
      properties: {
        topik: { type: 'string', description: 'Nama kesenian atau topik, mis. "tari remo" atau "taman krida". Kosongkan untuk daftar topik.' },
      },
      additionalProperties: false,
    },
  },
  run: async (input) => {
    const entries = await cultureEntries();
    const found = findCulture(textOf(input.topik, 80), entries).slice(0, 2);
    const topics = entries.map((e) => e.judul);
    if (!found.length) {
      return { ditemukan: false, catatan: 'Topik tidak ada di materi aplikasi. Boleh dijawab dari pengetahuan umum bila yakin benar.', topik_tersedia: topics };
    }
    return {
      ditemukan: true,
      materi: found.map((e) => ({
        judul: e.judul,
        kategori: e.kategori,
        id_materi_aplikasi: e.idMateri,
        ringkasan: e.ringkasan,
        sejarah: e.sejarah,
        linimasa: e.linimasa,
        makna: e.makna,
      })),
    };
  },
};

export const ASSISTANT_TOOLS = [cariAcara, infoFasilitas, cekJadwalSewa, cariKomunitas, infoLayanan, materiBudaya];
export const toolSpecs: ToolSpec[] = ASSISTANT_TOOLS.map((t) => t.definition);

/** Jalankan alat sesuai nama dari model. Error dikembalikan sebagai data agar model bisa menjelaskannya. */
export async function runTool(name: string, input: unknown): Promise<{ data: unknown; isError: boolean }> {
  const tool = ASSISTANT_TOOLS.find((t) => t.definition.name === name);
  if (!tool) return { data: `Alat "${name}" tidak tersedia.`, isError: true };
  const args = input && typeof input === 'object' ? (input as Input) : {};
  return { data: await tool.run(args), isError: false };
}

// ------------------------------------------------------------------ Tautan ke layar aplikasi

/** Jenis tombol yang bisa disarankan asisten di bawah jawaban. Sama dengan AssistantLinkKind di Flutter. */
export const LINK_KINDS = ['acara', 'sewa', 'komunitas', 'kalender', 'tiket_saya', 'galeri', 'edukasi', 'profil'] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

const FIXED_LABELS: Partial<Record<LinkKind, string>> = {
  kalender: 'Buka Kalender Acara',
  tiket_saya: 'Lihat Tiket Saya',
  galeri: 'Buka Virtual Galeri',
  edukasi: 'Buka Edukasi Budaya',
  profil: 'Lihat Profil & Denah',
};

/**
 * Ubah saran tautan dari model menjadi tombol yang PASTI valid: id acara/komunitas/venue dicek ke database,
 * label dibuat server (bukan teks model). Saran yang tidak valid dibuang. Maksimal 3 tombol.
 */
export async function resolveLinks(raw: unknown): Promise<{ kind: LinkKind; id?: string; label: string }[]> {
  const items = Array.isArray(raw) ? raw.slice(0, 6) : [];
  const links: { kind: LinkKind; id?: string; label: string }[] = [];
  const holdHours = payDeadlineHours(await getSettings());
  for (const item of items) {
    const kind = (item as Input)?.jenis as LinkKind;
    const id = textOf((item as Input)?.id, 80);
    if (!LINK_KINDS.includes(kind)) continue;
    let link: (typeof links)[number] | null = null;
    if (kind === 'acara') {
      const event = id ? await findPublishedEvent(id, holdHours) : null;
      if (event) link = { kind, id, label: `Lihat ${event.short || event.name}` };
    } else if (kind === 'komunitas') {
      const community = id ? await findActiveCommunity(id) : null;
      if (community) link = { kind, id, label: `Profil ${community.name}` };
    } else if (kind === 'sewa') {
      const facility = id ? await findFacilityById(id) : null;
      link = facility && rentalRateOf(facility) !== null ? { kind, id, label: `Sewa ${facility.name}` } : { kind, label: 'Ajukan Sewa Gedung' };
    } else if (kind === 'edukasi') {
      // id = id materi Edukasi Budaya yang terpublikasi → tombol langsung ke materinya.
      const topic = id ? await findPublishedCultureTopic(id) : null;
      link = topic ? { kind, id, label: `Baca materi ${topic.title}` } : { kind, label: FIXED_LABELS.edukasi! };
    } else {
      link = { kind, label: FIXED_LABELS[kind]! };
    }
    if (link && !links.some((l) => l.kind === link!.kind && l.id === link!.id)) links.push(link);
    if (links.length === 3) break;
  }
  return links;
}
