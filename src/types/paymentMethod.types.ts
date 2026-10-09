/** Valores possíveis da coluna payment_method.type. */
export type PaymentMethodType = 'multicaixa_express' | 'multicaixa_reference' | 'bank_transfer';

/** Formato exacto devolvido pelo Postgres; só o repository deve conhecê-lo. */
export interface PaymentMethodRow {
  id: string;
  name: string;
  type: PaymentMethodType;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Formato de domínio usado pelo service, controller e resposta HTTP. */
export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Dados necessários para criar um método; isActive nasce pelo DEFAULT da tabela. */
export interface CreatePaymentMethodData {
  name: string;
  type: PaymentMethodType;
}
