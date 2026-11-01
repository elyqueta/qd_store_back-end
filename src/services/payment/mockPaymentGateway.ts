import { randomInt } from 'node:crypto';
import { env } from '../../config/env';
import { ConflictError } from '../../errors';
import { PaymentGateway, GatewayPaymentRequest, GatewayPaymentResult } from './paymentGateway';

const RANDOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomCode(length: number): string {
  return Array.from({ length }, () =>
    RANDOM_ALPHABET.charAt(randomInt(RANDOM_ALPHABET.length))
  ).join('');
}

class MockPaymentGateway implements PaymentGateway {
  readonly name = 'mock';

  initiate(request: GatewayPaymentRequest): Promise<GatewayPaymentResult> {
    console.warn(
      `Pagamento simulado (${request.methodType}) para a encomenda ${request.orderReference}.`
    );

    if (request.methodType === 'multicaixa_express') {
      if (!request.customerPhone) {
        throw new ConflictError('O telefone é obrigatório para Multicaixa Express.');
      }
      if (request.customerPhone === env.PAYMENT_MOCK_FAIL_PHONE) {
        return Promise.resolve({
          methodType: 'multicaixa_express',
          status: 'failed',
          apiTransactionId: `MOCK-${randomCode(12)}`,
          failureReason: 'Pagamento recusado (simulação).',
        });
      }
      return Promise.resolve({
        methodType: 'multicaixa_express',
        status: 'confirmed',
        apiTransactionId: `MOCK-${randomCode(12)}`,
      });
    }

    if (request.methodType === 'multicaixa_reference') {
      const expiresAt = new Date(Date.now() + env.PAYMENT_REFERENCE_TTL_HOURS * 60 * 60 * 1000);
      return Promise.resolve({
        methodType: 'multicaixa_reference',
        status: 'pending',
        entity: env.PAYMENT_MULTICAIXA_ENTITY,
        reference: String(randomInt(1_000_000_000)).padStart(9, '0'),
        expiresAt,
      });
    }

    return Promise.resolve({
      methodType: 'bank_transfer',
      status: 'pending',
      destinationIban: env.BANK_TRANSFER_IBAN,
      destinationBank: env.BANK_TRANSFER_BANK,
      destinationHolder: env.BANK_TRANSFER_HOLDER,
    });
  }
}

export const mockPaymentGateway = new MockPaymentGateway();
