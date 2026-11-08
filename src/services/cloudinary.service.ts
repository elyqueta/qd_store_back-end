import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { ServiceUnavailableError } from '../errors';

export interface UploadedCloudinaryImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function assertConfigured(): void {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ServiceUnavailableError('O upload de imagens não está configurado no servidor.');
  }
}

async function uploadImage(
  buffer: Buffer,
  folder = 'qd-store/products'
): Promise<UploadedCloudinaryImage> {
  assertConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
      },
      (error, result) => {
        if (error) {
          const uploadError: Error =
            error instanceof Error
              ? error
              : new Error('Falha no upload da imagem para o Cloudinary.', { cause: error });
          reject(uploadError);
          return;
        }

        if (!result) {
          reject(new Error('Cloudinary não devolveu os dados da imagem enviada.'));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          sizeBytes: result.bytes,
        });
      }
    );

    stream.end(buffer);
  });
}

async function deleteImage(publicId: string): Promise<void> {
  assertConfigured();
  const result = (await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: 'image',
  })) as { result?: unknown };

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Cloudinary não confirmou a remoção do asset "${publicId}".`);
  }
}

function publicIdFromUrl(url: string): string | null {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const expectedPrefix = `/${env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
  if (
    parsedUrl.hostname !== 'res.cloudinary.com' ||
    !parsedUrl.pathname.startsWith(expectedPrefix)
  ) {
    return null;
  }

  const segments = parsedUrl.pathname.slice(expectedPrefix.length).split('/');
  const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
  if (versionIndex >= 0) {
    segments.splice(0, versionIndex + 1);
  } else if (segments[0]?.includes(',')) {
    segments.shift();
  }

  const lastSegment = segments.at(-1);
  if (!lastSegment) {
    return null;
  }

  segments[segments.length - 1] = lastSegment.replace(/\.[^.]+$/, '');
  const publicId = segments.join('/');
  return publicId.length > 0 ? publicId : null;
}

export const cloudinaryService = {
  uploadImage,
  deleteImage,
  publicIdFromUrl,
};
