import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { userId, sessionId } = getAuth(req); // ✅ pass the request object
    console.log("Auth Info:", getAuth(req));
  console.log("User ID:", userId);
  console.log("Session ID:", sessionId);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(`Hello, user ${userId}`);
}

