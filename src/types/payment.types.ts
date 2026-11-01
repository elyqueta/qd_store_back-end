import { PaymentMethodType } from './paymentMethod.types';

export type OrderPaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';
export type MulticaixaReferenceStatus = 'pending' | 'paid' | 'expired' | 'cancelled';

export interface OrderPaymentRow {
  id: string;
  id_order: string;
  id_payment_method: string;
  status: OrderPaymentStatus;
  transaction_reference: string | null;
  amount: string;
  amount_paid: string | null;
  paid_at: Date | null;
  notes: string | null;
  created_at: Date;
}

export interface PaymentExpressDetails {
  methodType: 'multicaixa_express';
  customerPhone: string | null;
  apiTransactionId: string | null;
}

export interface PaymentReferenceDetails {
  methodType: 'multicaixa_reference';
  entity: string;
  reference: string;
  expiresAt: Date;
  referenceStatus: MulticaixaReferenceStatus;
}

export interface PaymentBankTransferDetails {
  methodType: 'bank_transfer';
  destinationIban: string;
  destinationBank: string;
  destinationHolder: string;
  confirmedBy: string | null;
}

export interface PaymentDetailsRow {
  method_type: PaymentMethodType;
  customer_phone: string | null;
  api_transaction_id: string | null;
  entity: string | null;
  reference: string | null;
  expires_at: Date | null;
  reference_status: MulticaixaReferenceStatus | null;
  destination_iban: string | null;
  destination_bank: string | null;
  destination_holder: string | null;
  confirmed_by: string | null;
}

export interface Payment {
  id: string;
  orderId: string;
  methodType: PaymentMethodType;
  status: OrderPaymentStatus;
  amount: number;
  amountPaid: number | null;
  paidAt: Date | null;
  transactionReference: string | null;
  notes: string | null;
  createdAt: Date;
  details: PaymentExpressDetails | PaymentReferenceDetails | PaymentBankTransferDetails;
}

export type PaymentSummary = Pick<Payment, 'id' | 'methodType' | 'status'>;
