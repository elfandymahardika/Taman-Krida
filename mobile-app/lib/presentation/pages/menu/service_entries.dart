import 'package:flutter/material.dart';

import '../../routes/app_routes.dart';

/// Satu layanan TKBJ pada pintasan beranda & tab Jelajah.
class ServiceEntry {
  const ServiceEntry(
    this.icon,
    this.title,
    this.shortTitle,
    this.subtitle,
    this.route,
  );

  final IconData icon;
  final String title;

  /// Label ringkas untuk ikon pintasan di beranda.
  final String shortTitle;
  final String subtitle;
  final String route;
}

/// Tanya Krida tampil di tab Jelajah dan sebagai kartu sendiri di beranda
/// (tidak masuk kisi 4×2 pintasan beranda).
const assistantService = ServiceEntry(
  Icons.auto_awesome_outlined,
  'Tanya Krida (Asisten AI)',
  'Tanya Krida',
  'Tanya jadwal, tiket & sewa gedung, dijawab AI',
  AppRoutes.assistant,
);

const appServices = [
  ServiceEntry(
    Icons.map_outlined,
    'Profil & Denah Area',
    'Profil',
    'Sejarah singkat & peta lokasi fasilitas',
    AppRoutes.profile,
  ),
  ServiceEntry(
    Icons.event_note_outlined,
    'Kalender Acara',
    'Kalender',
    'Jadwal pertunjukan & wayang bulanan',
    AppRoutes.calendar,
  ),
  ServiceEntry(
    Icons.apartment_rounded,
    'Sewa Gedung',
    'Sewa Gedung',
    'Cek ketersediaan & sewa venue resmi',
    AppRoutes.rental,
  ),
  ServiceEntry(
    Icons.confirmation_number_outlined,
    'Tiket Pertunjukan',
    'Tiket',
    'Pemesanan & reservasi tiket online',
    AppRoutes.tickets,
  ),
  ServiceEntry(
    Icons.photo_library_outlined,
    'Virtual Galeri',
    'Galeri',
    'Arsip foto & video pementasan budaya',
    AppRoutes.gallery,
  ),
  ServiceEntry(
    Icons.groups_outlined,
    'Direktori Komunitas',
    'Komunitas',
    'Temukan sanggar & komunitas seni lokal',
    AppRoutes.communities,
  ),
  ServiceEntry(
    Icons.auto_stories_outlined,
    'Edukasi Budaya',
    'Edukasi',
    'Sejarah, filosofi & dokumentasi kesenian',
    AppRoutes.education,
  ),
];
