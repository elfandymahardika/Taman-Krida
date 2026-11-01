import { Router } from 'express';
import { config } from '../config/env';
import * as communities from '../controllers/communityController';
import * as events from '../controllers/eventController';
import { downloadFile } from '../controllers/fileController';
import * as info from '../controllers/infoController';
import * as notifications from '../controllers/notificationController';
import * as rentals from '../controllers/rentalController';
import * as tickets from '../controllers/ticketController';
import { authMiddleware } from '../middleware/authMiddleware';
import { proofUpload, rentalDocumentsUpload } from '../middleware/upload.middleware';
import {
  validateCheckout,
  validateCommunity,
  validatePayment,
  validateRentalRequest,
} from '../middleware/validator';

const router = Router();

// ==========================================
// RUTE PUBLIK (tanpa login): informasi yang tampil di aplikasi sebelum masuk
// ==========================================
router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'tkbj-mobile-api', today: config.today });
});

router.get('/meta', info.getMeta);
router.get('/home', info.getHome);
router.get('/profile', info.getProfile);
router.get('/facilities', info.getFacilities);

router.get('/events', events.getEvents);
router.get('/events/:id', events.getEvent);

router.get('/gallery', info.getGallery);
router.get('/gallery/collections', info.getGalleryCollections);
router.get('/gallery/:id', info.getGalleryItem);

router.get('/contents', info.getContents);
router.get('/contents/:id', info.getContent);

router.get('/communities', communities.getCommunities);
router.get('/communities/:id', communities.getCommunity);

// Kalender ketersediaan venue boleh dilihat sebelum login (Cek Jadwal)
router.get('/rentals/availability', rentals.getAvailability);

// Autentikasi pengunjung (register, login, logout, me, password) ada di routes/authRoutes.ts → /api/auth.

// ==========================================
// RUTE TERLINDUNGI (wajib login via authMiddleware). Data selalu dibatasi ke pemiliknya (anti-IDOR).
// ==========================================
router.use(authMiddleware);

// Tiket: checkout → unggah bukti bayar → admin verifikasi → e-tiket aktif
router.get('/tickets', tickets.getBookings);
router.post('/tickets/checkout', validateCheckout, tickets.checkout);
router.get('/tickets/:code', tickets.getBooking);
router.post('/tickets/:code/payment', proofUpload, validatePayment, tickets.payBooking);

// Sewa gedung: ajukan (+3 berkas) → admin setujui/tolak → bayar tagihan → bukti reservasi
router.get('/rentals', rentals.getRentals);
router.post('/rentals', rentalDocumentsUpload, validateRentalRequest, rentals.createRental);
router.get('/rentals/:id', rentals.getRental);
router.post('/rentals/:id/payment', proofUpload, validatePayment, rentals.payRental);

// Komunitas: daftarkan → admin setujui → tampil di direktori
router.post('/communities', validateCommunity, communities.registerCommunity);
router.get('/me/communities', communities.getMyCommunities);

// Notifikasi akun & berkas pribadi
router.get('/notifications', notifications.getNotifications);
router.post('/notifications/read-all', notifications.readAllNotifications);
router.post('/notifications/:id/read', notifications.readNotification);
router.get('/files/:id', downloadFile);

export default router;
