import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";

const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

if (!muxTokenId || !muxTokenSecret) {
  console.error("[MUX_ERROR] Missing Mux environment variables.");
  throw new Error("MUX_TOKEN_ID and MUX_TOKEN_SECRET must be defined.");
}

const mux = new Mux({
  tokenId: muxTokenId,
  tokenSecret: muxTokenSecret,
});


interface Params {
  params: Promise<{ courseId: string }>;
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const { userId } = await auth();

    if (!userId) {
      console.warn("[AUTH] Unauthorized access - missing userId");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log(`[DELETE] Deleting course: ${resolvedParams.courseId}`);

    const ownCourse = await db.course.findUnique({
      where: { id: resolvedParams.courseId, userId },
      include: {
        chapters: {
          include: { muxData: true },
        },
      },
    });

    if (!ownCourse) {
      console.warn("[AUTH] Unauthorized - course does not belong to user");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    for (const chapter of ownCourse.chapters) {
      if (chapter.muxData?.assetId) {
        await mux.video.assets.delete(chapter.muxData.assetId);
        console.log(`[DELETE] Mux asset deleted for chapter: ${chapter.id}`);
      }
    }

    const deletedCourse = await db.course.delete({
      where: { id: resolvedParams.courseId },
    });

    console.log(`[DELETE] Course deleted: ${deletedCourse.id}`);
    return NextResponse.json(deletedCourse);
  } catch (error) {
    console.error("[COURSE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const { userId } = await auth();
    const values = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.update({
      where: {
        id: resolvedParams.courseId,
        userId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error("[COURSE_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

