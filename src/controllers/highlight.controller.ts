import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { highlightService } from '../services/highlight.service';
import { CreateHighlightInput, HighlightIdParam, ListHighlightsQuery, ReorderHighlightsInput, UpdateHighlightInput } from '../validators/highlight.validator';

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await highlightService.listPublic((req.query as unknown as ListHighlightsQuery).placement);
  res.status(200).json({ status: 'success', data: result, count: result.length });
});
const listAdmin = asyncHandler(async (req: Request, res: Response) => {
  const result = await highlightService.listAdmin((req.query as unknown as ListHighlightsQuery).placement);
  res.status(200).json({ status: 'success', data: result, count: result.length });
});
const create = asyncHandler(async (req: Request<Record<string, string>, unknown, CreateHighlightInput>, res: Response) => {
  res.status(201).json({ status: 'success', data: await highlightService.create(req.body, req.file) });
});
const update = asyncHandler(async (req: Request<HighlightIdParam, unknown, UpdateHighlightInput>, res: Response) => {
  res.status(200).json({ status: 'success', data: await highlightService.update(req.params.id, req.body, req.file) });
});
const remove = asyncHandler(async (req: Request<HighlightIdParam>, res: Response) => {
  await highlightService.remove(req.params.id);
  res.status(204).send();
});
const permanentlyRemove = asyncHandler(async (req: Request<HighlightIdParam>, res: Response) => {
  await highlightService.permanentlyRemove(req.params.id);
  res.status(204).send();
});
const reorder = asyncHandler(async (req: Request<Record<string, string>, unknown, ReorderHighlightsInput>, res: Response) => {
  await highlightService.reorder(req.body);
  res.status(204).send();
});
export const highlightController = { list, listAdmin, create, update, remove, permanentlyRemove, reorder };
