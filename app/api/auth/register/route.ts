import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/server/store";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/server/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
  };

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  const errors: string[] = [];
  if (name.length < 3) errors.push("Name must be at least 3 characters");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) errors.push("Please enter a valid email address");

  if (password.length < 6) errors.push("Password must be at least 6 characters");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
  if (!/[!@#$%^&*]/.test(password)) errors.push("Password must contain at least one special character (!@#$%^&*)");

  const existing = await findUserByEmail(email);
  if (existing) errors.push("Email already registered");

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser(name, email, passwordHash);
  const token = await createSessionToken({ userId: user.id, email: user.email, name: user.name });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}