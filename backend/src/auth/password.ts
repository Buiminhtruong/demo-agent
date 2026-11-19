import { compare, hash } from 'bcryptjs';

const BCRYPT_COST = 10;

export function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}
