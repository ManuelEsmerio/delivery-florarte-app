import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export type DriverJwtPayload = JWTPayload & {
  driverId: number;
  email: string;
  name: string;
  role: string;
  tokenVersion: number;
};

export const DRIVER_SESSION_COOKIE = 'driver_session_token';

const FALLBACK_JWT_SECRET = 'dev-only-jwt-secret-change-in-production';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (secret) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET no esta configurada.');
  }

  return new TextEncoder().encode(FALLBACK_JWT_SECRET);
}

export function getBearerToken(authorizationHeader?: string | null) {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  return token;
}

export async function createDriverSessionToken(user: {
  id: number;
  email: string;
  name: string;
  role: string;
  tokenVersion: number;
}) {
  return new SignJWT({
    driverId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tokenVersion: user.tokenVersion,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(getJwtSecret());
}

export async function verifyDriverSessionToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as DriverJwtPayload;
}