import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server/session";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { mediaId, mediaType } = await request.json();

    if (!mediaId || !mediaType) {
      return NextResponse.json(
        { error: "mediaId and mediaType required" },
        { status: 400 }
      );
    }

    const result = await prisma.viewHistory.create({
      data: { userId: session.userId, mediaId, mediaType },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
