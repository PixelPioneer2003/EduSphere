import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function POST(
  req: Request,
  { params }: Params
) {
  try {
    const resolvedParams = await params;
    const { userId } = await auth();
    const { url } = await req.json();

    console.log("COURSE_ID_ATTACHMENTS", url, resolvedParams.courseId);

    if (!userId) {
      return new NextResponse("Unauthorized attachment", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: resolvedParams.courseId,
        userId: userId,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const name = url ? url.split("/").pop() : "Untitled";

    const attachment = await db.attachment.create({
      data: {
        url,
        name,
        courseId: resolvedParams.courseId,
      },
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.log("COURSE_ID_ATTACHMENTS", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

