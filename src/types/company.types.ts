export type CompanyStatus = 'active' | 'inactive' | 'banned';

export interface CompanyRow {
  id: string;
  name: string;
  nif: string;
  sector: string | null;
  status: CompanyStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  name: string;
  nif: string;
  sector: string | null;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyData {
  name: string;
  nif: string;
  sector?: string | null;
}
