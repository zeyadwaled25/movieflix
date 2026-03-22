import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "movieflix_session";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
};

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "dev_only_movieflix_secret_change_me");

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name)
    };
  } catch {
    return null;
  }
}