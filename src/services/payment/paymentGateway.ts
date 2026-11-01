import { PaymentMethodType } from '../../types/paymentMethod.types';

export interface GatewayPaymentRequest {
  orderId: string;
  orderReference: string;
  amount: number;
  methodType: PaymentMethodType;
  customerPhone?: string;
}

export type GatewayPaymentResult =
  | {
      methodType: 'multicaixa_express';
      status: 'confirmed' | 'failed';
      apiTransactionId: string;
      failureReason?: string;
    }
  | {
      methodType: 'multicaixa_reference';
      status: 'pending';
      entity: string;
      reference: string;
      expiresAt: Date;
    }
  | {
      methodType: 'bank_transfer';
      status: 'pending';
      destinationIban: string;
      destinationBank: string;
      destinationHolder: string;
    };

export interface PaymentGateway {
  readonly name: 'mock' | 'emis';
  initiate(request: GatewayPaymentRequest): Promise<GatewayPaymentResult>;
}
