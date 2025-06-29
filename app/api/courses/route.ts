import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(
    req: Request,
) {
    try {
        const { userId } = await  auth();
        const { title } = await req.json();
        console.log("Creating course for user:", userId, "with title:", title);
        if(!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }
        const course = await db.course.create({
            data: {
                userId, 
                title
            }
        })

        return NextResponse.json(course)

    } catch (error) {
        console.log("[COURSES]", error)
        return new NextResponse("Internal Error", {status: 500})
    }
}

