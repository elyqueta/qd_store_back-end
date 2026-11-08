import { logger } from '../config/logger';
import { query } from '../database/pool';
import { cloudinaryService } from './cloudinary.service';

export async function enqueueCloudinaryDeletions(
  publicIds: Array<string | null | undefined>
): Promise<void> {
  const uniqueIds = [
    ...new Set(publicIds.filter((publicId): publicId is string => Boolean(publicId))),
  ];
  if (uniqueIds.length === 0) {
    return;
  }

  await query(
    `INSERT INTO cloudinary_asset_deletion (public_id)
     SELECT unnest($1::text[])
     ON CONFLICT (public_id) DO NOTHING`,
    [uniqueIds]
  );
}

export async function processCloudinaryDeletionQueue(): Promise<void> {
  let pending: Array<{ public_id: string }>;
  try {
    const result = await query<{ public_id: string }>(
      `SELECT public_id
       FROM cloudinary_asset_deletion
       ORDER BY created_at ASC
       LIMIT 50`
    );
    pending = result.rows;
  } catch (error) {
    logger.error({ err: error }, 'Falha ao consultar a fila de remoção do Cloudinary.');
    return;
  }

  for (const { public_id: publicId } of pending) {
    try {
      await cloudinaryService.deleteImage(publicId);
      await query('DELETE FROM cloudinary_asset_deletion WHERE public_id = $1', [publicId]);
    } catch (error) {
      logger.error(
        { err: error, publicId },
        'Não foi possível remover o asset Cloudinary; a remoção será tentada novamente.'
      );
    }
  }
}
