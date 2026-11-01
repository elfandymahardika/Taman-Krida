import { Router } from 'express';
import { handleDeleteDocument, handleGetDocuments, handleUpload } from '../controllers/upload.controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// Seluruh endpoint wajib terautentikasi
router.use(authMiddleware);

router.post('/', uploadMiddleware, handleUpload);
router.get('/list', handleGetDocuments);
router.delete('/:id', handleDeleteDocument);

export default router;
