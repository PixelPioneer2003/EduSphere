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

// ✅ Correct: Don't destructure, keep full Mux instance
const mux = new Mux(muxTokenId, muxTokenSecret);


export async function DELETE(
    req: Request,
    {params}: {params: { courseId: string; }})
    {
        try{
                const { userId } = await auth();
                if (!userId) {
                    console.warn("[AUTH] Unauthorized access - missing userId");
                    return new NextResponse("Unauthorized", { status: 401 });
                }
                console.log(`[DELETE] Deleting course: ${params.courseId}`);
                // ✅ Verify course ownership
                const ownCourse = await db.course.findUnique({
                    where: { id: params.courseId, userId },
                    include: {
                        chapters: {
                            include: {
                                muxData: true,
                            }
                        }
                    }
                });
                if (!ownCourse) {
                    console.warn("[AUTH] Unauthorized - course does not belong to user");
                    return new NextResponse("Unauthorized", { status: 401 });
                }
                // ✅ Delete Mux assets for each chapter
                for (const chapter of ownCourse.chapters) {
                    if (chapter.muxData?.assetId) {
                        await mux.video.assets.delete(chapter.muxData.assetId);
                        console.log(`[DELETE] Mux asset deleted for chapter: ${chapter.id}`);
                    }
                }
                // ✅ Delete the course and its chapters 
                const deletedCourse = await db.course.delete({
                    where: { id: params.courseId},
                });
                console.log(`[DELETE] Course deleted: ${deletedCourse.id}`);
                return NextResponse.json(deletedCourse);
        }
        catch (error) {
            console.log("[COURSE_ID_DELETE]", error);
            return new NextResponse("Internal Error", { status: 500 });
        }

    }
export async function PATCH(
    req: Request,
    {params}: {params: { courseId: string }}
) {
    try {
        const { userId } =await auth();
        const {courseId} = params;
        const values = await req.json();

        if(!userId) return new NextResponse("Unauthorized", { status: 401 })

        const course = await db.course.update({
            where: {
                id: courseId,
                userId
            },
            data: {
                ...values
            }
        })

        return NextResponse.json(course);
        
    } catch (error) {
        console.log("[COURSE_ID]", error)
        return new NextResponse("Internal Error", {status: 500})
    }
}