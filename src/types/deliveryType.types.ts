/** Valores possíveis da coluna delivery_type.type. */
export type DeliveryMode = 'standard' | 'express' | 'corporate' | 'pickup';

/** Formato exacto devolvido pelo Postgres; só o repository deve conhecê-lo. */
export interface DeliveryTypeRow {
  id: string;
  name: string;
  description: string | null;
  price: string;
  type: DeliveryMode;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Formato de domínio usado pelo service, controller e resposta HTTP. */
export interface DeliveryType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: DeliveryMode;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Dados necessários para criar um tipo; isActive nasce pelo DEFAULT da tabela. */
export interface CreateDeliveryTypeData {
  name: string;
  description?: string | null;
  price: number;
  type: DeliveryMode;
}
