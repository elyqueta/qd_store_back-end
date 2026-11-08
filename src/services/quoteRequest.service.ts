import { quoteRequestRepository } from '../repositories/quoteRequest.repository';
import type {
  CreateQuoteRequestInput,
  ListQuoteRequestsQuery,
  UpdateQuoteRequestStatusInput,
} from '../validators/quoteRequest.validator';
import type { QuoteRequest, QuoteRequestListResult } from '../types/quoteRequest.types';

async function create(input: CreateQuoteRequestInput): Promise<QuoteRequest> {
  return quoteRequestRepository.create(input);
}

async function list(input: ListQuoteRequestsQuery): Promise<QuoteRequestListResult> {
  const { page, limit, ...filters } = input;
  return quoteRequestRepository.findAll(filters, page, limit);
}

async function updateStatus(
  id: string,
  input: UpdateQuoteRequestStatusInput
): Promise<QuoteRequest> {
  return quoteRequestRepository.updateStatus(id, input);
}

export const quoteRequestService = { create, list, updateStatus };
