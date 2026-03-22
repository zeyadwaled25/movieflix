import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server/session";
import { getRecommendations } from "@/lib/personalization";

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
    const recommendations = await getRecommendations(session.userId);
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    return NextResponse.json(
      { message: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
