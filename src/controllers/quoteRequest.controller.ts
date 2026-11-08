import type { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { quoteRequestService } from '../services/quoteRequest.service';
import type {
  CreateQuoteRequestInput,
  ListQuoteRequestsQuery,
  QuoteRequestIdParam,
  UpdateQuoteRequestStatusInput,
} from '../validators/quoteRequest.validator';

const create = asyncHandler(
  async (req: Request<unknown, unknown, CreateQuoteRequestInput>, res: Response) => {
    const quoteRequest = await quoteRequestService.create(req.body);
    res.status(201).json({ status: 'success', data: quoteRequest });
  }
);

const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await quoteRequestService.list(req.query as unknown as ListQuoteRequestsQuery);
  res.status(200).json({
    status: 'success',
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

const updateStatus = asyncHandler(
  async (
    req: Request<QuoteRequestIdParam, unknown, UpdateQuoteRequestStatusInput>,
    res: Response
  ) => {
    const quoteRequest = await quoteRequestService.updateStatus(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: quoteRequest });
  }
);

export const quoteRequestController = { create, list, updateStatus };
