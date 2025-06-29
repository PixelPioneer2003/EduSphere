import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ courseId: string; chapterId: string }>;
}

export async function PATCH(
  req: Request,
  { params }: Params
) {
  try {
    const resolvedParams = await params;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ownCourse = await db.course.findUnique({
      where: {
        id: resolvedParams.courseId,
        userId,
      },
    });

    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const unpublishedChapter = await db.chapter.update({
      where: {
        id: resolvedParams.chapterId,
        courseId: resolvedParams.courseId,
      },
      data: {
        isPublished: false,
      },
    });

    const publishedChaptersInCourse = await db.chapter.findMany({
      where: {
        courseId: resolvedParams.courseId,
        isPublished: true,
      },
    });

    if (publishedChaptersInCourse.length === 0) {
      await db.course.update({
        where: {
          id: resolvedParams.courseId,
        },
        data: {
          isPublished: false,
        },
      });
    }

    return NextResponse.json(unpublishedChapter);
  } catch (error) {
    console.error("[CHAPTER_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

