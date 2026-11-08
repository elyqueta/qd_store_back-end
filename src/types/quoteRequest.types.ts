import type { PaginatedResult } from './pagination.types';

export type QuoteRequestStatus = 'new' | 'contacted' | 'closed';

export interface QuoteRequest {
  id: string;
  companyName: string;
  nif: string;
  contactName: string;
  email: string;
  phone: string;
  province: string;
  municipality: string;
  sector: string;
  volume: string;
  categories: string[];
  message: string | null;
  status: QuoteRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteRequestFilters {
  search?: string;
  status?: QuoteRequestStatus;
}

export type QuoteRequestListResult = PaginatedResult<QuoteRequest>;
