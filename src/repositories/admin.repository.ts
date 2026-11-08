import { query } from '../database/pool';

export interface AdminDashboardSummary {
  products: number;
  categories: number;
  activeDeliveryTypes: number;
  companies: number;
}

async function getDashboardSummary(): Promise<AdminDashboardSummary> {
  const result = await query<AdminDashboardSummary>(
    `SELECT
       (SELECT COUNT(*)::int FROM product) AS products,
       (SELECT COUNT(*)::int FROM category) AS categories,
       (SELECT COUNT(*)::int FROM delivery_type WHERE is_active = true) AS "activeDeliveryTypes",
       (SELECT COUNT(*)::int FROM company) AS companies`
  );
  const summary = result.rows[0];

  if (!summary) {
    throw new Error('Não foi possível calcular o resumo do dashboard.');
  }

  return summary;
}

export const adminRepository = { getDashboardSummary };
