import type { AccountType, User, UserRole, UserStatus } from './user.types';
import type { PaginatedResult } from './pagination.types';

export interface AdminUserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  accountType?: AccountType;
  sort: 'createdAt' | 'name' | 'email' | 'status';
}

export interface AdminCompany {
  id: string;
  name: string;
  nif: string;
  role: string | null;
  status: string;
}

export interface AdminUserDetail extends User {
  companies: AdminCompany[];
}

export type AdminUserListResult = PaginatedResult<User>;
