/** Batas yang sama dengan middleware Multer di backend (upload.middleware.ts). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp'

export type DocumentItem = {
  id: string
  name: string
  fileType: string
  fileSize: number
  url: string
  userId: number
  owner?: string
  createdAt: string
}

export const isImage = (d: DocumentItem) => d.fileType.startsWith('image/')
export const isPdf = (d: DocumentItem) => d.fileType === 'application/pdf'
