import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";

interface Params {
  params: Promise<{ courseId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const user = await currentUser();

    console.log("User:", user?.emailAddresses[0]?.emailAddress);

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id: resolvedParams.courseId, isPublished: true },
    });

    console.log("Course:", course?.title, course?.price);

    if (!course) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: resolvedParams.courseId,
        },
      },
    });

    console.log("Is purchase:", purchase);

    if (purchase) {
      return new NextResponse("Already Purchased", { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(course.price! * 100), // Amount in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        courseId: course.id,
        userId: user.id,
      },
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });

  } catch (error) {
    console.error("RAZORPAY_CHECKOUT_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

