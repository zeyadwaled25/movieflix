import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server/session";
import { rateMedia, getUserRatings } from "@/lib/personalization";

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
    const ratings = await getUserRatings(session.userId);
    return NextResponse.json({ ratings });
  } catch (error) {
    console.error("Failed to get ratings:", error);
    return NextResponse.json(
      { message: "Failed to get ratings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { mediaId, mediaType, rating } = body;

    if (!mediaId || !mediaType || rating === undefined) {
      return NextResponse.json(
        { message: "Missing mediaId, mediaType, or rating" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { message: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    await rateMedia(session.userId, mediaId, mediaType, rating);
    return NextResponse.json({ message: "Rating saved successfully" });
  } catch (error) {
    console.error("Failed to save rating:", error);
    return NextResponse.json(
      { message: "Failed to save rating" },
      { status: 500 }
    );
  }
}
