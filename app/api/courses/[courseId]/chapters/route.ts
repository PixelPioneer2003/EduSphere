import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
    const { title } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
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

    const lastChapter = await db.chapter.findFirst({
      where: {
        courseId: resolvedParams.courseId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = lastChapter ? lastChapter.position + 1 : 1;

    const chapter = await db.chapter.create({
      data: {
        title,
        courseId: resolvedParams.courseId,
        position: newPosition,
      },
    });

    return NextResponse.json(chapter, { status: 201 });
    
  } catch (error) {
    console.error("Error creating chapter:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

