import multer from 'multer';
import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../errors';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new ValidationError('A imagem deve ser JPEG, PNG, WebP ou AVIF.'));
      return;
    }
    callback(null, true);
  },
});

export function uploadImageFile(fieldName: 'image' | 'photo') {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.single(fieldName)(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'A imagem não pode exceder 8 MB.'
          : 'Envie uma única imagem no campo "image".';
      next(new ValidationError(message));
      return;
    }

    next(error);
    });
  };
}

export function uploadProductImage(req: Request, res: Response, next: NextFunction): void {
  uploadImageFile('image')(req, res, next);
}
