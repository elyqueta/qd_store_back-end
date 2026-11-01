import { randomInt } from 'node:crypto';

const REFERENCE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateOrderReference(date = new Date()): string {
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const suffix = Array.from(
    { length: 6 },
    () => REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)]
  ).join('');

  return `QD-${datePart}-${suffix}`;
}
