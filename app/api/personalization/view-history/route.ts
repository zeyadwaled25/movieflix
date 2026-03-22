import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/server/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret");

export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const decoded = await jwtVerify(token, secret);
    const userId = decoded.payload.sub as string;
    const { mediaId, mediaType } = await request.json();

    if (!mediaId || !mediaType) {
      return NextResponse.json(
        { error: "mediaId and mediaType required" },
        { status: 400 }
      );
    }

    const result = await prisma.viewHistory.create({
      data: { userId, mediaId, mediaType },
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
