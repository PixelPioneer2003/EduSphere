import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";

// ✅ Validate Mux credentials
const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

if (!muxTokenId || !muxTokenSecret) {
  console.error("[MUX_ERROR] Missing Mux environment variables.");
  throw new Error("MUX_TOKEN_ID and MUX_TOKEN_SECRET must be defined.");
}

// ✅ Correct: Don't destructure, keep full Mux instance
const mux = new Mux(muxTokenId, muxTokenSecret);

//
// ✅ DELETE Handler with Comments
//
export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.warn("[AUTH] Unauthorized access - missing userId");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log(`[DELETE] Deleting chapter: ${params.chapterId} from course: ${params.courseId}`);

    // ✅ Verify course ownership
    const ownCourse = await db.course.findUnique({
      where: { id: params.courseId, userId },
    });

    if (!ownCourse) {
      console.warn("[AUTH] Unauthorized - course does not belong to user");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // ✅ Fetch chapter details
    const chapter = await db.chapter.findUnique({
      where: { id: params.chapterId, courseId: params.courseId },
    });

    if (!chapter) {
      console.warn(`[DELETE] Chapter not found: ${params.chapterId}`);
      return new NextResponse("Not Found", { status: 404 });
    }

    // ✅ Delete Mux asset if video exists
    if (chapter.videoUrl) {
      const existingMuxData = await db.muxData.findFirst({
        where: { chapterId: params.chapterId },
      });

      if (existingMuxData) {
        console.log(`[MUX] Deleting Mux asset: ${existingMuxData.assetId}`);
        await mux.video.assets.delete(existingMuxData.assetId);
        await db.muxData.delete({ where: { id: existingMuxData.id } });
      }
    }

    // ✅ Delete the chapter
    const deletedChapter = await db.chapter.delete({
      where: { id: params.chapterId },
    });

    // ✅ Unpublish course if no published chapters left
    const publishedChapters = await db.chapter.findMany({
      where: { courseId: params.courseId, isPublished: true },
    });

    if (publishedChapters.length === 0) {
      await db.course.update({
        where: { id: params.courseId },
        data: { isPublished: false },
      });
      console.log("[COURSE] Course unpublished - no published chapters left");
    }

    console.log("[DELETE] Chapter successfully deleted");
    return NextResponse.json(deletedChapter);

  } catch (error) {
    console.error("[DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

//
// ✅ PATCH Handler with Comments
//
export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.warn("[AUTH] Unauthorized access - missing userId");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { isPublished, ...values } = await req.json();
    console.log(`[PATCH] Updating chapter ${params.chapterId}`, values);

    // ✅ Verify course ownership
    const ownCourse = await db.course.findUnique({
      where: { id: params.courseId, userId },
    });

    if (!ownCourse) {
      console.warn("[AUTH] Unauthorized - course does not belong to user");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // ✅ Update chapter details
    const updatedChapter = await db.chapter.update({
      where: { id: params.chapterId, courseId: params.courseId },
      data: { ...values, isPublished },
    });

    // ✅ Handle video change and Mux asset recreation
    if (values.videoUrl) {
      console.log("[MUX] Video URL change detected:", values.videoUrl);

      const existingMuxData = await db.muxData.findFirst({
        where: { chapterId: params.chapterId },
      });

      if (existingMuxData) {
        console.log(`[MUX] Deleting old asset: ${existingMuxData.assetId}`);
        await mux.video.assets.delete(existingMuxData.assetId);
        await db.muxData.delete({ where: { id: existingMuxData.id } });
      }
     
      const asset = await mux.video.assets.create({
        input: values.videoUrl,
        playback_policy: "public",
        test: false,
      });

      await db.muxData.create({
        data: {
          chapterId: params.chapterId,
          assetId: asset.id,
          playbackId: asset.playback_ids?.[0]?.id || null,
        },
      });

      console.log("[MUX] New Mux asset created and saved:", asset.id);
    }

    console.log("[PATCH] Chapter updated successfully");
    return NextResponse.json(updatedChapter);

  } catch (error) {
    console.error("[PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
