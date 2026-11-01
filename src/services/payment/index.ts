import { env } from '../../config/env';
import { PaymentGateway } from './paymentGateway';
import { mockPaymentGateway } from './mockPaymentGateway';

export function getPaymentGateway(): PaymentGateway {
  switch (env.PAYMENT_GATEWAY) {
    case 'mock':
      return mockPaymentGateway;
    default:
      throw new Error('O gateway de pagamento configurado ainda não está implementado.');
  }
}
