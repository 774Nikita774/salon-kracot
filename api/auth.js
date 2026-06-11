// lib/auth.js
import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'change-me-in-vercel-env';
const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 часа

export function generateToken(payload) {
  const data = {
    ...payload,
    exp: Date.now() + TOKEN_TTL
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyToken(token) {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;

    const expected = crypto
      .createHmac('sha256', SECRET)
      .update(encoded)
      .digest('base64url');

    // Сравнение constant-time
    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return null;
    }

    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (data.exp < Date.now()) return null;

    return data;
  } catch {
    return null;
  }
}

export function authenticateRequest(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return verifyToken(header.slice(7));
}