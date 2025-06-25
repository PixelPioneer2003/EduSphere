import { NextResponse } from "next/server";
import {auth}  from "@clerk/nextjs/server";
import { db } from "@/lib/db";
// import { fetchUserData } from "@/app/(dashboard)/(routes)/(root)/page";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth();
   //find userId from auth
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    //find course by courseId and userId
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
      include: {
        chapters: {
          include: {
            muxData: true,
          }
        }
      }
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }
   // atlest one chapter should be published
    const hasPublishedChapter = course.chapters.some((chapter) => chapter.isPublished);
   // all details should be present to publish the course
    if (!course.title || !course.description || !course.imageUrl || !course.categoryId || !hasPublishedChapter) {
      return new NextResponse("Missing required fields", { status: 401 });
    }
    // Update the course to set isPublished to true
    const publishedCourse = await db.course.update({
      where: {
        id: params.courseId,
        userId,
      },
      data: {
        isPublished: true,
      }
    });

    return NextResponse.json(publishedCourse);
  } catch (error) {
    console.log("[COURSE_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  } 
}