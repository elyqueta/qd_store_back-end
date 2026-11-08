import type { NextFunction, Request, Response } from 'express';

function setCacheControl(value: string) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('Cache-Control', value);
    next();
  };
}

export const privateNoStore = setCacheControl('private, no-store');

function publicCache(value: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Let Express evaluate If-None-Match after refreshing the representation.
    if (req.headers['if-none-match']) {
      delete req.headers['cache-control'];
      delete req.headers.pragma;
    }

    res.setHeader('Cache-Control', value);
    next();
  };
}

export const publicReadCache = publicCache('public, max-age=60, must-revalidate');
export const publicReferenceCache = publicCache(
  'public, max-age=300, stale-while-revalidate=600'
);
