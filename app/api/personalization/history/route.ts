import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server/session";
import { getUserViewHistory } from "@/lib/personalization";

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
    const history = await getUserViewHistory(session.userId);
    return NextResponse.json({ history });
  } catch (error) {
    console.error("Failed to get view history:", error);
    return NextResponse.json(
      { message: "Failed to get view history" },
      { status: 500 }
    );
  }
}
