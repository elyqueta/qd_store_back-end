export interface UserCompanyRow {
  id_user: string;
  id_company: string;
  role: string | null;
  created_at: Date;
}

export interface UserCompany {
  userId: string;
  companyId: string;
  role: string | null;
  createdAt: Date;
}

export interface CreateUserCompanyData {
  userId: string;
  companyId: string;
  role?: string | null;
}
