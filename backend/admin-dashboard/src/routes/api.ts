import express, { Router } from 'express';
import { config } from '../config/env';
import * as communities from '../controllers/communityController';
import * as contents from '../controllers/contentController';
import * as dashboard from '../controllers/dashboardController';
import * as events from '../controllers/eventController';
import * as feed from '../controllers/feedController';
import * as media from '../controllers/mediaController';
import * as notes from '../controllers/noteController';
import * as orders from '../controllers/orderController';
import * as profile from '../controllers/profileController';
import * as rentals from '../controllers/rentalController';
import { search } from '../controllers/searchController';
import * as settings from '../controllers/settingsController';
import * as users from '../controllers/userController';
import * as visitorFiles from '../controllers/visitorFileController';
import { authMiddleware } from '../middleware/authMiddleware';
import uploadRoutes from './upload.routes';
import { requireAccess, requireRole, requireView } from '../middleware/requireRole';
import {
  validateContent,
  validateContentUpdate,
  validateEvent,
  validateMediaMeta,
  validateNote,
  validateProfile,
  validateRental,
} from '../middleware/validator';

const router = Router();

// ==========================================
// RUTE PUBLIK
// ==========================================
router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'tkbj-admin-api', today: config.today });
});

// Autentikasi (register, login, logout, me) ada di routes/authRoutes.ts, dipasang di /api/auth oleh app.ts.

// Upload & dokumen staf (Modul 03) — router sendiri, authMiddleware dipasang di upload.routes.ts
router.use('/upload', uploadRoutes);

// ==========================================
// RUTE TERLINDUNGI (wajib login via authMiddleware)
// ==========================================
router.use(authMiddleware);

// Otorisasi (RBAC): requireView = boleh melihat modul (403 bila "n"), requireAccess = boleh mengubah ("y").
// Rute ubah memakai keduanya: peran tanpa akses modul mendapat pesan yang sama dengan saat membuka modul.
// Dashboard, aktivitas, notifikasi, dan pencarian terbuka untuk semua staf, tetapi isinya disaring per peran.
router.get('/dashboard/summary', dashboard.getSummary);
router.get('/finance/monthly', requireView('payments'), dashboard.getFinanceMonthly);

// Acara & tiket
const eventsEdit = [requireView('events'), requireAccess('events')];
router.get('/events', requireView('events'), events.getEvents);
router.post('/events', eventsEdit, validateEvent, events.createEvent);
router.post('/events/reset', eventsEdit, events.resetEvents);
router.get('/events/:id', requireView('events'), events.getEvent);
router.put('/events/:id', eventsEdit, validateEvent, events.replaceEvent);
router.patch('/events/:id', eventsEdit, events.patchEvent);
router.delete('/events/:id', eventsEdit, events.removeEvent);

// Transaksi (daftar pesanan tiket juga boleh dibaca peran Acara, dicek di controller)
const paymentsEdit = [requireView('payments'), requireAccess('payments')];
router.get('/orders', orders.getOrders);
router.get('/orders/export.csv', requireView('payments'), orders.exportOrdersCsv);
router.get('/orders/:id', requireView('payments'), orders.getOrder);
router.get('/orders/:id/proof', requireView('payments'), visitorFiles.getOrderProof);
router.post('/orders/:id/verify', paymentsEdit, orders.verifyOrder);
router.post('/orders/:id/reject', paymentsEdit, orders.rejectOrder);
router.post('/orders/:id/payment', paymentsEdit, orders.recordPayment);

// Sewa gedung
const rentalsEdit = [requireView('rentals'), requireAccess('rentals')];
router.get('/rentals', requireView('rentals'), rentals.getRentals);
router.post('/rentals', rentalsEdit, validateRental, rentals.createRentalRequest);
router.get('/rentals/:id', requireView('rentals'), rentals.getRental);
router.get('/rentals/:id/documents', requireView('rentals'), visitorFiles.getRentalDocuments);
router.get('/rentals/:id/documents/:fileId', requireView('rentals'), visitorFiles.getRentalDocument);
router.post('/rentals/:id/approve', rentalsEdit, rentals.approveRental);
router.post('/rentals/:id/reject', rentalsEdit, rentals.rejectRental);
router.post('/rentals/:id/files-complete', rentalsEdit, rentals.completeRentalFiles);

// Informasi & komunitas: profil, fasilitas, galeri, konten, komunitas
const infoView = requireView('info');
const infoEdit = [requireView('info'), requireAccess('info')];
router.get('/profile', infoView, profile.getProfile);
router.put('/profile', infoEdit, validateProfile, profile.saveProfile);
router.get('/facilities', infoView, profile.getFacilities);
router.post('/facilities', infoEdit, profile.addFacility);
router.put('/facilities/:id', infoEdit, profile.editFacility);

router.get('/media', infoView, media.getMedia);
router.post(
  '/media',
  infoEdit,
  express.raw({ type: ['image/*', 'video/*'], limit: `${config.uploadLimitMb}mb` }),
  media.uploadMedia,
);
router.put('/media/:id', infoEdit, validateMediaMeta, media.editMedia);
router.patch('/media/:id', infoEdit, media.setMediaStatus);
router.delete('/media/:id', infoEdit, media.removeMedia);

router.get('/contents', infoView, contents.getContents);
router.post('/contents', infoEdit, validateContent, contents.addContent);
router.put('/contents/:id', infoEdit, validateContentUpdate, contents.editContent);

router.get('/communities', infoView, communities.getCommunities);
router.post('/communities', infoEdit, communities.addCommunity);
router.post('/communities/:id/approve', infoEdit, communities.approveCommunity);
router.post('/communities/:id/reject', infoEdit, communities.rejectCommunity);
router.patch('/communities/:id', infoEdit, communities.setCommunityStatus);

// Catatan staf (Modul 02): semua staf, data dibatasi ke pemiliknya di controller (anti-IDOR)
router.get('/notes', notes.getNotes);
router.post('/notes', validateNote, notes.addNote);
router.put('/notes/:id', validateNote, notes.editNote);
router.delete('/notes/:id', notes.removeNote);
router.patch('/notes/:id/archive', notes.archiveNote);

// Aktivitas, notifikasi, pencarian
router.get('/activity', feed.getActivity);
router.get('/notifications', feed.getNotifications);
router.post('/notifications/read-all', feed.readAllNotifications);
router.post('/notifications/:id/read', feed.readNotification);
router.get('/search', search);

// Pengguna & pengaturan: hanya Administrator utama (requireRole membaca req.user dari authMiddleware)
const adminView = requireRole('admin');
const adminEdit = requireRole('admin');
router.get('/users', adminView, users.getUsers);
router.get('/users/roles', adminView, users.getRoles);
router.post('/users', adminEdit, users.inviteUser);
router.post('/users/:id/approve', adminEdit, users.approveUser);
router.post('/users/:id/reject', adminEdit, users.rejectUser);
router.patch('/users/:id', adminEdit, users.updateUser);

router.get('/settings', adminView, settings.getPanelSettings);
router.put('/settings', adminEdit, settings.savePanelSettings);
router.post('/settings/reset', adminEdit, settings.resetPanelSettings);

export default router;
