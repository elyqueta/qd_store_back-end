import { Request, Response } from 'express';
import { iconCatalog } from '../data/icon-catalog';

export function list(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'success',
    data: iconCatalog,
    count: iconCatalog.length,
  });
}

export const iconController = { list };
