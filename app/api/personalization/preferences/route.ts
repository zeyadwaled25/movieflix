import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server/session";
import { getUserPreferences, saveUserPreference } from "@/lib/personalization";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const preferences = await getUserPreferences(session.userId);
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Failed to get preferences:", error);
    return NextResponse.json(
      { message: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { message: "Missing key or value" },
        { status: 400 }
      );
    }

    await saveUserPreference(session.userId, key, value);
    return NextResponse.json({ message: "Preference saved successfully" });
  } catch (error) {
    console.error("Failed to save preference:", error);
    return NextResponse.json(
      { message: "Failed to save preference" },
      { status: 500 }
    );
  }
}
