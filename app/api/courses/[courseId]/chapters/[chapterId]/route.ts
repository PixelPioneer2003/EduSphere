import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
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

// DELETE handler
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const { courseId, chapterId } = await context.params;

  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const ownCourse = await db.course.findUnique({
      where: { id: courseId, userId },
    });
    if (!ownCourse) return new NextResponse("Unauthorized", { status: 401 });

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, courseId },
    });
    if (!chapter) return new NextResponse("Not Found", { status: 404 });

    if (chapter.videoUrl) {
      const existingMuxData = await db.muxData.findFirst({
        where: { chapterId },
      });
      if (existingMuxData) {
        await mux.video.assets.delete(existingMuxData.assetId);
        await db.muxData.delete({ where: { id: existingMuxData.id } });
      }
    }

    await db.chapter.delete({ where: { id: chapterId } });

    const publishedChapters = await db.chapter.findMany({
      where: { courseId, isPublished: true },
    });

    if (publishedChapters.length === 0) {
      await db.course.update({
        where: { id: courseId },
        data: { isPublished: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH handler
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const { courseId, chapterId } = await context.params;

  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { isPublished, ...values } = await req.json();

    const ownCourse = await db.course.findUnique({
      where: { id: courseId, userId },
    });
    if (!ownCourse) return new NextResponse("Unauthorized", { status: 401 });

    const updatedChapter = await db.chapter.update({
      where: { id: chapterId, courseId },
      data: { ...values, isPublished },
    });

    if (values.videoUrl) {
      const existingMuxData = await db.muxData.findFirst({
        where: { chapterId },
      });
      if (existingMuxData) {
        await mux.video.assets.delete(existingMuxData.assetId);
        await db.muxData.delete({ where: { id: existingMuxData.id } });
      }

      const asset = await mux.video.assets.create({
        inputs: [{ url: values.videoUrl }],
        playback_policy: ["public"],
      });

      await db.muxData.create({
        data: {
          chapterId,
          assetId: asset.id,
          playbackId: asset.playback_ids?.[0]?.id || null,
        },
      });
    }

    return NextResponse.json(updatedChapter);
  } catch (error) {
    console.error("[PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
